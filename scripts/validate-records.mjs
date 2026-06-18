#!/usr/bin/env node
// Pre-commit completeness check for plants.json. Run before committing a batch
// so partial / unreviewed records never ship.
//
// Flags any record that:
//   - still carries the `_needsReview` flag (curation not finished)
//   - is missing a required curated field (or has it empty)
//   - has no nativeStates (enrich-usda not run, or species not US-native)
//   - has no imageFile (enrich-images not run / no image found)
//   - collides on id with another record
//
// Exits non-zero if any record fails, so it can gate a commit.
//
// Usage:
//   node scripts/validate-records.mjs

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PLANTS_PATH = join(__dirname, '..', 'src', 'data', 'plants.json')

// Required curated fields and how to tell "empty" for each. Each test receives
// (value, record) so a field can be conditionally required.
const isEmptyArray = (v) => !Array.isArray(v) || v.length === 0
const REQUIRED = {
  scientificName: (v) => !v,
  family: (v) => !v,
  commonNames: isEmptyArray,
  generalAppearance: (v) => !v,
  lifespan: (v) => !v,
  heightFeet: (v) => !v || typeof v.max !== 'number',
  lightRequirement: isEmptyArray,
  soilMoisture: isEmptyArray,
  // Ferns (and other non-flowering forms) legitimately have no bloom.
  bloomMonths: (v, p) => p.generalAppearance !== 'fern' && isEmptyArray(v),
  notes: (v) => !v,
}

function main() {
  const plants = JSON.parse(readFileSync(PLANTS_PATH, 'utf8'))
  const problems = []
  const seenIds = new Map()

  for (const p of plants) {
    const id = p.id || '(no id)'
    const issues = []

    if (seenIds.has(id)) issues.push(`duplicate id (also at index ${seenIds.get(id)})`)
    seenIds.set(id, id)

    if (p._needsReview) issues.push('still flagged _needsReview')
    for (const [field, isEmpty] of Object.entries(REQUIRED)) {
      if (isEmpty(p[field], p)) issues.push(`missing/empty ${field}`)
    }
    if (!Array.isArray(p.nativeStates) || p.nativeStates.length === 0)
      issues.push('no nativeStates (run enrich-usda)')
    if (!p.imageFile) issues.push('no imageFile (run enrich-images)')

    if (issues.length) problems.push({ id, issues })
  }

  if (!problems.length) {
    console.log(`✓ All ${plants.length} records pass validation.`)
    return
  }

  console.error(`✗ ${problems.length} of ${plants.length} record(s) need attention:\n`)
  for (const { id, issues } of problems) {
    console.error(`  ${id}`)
    for (const i of issues) console.error(`    - ${i}`)
  }
  process.exit(1)
}

main()

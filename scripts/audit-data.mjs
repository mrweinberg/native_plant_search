#!/usr/bin/env node
// Data-quality audit for naming, families, and descriptions. Read-only.
//
//  A. Local consistency checks (instant):
//     - scientific name format (clean binomial)
//     - duplicate ids / scientific names
//     - family disagreement within a genus (one of them is wrong)
//     - notes vs leafRetention (notes say "evergreen" but field says deciduous, etc.)
//     - notes name a flower color absent from bloomColors
//  B. GBIF taxonomic backbone cross-check (network):
//     - flags names GBIF can't match exactly (likely typo/misspelling)
//     - flags names GBIF treats as a SYNONYM (we may be using an outdated name)
//     - flags family disagreements vs GBIF's authoritative family
//
// Usage:
//   node scripts/audit-data.mjs            # local checks + GBIF
//   node scripts/audit-data.mjs --local    # skip the network pass

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PLANTS_PATH = join(__dirname, '..', 'src', 'data', 'plants.json')
const LOCAL_ONLY = process.argv.includes('--local')
const COLORS = ['white', 'red', 'pink', 'orange', 'yellow', 'green', 'blue', 'purple', 'violet', 'brown', 'black']

const plants = JSON.parse(readFileSync(PLANTS_PATH, 'utf8'))

// ---------- A. local checks ----------
const localIssues = []
const byGenusFamily = new Map() // genus -> Set(family)
const seenId = new Map()
const seenName = new Map()

for (const p of plants) {
  const sci = p.scientificName || ''
  const genus = sci.split(/\s+/)[0]

  if (!/^[A-Z][a-z-]+ [a-z][a-z-]+/.test(sci)) {
    localIssues.push(`NAME FORMAT: "${sci}" (${p.id}) is not a clean binomial`)
  }
  if (seenId.has(p.id)) localIssues.push(`DUP ID: ${p.id}`)
  seenId.set(p.id, true)
  if (seenName.has(sci)) localIssues.push(`DUP NAME: ${sci} (${p.id} & ${seenName.get(sci)})`)
  seenName.set(sci, p.id)

  if (genus && p.family) {
    if (!byGenusFamily.has(genus)) byGenusFamily.set(genus, new Map())
    const fam = byGenusFamily.get(genus)
    fam.set(p.family, (fam.get(p.family) || 0) + 1)
  }

  const notes = (p.notes || '').toLowerCase()
  const ret = p.leafRetention
  if (/\bevergreen\b/.test(notes) && ret === 'deciduous')
    localIssues.push(`LEAF: ${sci} notes say "evergreen" but leafRetention=deciduous`)
  if (/\bdeciduous\b/.test(notes) && ret === 'evergreen')
    localIssues.push(`LEAF: ${sci} notes say "deciduous" but leafRetention=evergreen`)

  // Flower colors named in notes but missing from bloomColors (skip foliage/fruit/bark words nearby is hard; report as soft hint).
  const claimed = new Set(p.bloomColors || [])
  for (const c of COLORS) {
    if (claimed.has(c)) continue
    // only flag if the color word is adjacent to a flower word
    const re = new RegExp(`${c}[a-z-]*\\s+(flower|bloom|blossom|petal|bract|daisy|daisies|bell|spike|trumpet)`, 'i')
    if (re.test(notes)) localIssues.push(`COLOR?: ${sci} notes mention "${c}" flowers but bloomColors=[${[...claimed].join(',')}]`)
  }
}

for (const [genus, fams] of byGenusFamily) {
  if (fams.size > 1) {
    const parts = [...fams.entries()].map(([f, n]) => `${f}(${n})`).join(' vs ')
    localIssues.push(`FAMILY SPLIT: genus ${genus} -> ${parts}`)
  }
}

console.log(`=== Local checks: ${localIssues.length} issue(s) ===`)
for (const i of localIssues.sort()) console.log('  ' + i)

if (LOCAL_ONLY) process.exit(0)

// ---------- B. GBIF backbone cross-check ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
console.log(`\n=== GBIF taxonomic cross-check (${plants.length} names) ===`)
const gbifIssues = []
for (let i = 0; i < plants.length; i++) {
  const p = plants[i]
  const url = `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(p.scientificName)}&strict=false`
  try {
    const r = await fetch(url)
    const d = await r.json()
    if (!d || d.matchType === 'NONE') {
      gbifIssues.push(`NO MATCH: ${p.scientificName} (${p.id})`)
    } else {
      if (d.matchType === 'FUZZY')
        gbifIssues.push(`FUZZY: "${p.scientificName}" -> GBIF "${d.canonicalName || d.scientificName}" (possible misspelling)`)
      if (d.status && d.status !== 'ACCEPTED' && d.status !== 'DOUBTFUL')
        gbifIssues.push(`SYNONYM: ${p.scientificName} is ${d.status} of "${d.species || d.canonicalName}" per GBIF`)
      if (d.family && p.family && d.family !== p.family)
        gbifIssues.push(`FAMILY: ${p.scientificName} ours=${p.family} GBIF=${d.family}`)
    }
  } catch (e) {
    gbifIssues.push(`ERROR: ${p.scientificName} (${e.message})`)
  }
  if (i % 50 === 0) process.stdout.write(`  ${i}/${plants.length}\r`)
  await sleep(60)
}
console.log(`\n${gbifIssues.length} GBIF discrepancy(ies):`)
for (const i of gbifIssues.sort()) console.log('  ' + i)

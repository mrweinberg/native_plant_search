#!/usr/bin/env node
// Derive a `landscapeUses` tag list for every plant from existing traits, so the
// catalog can be filtered by garden role (border, hedge, groundcover, rain
// garden…) — matching what competitors expose, and powering curated themed
// lists. These are structural/placement uses; wildlife roles stay in
// `wildlifeValue`. Derivation is heuristic and re-runnable; refine by hand later.
//
// Usage: node scripts/enrich-landscape-uses.mjs

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PLANTS_PATH = join(__dirname, '..', 'src', 'data', 'plants.json')

// Canonical order for tidy, stable output.
const ORDER = [
  'specimen', 'hedge or screen', 'foundation', 'border', 'groundcover',
  'container', 'rain garden', 'erosion control', 'naturalizing',
]

function usesFor(p) {
  const ga = p.generalAppearance
  const H = p.heightFeet?.max ?? null
  const spread = p.spreadHabit
  const spreads = spread === 'spreading' || spread === 'aggressive'
  const moist = new Set(p.soilMoisture || [])
  const u = new Set()

  if (moist.has('wet')) u.add('rain garden')
  if (spreads) u.add('erosion control')

  if (ga === 'tree') {
    u.add('specimen')
    if (H && H <= 30) u.add('hedge or screen')
  } else if (ga === 'shrub') {
    if (H && H >= 5) u.add('hedge or screen')
    if (H && H <= 8) u.add('foundation')
    if (H && H >= 8) u.add('specimen')
    if (H && H <= 2 && spreads) u.add('groundcover')
  } else if (ga === 'forb' || ga === 'herb') {
    if (H && H >= 1 && H <= 5) u.add('border')
    if (H && H <= 1.25 && spreads) u.add('groundcover')
    if (spreads) u.add('naturalizing')
  } else if (ga === 'grass') {
    u.add('naturalizing')
    if (H && H >= 1 && H <= 4) u.add('border')
    if (H && H <= 1.5) u.add('groundcover')
    if (H && H >= 3) u.add('specimen')
  } else if (ga === 'fern') {
    u.add('naturalizing')
    if (H && H <= 2) u.add('groundcover')
  } else if (ga === 'vine') {
    u.add('erosion control')
    if (spreads) u.add('groundcover')
  }

  if (H && H <= 2 && spread !== 'aggressive' && ga !== 'tree') u.add('container')

  if (u.size === 0) {
    if (ga === 'tree' || ga === 'shrub') u.add('specimen')
    else if (ga === 'forb' || ga === 'herb') u.add('border')
    else u.add('naturalizing')
  }
  return ORDER.filter((x) => u.has(x))
}

const plants = JSON.parse(readFileSync(PLANTS_PATH, 'utf8'))
const counts = {}
for (const p of plants) {
  p.landscapeUses = usesFor(p)
  for (const u of p.landscapeUses) counts[u] = (counts[u] || 0) + 1
}
writeFileSync(PLANTS_PATH, JSON.stringify(plants, null, 2) + '\n')
console.log(`Tagged ${plants.length} plants. Counts:`)
for (const u of ORDER) console.log(`  ${u}: ${counts[u] || 0}`)

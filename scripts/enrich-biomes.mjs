#!/usr/bin/env node
// Derive each plant's `nativeBiomes` (CEC Level I) from its county distribution
// index and the county->biome crosswalk (scripts/gen-county-biomes.mjs), and
// write them into plants.json. A biome is kept only if it covers >= THRESHOLD of
// the plant's classified counties, which drops the long tail of naturalized
// outliers; biomes are ordered most-counties first. Plants with only state-level
// county data (e.g. Connecticut species) or in Hawaii get an empty list.
//
// Run after enrich-county.mjs (it reads the county index). Re-serializes
// plants.json at 1-space, like the other enrich scripts' downstream step.
//
// Usage: node scripts/enrich-biomes.mjs

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PLANTS = join(ROOT, 'src', 'data', 'plants.json')
const IDX = join(ROOT, 'src', 'data', 'county-index')
const THRESHOLD = 0.05

const USPS_FIP = { AL:'01',AK:'02',AZ:'04',AR:'05',CA:'06',CO:'08',CT:'09',DE:'10',DC:'11',FL:'12',GA:'13',HI:'15',ID:'16',IL:'17',IN:'18',IA:'19',KS:'20',KY:'21',LA:'22',ME:'23',MD:'24',MA:'25',MI:'26',MN:'27',MS:'28',MO:'29',MT:'30',NE:'31',NV:'32',NH:'33',NJ:'34',NM:'35',NY:'36',NC:'37',ND:'38',OH:'39',OK:'40',OR:'41',PA:'42',RI:'44',SC:'45',SD:'46',TN:'47',TX:'48',UT:'49',VT:'50',VA:'51',WA:'53',WV:'54',WI:'55',WY:'56' }

const crosswalk = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'county-biome.json'), 'utf8'))
const manifest = JSON.parse(readFileSync(join(IDX, 'manifest.json'), 'utf8')).ids
const plants = JSON.parse(readFileSync(PLANTS, 'utf8'))
const idxOf = new Map(manifest.map((id, i) => [id, i]))

const chunkCache = {}
const loadChunk = (fip) =>
  (chunkCache[fip] ??= (() => {
    try { return JSON.parse(readFileSync(join(IDX, `${fip}.json`), 'utf8')) } catch { return {} }
  })())

function biomesFor(plant) {
  const pi = idxOf.get(plant.id)
  if (pi == null) return []
  const counts = {}
  let total = 0
  for (const s of plant.nativeStates || []) {
    const fip = USPS_FIP[s]
    if (!fip) continue
    const chunk = loadChunk(fip)
    for (const [cf, arr] of Object.entries(chunk)) {
      if (!arr.includes(pi)) continue
      const b = crosswalk[fip + cf]
      if (b) { counts[b] = (counts[b] || 0) + 1; total++ }
    }
  }
  if (!total) return []
  return Object.entries(counts)
    .filter(([, c]) => c / total >= THRESHOLD)
    .sort((a, b) => b[1] - a[1])
    .map(([b]) => b)
}

let withBiomes = 0
const tally = {}
for (const p of plants) {
  const biomes = biomesFor(p)
  if (biomes.length) {
    p.nativeBiomes = biomes
    withBiomes++
    for (const b of biomes) tally[b] = (tally[b] || 0) + 1
  } else {
    delete p.nativeBiomes // keep records clean when undetermined
  }
}

writeFileSync(PLANTS, JSON.stringify(plants, null, 1) + '\n')
console.log(`nativeBiomes set on ${withBiomes}/${plants.length} plants (${plants.length - withBiomes} undetermined)`)
console.log('per biome:')
for (const [b, n] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${b}`)

#!/usr/bin/env node
// PROTOTYPE (throwaway) — gauge whether GBIF can give usable county-level range
// data, as a feasibility check for zip/city-granular location lookup.
//
// For a handful of species it pulls GBIF US occurrence counts faceted by GADM
// level-2 area (≈ US county) and reports coverage at several count thresholds,
// plus whether the counties' states line up with the existing state-level
// `nativeStates`. The point is data-quality triage, not to write anything.
//
// Usage: node scripts/_county-proto.mjs [id ...]

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PLANTS_PATH = join(__dirname, '..', 'src', 'data', 'plants.json')

// GADM v4 US level-1 GIDs are alphabetical by state name (DC sits between DE and
// FL). USA.36 = Ohio, verified against the GBIF gadm geocode lookup.
const GADM_STATE = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM',
  'NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA',
  'WV','WI','WY',
]
const stateOfGid = (gid) => {
  const m = /^USA\.(\d+)\./.exec(gid)
  return m ? GADM_STATE[Number(m[1]) - 1] : null
}

async function gbifKey(name) {
  const r = await fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(name)}`)
  return r.ok ? (await r.json()).usageKey || null : null
}

async function countyFacets(key) {
  const url =
    `https://api.gbif.org/v1/occurrence/search?taxonKey=${key}` +
    `&gadmLevel0Gid=USA&facet=gadmGid&facetLimit=3000&limit=0`
  const r = await fetch(url)
  if (!r.ok) return { total: 0, counties: [] }
  const d = await r.json()
  const counts = d.facets?.[0]?.counts || []
  // Keep only GADM level-2 (county) entries: USA.<state>.<county>_1
  const counties = counts.filter((x) => /^USA\.[^.]+\.[^.]+_1$/.test(x.name))
  return { total: d.count, counties, truncated: counts.length >= 3000 }
}

const atLeast = (arr, n) => arr.filter((x) => x.count >= n).length
const statesFrom = (arr, n) =>
  new Set(arr.filter((x) => x.count >= n).map((x) => stateOfGid(x.name)).filter(Boolean))

async function run(plant) {
  const key = await gbifKey(plant.scientificName)
  if (!key) return console.log(`\n${plant.scientificName}: no GBIF key`)
  const { total, counties, truncated } = await countyFacets(key)
  const ns = new Set(plant.nativeStates || [])

  // Compare county coverage (at a mid threshold) to the existing state list.
  const TH = 10
  const covered = statesFrom(counties, TH)
  const inNative = [...covered].filter((s) => ns.has(s))
  const notNative = [...covered].filter((s) => !ns.has(s)) // counties in states we don't mark native

  console.log(`\n${plant.scientificName}  (nativeStates=${ns.size})`)
  console.log(`  US occurrences: ${total}${truncated ? '  [facets truncated @3000]' : ''}`)
  console.log(
    `  counties:  >=1: ${atLeast(counties, 1)}   >=5: ${atLeast(counties, 5)}` +
      `   >=10: ${atLeast(counties, 10)}   >=20: ${atLeast(counties, 20)}   >=50: ${atLeast(counties, 50)}`,
  )
  console.log(
    `  states covered by counties(>=${TH}): ${covered.size}  ` +
      `(${inNative.length} in nativeStates, ${notNative.length} outside: ${notNative.join(',') || '—'})`,
  )
  // Top counties for a sanity eyeball
  const top = counties.slice(0, 4).map((x) => `${x.name.replace('USA.', '').replace('_1', '')}:${x.count}`)
  console.log(`  busiest counties: ${top.join('  ')}`)
}

const DEFAULT = [
  'asclepias-tuberosa',
  'echinacea-purpurea',
  'rudbeckia-hirta',
  'monarda-fistulosa',
  'liatris-spicata',
]

async function main() {
  const plants = JSON.parse(readFileSync(PLANTS_PATH, 'utf8'))
  const byId = new Map(plants.map((p) => [p.id, p]))
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT
  for (const id of ids) {
    const p = byId.get(id)
    if (!p) {
      console.log(`\n(skip) no plant with id "${id}"`)
      continue
    }
    await run(p)
    await new Promise((r) => setTimeout(r, 250))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

#!/usr/bin/env node
// Enrich plants.json with native-state data derived from two public sources:
//
//   1. USDA PLANTS API (https://plantsservices.sc.egov.usda.gov/api/PlantProfile)
//      — gives authoritative native/introduced status at the *region* level
//        (L48 = lower 48 states, AK, HI, CAN, PR, VI). The public JSON does NOT
//        expose per-state native status, only regional.
//
//   2. GBIF Occurrence API (https://api.gbif.org/v1/occurrence/search)
//      — gives per-state US occurrence counts (observations + collections),
//        which we use as a presence proxy.
//
// Heuristic: if USDA says the species is native to L48, every US state with
// >= MIN_OCCURRENCES GBIF observations is recorded as a native state. This is
// imperfect (a plant native to L48 but only to the West won't be filtered out
// of eastern states it's been introduced to), but is far more accurate and
// complete than hand-typed lists. Existing hand-curated `nativeStates` is
// merged in, never overwritten — review the diff before committing.
//
// Usage:
//   node scripts/enrich-usda.mjs                # enrich all plants
//   node scripts/enrich-usda.mjs asclepias-tuberosa rudbeckia-hirta  # subset

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PLANTS_PATH = join(__dirname, '..', 'src', 'data', 'plants.json')
const MIN_OCCURRENCES = 50

const STATE_NAME_TO_CODE = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
  Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', Florida: 'FL', Georgia: 'GA',
  Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA',
  Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD',
  Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS', Missouri: 'MO',
  Montana: 'MT', Nebraska: 'NE', Nevada: 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND',
  Ohio: 'OH', Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI',
  'South Carolina': 'SC', 'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX',
  Utah: 'UT', Vermont: 'VT', Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV',
  Wisconsin: 'WI', Wyoming: 'WY', 'District of Columbia': 'DC',
}

async function gbifKey(scientificName) {
  const url = `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(scientificName)}`
  const r = await fetch(url)
  if (!r.ok) return null
  const d = await r.json()
  return d.usageKey || null
}

async function gbifStates(usageKey) {
  const url = `https://api.gbif.org/v1/occurrence/search?taxonKey=${usageKey}&country=US&facet=stateProvince&facetLimit=60&limit=0`
  const r = await fetch(url)
  if (!r.ok) return []
  const d = await r.json()
  const counts = d.facets?.[0]?.counts || []
  const codes = []
  for (const { name, count } of counts) {
    if (count < MIN_OCCURRENCES) continue
    const code = STATE_NAME_TO_CODE[name]
    if (code) codes.push(code)
  }
  return codes
}

function stripHtml(s) { return String(s || '').replace(/<[^>]+>/g, '').trim() }

async function usdaNativeRegions(scientificName) {
  // USDA uses a 4-letter symbol; we resolve by scientific name via PlantSearch.
  const searchUrl =
    'https://plantsservices.sc.egov.usda.gov/api/PlantSearch?' +
    `searchText=${encodeURIComponent(scientificName)}` +
    '&searchField=Scientific%20Name&searchType=Contains'
  const sr = await fetch(searchUrl)
  if (!sr.ok) return { symbol: null, nativeRegions: [] }
  const results = await sr.json()
  if (!Array.isArray(results) || !results.length) return { symbol: null, nativeRegions: [] }
  const target = scientificName.toLowerCase()
  // Prefer a clean species match: starts with our name, no hybrid/variety/subspecies markers.
  const score = (r) => {
    const name = stripHtml(r.Plant?.ScientificName).toLowerCase()
    if (!name.startsWith(target)) return -1
    const rest = name.slice(target.length).trim()
    if (rest === '' || /^[a-z]\.?$/i.test(rest.split(/\s+/)[0])) return 100 // bare or author
    if (/[×x]/.test(rest)) return 10
    if (/^(var\.|ssp\.|subsp\.)/i.test(rest)) return 20
    return 50
  }
  const hit = [...results].sort((a, b) => score(b) - score(a))[0]
  const symbol = hit?.Plant?.Symbol || null
  if (!symbol) return { symbol: null, nativeRegions: [] }
  const profileUrl = `https://plantsservices.sc.egov.usda.gov/api/PlantProfile?symbol=${symbol}`
  const pr = await fetch(profileUrl)
  if (!pr.ok) return { symbol, nativeRegions: [] }
  const pd = await pr.json()
  const nativeRegions = (pd.NativeStatuses || [])
    .filter((s) => /native/i.test(s.Type || ''))
    .map((s) => s.Region)
  return { symbol, nativeRegions }
}

async function enrichPlant(plant) {
  const sci = plant.scientificName
  const [{ symbol, nativeRegions }, usageKey] = await Promise.all([
    usdaNativeRegions(sci),
    gbifKey(sci),
  ])
  const isNativeL48 = nativeRegions.includes('L48')
  let states = []
  if (isNativeL48 && usageKey) {
    states = await gbifStates(usageKey)
  }
  const merged = Array.from(new Set([...(plant.nativeStates || []), ...states])).sort()
  return {
    ...plant,
    usdaSymbol: symbol || plant.usdaSymbol || null,
    nativeRegions: nativeRegions.length ? nativeRegions : plant.nativeRegions || [],
    nativeStates: merged,
  }
}

async function main() {
  const argv = process.argv.slice(2)
  const plants = JSON.parse(readFileSync(PLANTS_PATH, 'utf8'))
  const targets = argv.length ? new Set(argv) : null
  const updated = []
  for (let i = 0; i < plants.length; i++) {
    const p = plants[i]
    if (targets && !targets.has(p.id)) {
      updated.push(p)
      continue
    }
    process.stdout.write(`[${i + 1}/${plants.length}] ${p.scientificName} … `)
    try {
      const next = await enrichPlant(p)
      const added = next.nativeStates.length - (p.nativeStates?.length || 0)
      console.log(`symbol=${next.usdaSymbol || '?'} regions=${next.nativeRegions.join(',') || '?'} states=${next.nativeStates.length} (+${added})`)
      updated.push(next)
    } catch (e) {
      console.log(`FAILED: ${e.message}`)
      updated.push(p)
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  writeFileSync(PLANTS_PATH, JSON.stringify(updated, null, 2) + '\n')
  console.log(`\nWrote ${PLANTS_PATH}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

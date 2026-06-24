#!/usr/bin/env node
// Pre-add verification gate for new plant candidates. Confirms each species is
// USDA-native to L48 (the authoritative nativity check) and has real US presence
// (GBIF occurrences), flags GBIF synonyms (whose range conflates with the
// accepted name) and species already in the catalog. Read-only — it changes
// nothing; run it BEFORE scaffold-records.mjs and only seed what it clears.
//
// Mirrors the USDA + GBIF logic in enrich-usda.mjs so the verdict matches what
// the enrichment will actually find.
//
// Usage:
//   node scripts/verify-natives.mjs "Coreopsis pubescens" "Coreopsis basalis"
//   node scripts/verify-natives.mjs --seed scripts/seeds/gap-coreopsis.txt

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, isAbsolute } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PLANTS_PATH = join(__dirname, '..', 'src', 'data', 'plants.json')
const MIN_OCCURRENCES = 50 // same per-state threshold enrich-usda uses

const STATE_NAMES = new Set([
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming', 'District of Columbia',
])

const stripHtml = (s) => String(s || '').replace(/<[^>]+>/g, '').trim()
const toId = (sci) =>
  sci.trim().split(/\s+/).slice(0, 2).join('-').toLowerCase().replace(/[^a-z0-9-]+/g, '')

async function usda(sci) {
  const url =
    'https://plantsservices.sc.egov.usda.gov/api/PlantSearch?searchText=' +
    encodeURIComponent(sci) + '&searchField=Scientific%20Name&searchType=Contains'
  const r = await fetch(url)
  if (!r.ok) return { symbol: null, regions: [] }
  const results = await r.json()
  if (!Array.isArray(results) || !results.length) return { symbol: null, regions: [] }
  const t = sci.toLowerCase()
  const score = (x) => {
    const n = stripHtml(x.Plant?.ScientificName).toLowerCase()
    if (!n.startsWith(t)) return -1
    const rest = n.slice(t.length).trim()
    if (rest === '' || /^[a-z]\.?$/i.test(rest.split(/\s+/)[0])) return 100
    if (/[×x]/.test(rest)) return 10
    if (/^(var\.|ssp\.|subsp\.)/i.test(rest)) return 20
    return 50
  }
  const hit = [...results].sort((a, b) => score(b) - score(a))[0]
  const symbol = hit?.Plant?.Symbol || null
  if (!symbol) return { symbol: null, regions: [] }
  const pr = await fetch(`https://plantsservices.sc.egov.usda.gov/api/PlantProfile?symbol=${symbol}`)
  if (!pr.ok) return { symbol, regions: [] }
  const pd = await pr.json()
  const regions = (pd.NativeStatuses || [])
    .filter((s) => /native/i.test(s.Type || '')).map((s) => s.Region)
  return { symbol, regions }
}

async function gbif(sci) {
  const m = await fetch(
    `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(sci)}`,
  ).then((r) => r.json()).catch(() => ({}))
  if (!m.usageKey) return { status: 'NO MATCH', states: 0 }
  const occ = await fetch(
    `https://api.gbif.org/v1/occurrence/search?taxonKey=${m.usageKey}&country=US&facet=stateProvince&facetLimit=60&limit=0`,
  ).then((r) => r.json()).catch(() => ({}))
  const counts = occ.facets?.[0]?.counts || []
  const states = counts.filter((c) => c.count >= MIN_OCCURRENCES && STATE_NAMES.has(c.name)).length
  return { status: m.status, accepted: m.scientificName, states }
}

function parseArgs(argv) {
  const names = []
  const seedIdx = argv.indexOf('--seed')
  const seedFile = seedIdx !== -1 ? argv[seedIdx + 1] : null
  if (seedFile) {
    const p = isAbsolute(seedFile) ? seedFile : join(process.cwd(), seedFile)
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const s = line.trim()
      if (!s || s.startsWith('#')) continue
      names.push(s.split('|')[0].trim())
    }
  }
  for (const a of argv) if (a !== '--seed' && a !== seedFile) names.push(a)
  return [...new Set(names.filter(Boolean))]
}

async function main() {
  const names = parseArgs(process.argv.slice(2))
  if (!names.length) {
    console.error('Usage: node scripts/verify-natives.mjs "Genus species" … | --seed <file>')
    process.exit(1)
  }
  const plants = JSON.parse(readFileSync(PLANTS_PATH, 'utf8'))
  const haveId = new Set(plants.map((p) => p.id))
  const haveName = new Set(plants.map((p) => p.scientificName.toLowerCase()))

  console.log(`Verifying ${names.length} candidate(s) — verdict | species | USDA | GBIF\n`)
  const add = []
  for (const sci of names) {
    if (haveId.has(toId(sci)) || haveName.has(sci.toLowerCase())) {
      console.log(`  SKIP(dupe)  ${sci.padEnd(28)} already in catalog`)
      continue
    }
    const [u, g] = await Promise.all([usda(sci), gbif(sci)])
    const nativeL48 = u.regions.includes('L48')
    let verdict
    if (!nativeL48) verdict = 'DROP(not L48-native)'
    else if (g.status === 'SYNONYM') verdict = 'DROP(GBIF synonym)'
    else if (g.states < 2) verdict = 'REVIEW(<2 states)'
    else verdict = 'ADD'
    console.log(
      `  ${verdict.padEnd(20)} ${sci.padEnd(28)} ${(u.symbol || '-').padEnd(8)} ${u.regions.join(',') || 'none'} | ${g.status} ${g.states} states`,
    )
    if (verdict === 'ADD') add.push(sci)
    await new Promise((r) => setTimeout(r, 200))
  }
  if (add.length) console.log(`\n${add.length} clear to add:\n${add.map((s) => `  ${s}`).join('\n')}`)
}

main()

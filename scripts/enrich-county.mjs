#!/usr/bin/env node
// Generate the county-level inverted index from USDA PLANTS county distribution.
//
// USDA's distribution download (POST .../getDownloadDistributionDocumentation
// with {masterId}) returns a CSV of every county a taxon is *recorded* in:
//   Symbol,Country,State,State FIP,County,County FIP
// It is presence-only (no native/introduced flag), so we gate each county by the
// plant's existing `nativeStates` — a county counts only if its state is one we
// already mark native. Output is a per-state inverted index keyed by 3-digit
// county FIP -> plant indices into an append-only manifest id list (so existing
// indices never shift when plants are added), plus names.json (FIPS5 -> name).
//
// After adding plants, re-run this to give them county data. A partial run is
// safe — the manifest is append-only and names are merged — so you can rebuild
// just the new plants' native states instead of the whole country.
//
// Usage:
//   node scripts/enrich-county.mjs            # all states present in the catalog
//   node scripts/enrich-county.mjs OH IN      # just Ohio + Indiana (faster, safe)

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const PLANTS_PATH = join(ROOT, 'src', 'data', 'plants.json')
const OUT_DIR = join(ROOT, 'src', 'data', 'county-index')
const BASE = 'https://plantsservices.sc.egov.usda.gov'

const USPS_FIP = {
  AL: '01', AK: '02', AZ: '04', AR: '05', CA: '06', CO: '08', CT: '09', DE: '10',
  DC: '11', FL: '12', GA: '13', HI: '15', ID: '16', IL: '17', IN: '18', IA: '19',
  KS: '20', KY: '21', LA: '22', ME: '23', MD: '24', MA: '25', MI: '26', MN: '27',
  MS: '28', MO: '29', MT: '30', NE: '31', NV: '32', NH: '33', NJ: '34', NM: '35',
  NY: '36', NC: '37', ND: '38', OH: '39', OK: '40', OR: '41', PA: '42', RI: '44',
  SC: '45', SD: '46', TN: '47', TX: '48', UT: '49', VT: '50', VA: '51', WA: '53',
  WV: '54', WI: '55', WY: '56',
}
const FIP_USPS = Object.fromEntries(Object.entries(USPS_FIP).map(([k, v]) => [v, k]))

async function masterId(symbol) {
  const r = await fetch(`${BASE}/api/PlantProfile?symbol=${encodeURIComponent(symbol)}`)
  return r.ok ? (await r.json()).Id || null : null
}

async function distributionCsv(id) {
  const r = await fetch(`${BASE}/api/PlantProfile/getDownloadDistributionDocumentation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ masterId: id }),
  })
  return r.ok ? await r.text() : ''
}

// Parse the CSV into {fips5, name} for US counties. County names can contain
// commas, so read State FIP positionally, County FIP as the final field, and the
// county name as everything between (cols[4] .. second-to-last).
function countiesFromCsv(csv) {
  const out = []
  const lines = csv.trim().split(/\r?\n/).slice(2) // drop title + header
  for (const line of lines) {
    const cols = line.split(',')
    if (cols[1] !== 'United States') continue
    const stateFip = (cols[3] || '').trim().padStart(2, '0')
    const countyFip = (cols[cols.length - 1] || '').trim()
    if (!countyFip || countyFip === '000') continue
    const name = cols.slice(4, -1).join(',').trim()
    out.push({ fips5: stateFip + countyFip.padStart(3, '0'), name })
  }
  return out
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const plants = JSON.parse(readFileSync(PLANTS_PATH, 'utf8'))

  // Append-only manifest: county chunks store plant *indices* into this id list,
  // so it must stay stable when plants are added or reordered — load the existing
  // list and only append ids we haven't seen, never reorder. This keeps a partial
  // (single-state) run safe: chunks for untouched states keep valid indices.
  const MANIFEST_PATH = join(OUT_DIR, 'manifest.json')
  let manifestIds = []
  try {
    manifestIds = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')).ids || []
  } catch {
    // first run — no manifest yet
  }
  const known = new Set(manifestIds)
  for (const p of plants) if (!known.has(p.id)) manifestIds.push(p.id)
  const indexOf = new Map(manifestIds.map((id, i) => [id, i]))

  const argStates = process.argv.slice(2).map((s) => s.toUpperCase())
  const targetStates = new Set(
    argStates.length ? argStates : Object.keys(USPS_FIP),
  )

  // Only fetch plants native to at least one target state.
  const queue = plants.filter(
    (p) => p.usdaSymbol && (p.nativeStates || []).some((s) => targetStates.has(s)),
  )
  console.log(
    `Building [${[...targetStates].join(',')}] from ${queue.length} candidate plants ` +
      `(of ${plants.length} total)\n`,
  )

  // index[stateFip][countyFip3] = Set(plantIndex); names[fips5] = "County".
  // Seed names from the existing file so a partial run keeps other states' names.
  const index = {}
  let names = {}
  try {
    names = JSON.parse(readFileSync(join(OUT_DIR, 'names.json'), 'utf8'))
  } catch {
    // first run
  }
  for (const s of targetStates) index[USPS_FIP[s]] = {}

  let processed = 0
  let withData = 0
  let failed = 0

  for (const p of queue) {
    processed++
    try {
      const id = await masterId(p.usdaSymbol)
      if (!id) throw new Error('no masterId')
      const csv = await distributionCsv(id)
      const ns = new Set(p.nativeStates || [])
      const pi = indexOf.get(p.id)
      let hits = 0
      for (const { fips5, name } of countiesFromCsv(csv)) {
        const sf = fips5.slice(0, 2)
        const usps = FIP_USPS[sf]
        if (!usps || !targetStates.has(usps) || !ns.has(usps)) continue // gate
        const cf = fips5.slice(2)
        const bucket = index[sf]
        ;(bucket[cf] ||= new Set()).add(pi)
        if (name) names[fips5] = name
        hits++
      }
      if (hits) withData++
      if (processed % 25 === 0 || processed === queue.length) {
        process.stdout.write(`  [${processed}/${queue.length}] ${p.usdaSymbol} (+${hits} counties)\n`)
      }
    } catch (e) {
      failed++
      process.stdout.write(`  [${processed}/${queue.length}] ${p.usdaSymbol} FAILED: ${e.message}\n`)
    }
    await sleep(150)
  }

  mkdirSync(OUT_DIR, { recursive: true })
  let totalPairs = 0
  for (const [sf, counties] of Object.entries(index)) {
    const sorted = {}
    for (const cf of Object.keys(counties).sort()) {
      const arr = [...counties[cf]].sort((a, b) => a - b)
      sorted[cf] = arr
      totalPairs += arr.length
    }
    const path = join(OUT_DIR, `${sf}.json`)
    writeFileSync(path, JSON.stringify(sorted))
    const bytes = readFileSync(path).length
    console.log(
      `\n  wrote ${sf}.json — ${Object.keys(sorted).length} counties, ` +
        `${Object.values(sorted).reduce((a, b) => a + b.length, 0)} pairs, ${(bytes / 1024).toFixed(0)} KB`,
    )
  }

  writeFileSync(MANIFEST_PATH, JSON.stringify({ version: 1, ids: manifestIds }))
  const sortedNames = Object.fromEntries(Object.entries(names).sort())
  writeFileSync(join(OUT_DIR, 'names.json'), JSON.stringify(sortedNames))
  console.log(`  wrote names.json — ${Object.keys(sortedNames).length} counties`)

  console.log(
    `\nDone. processed ${processed}, with county data ${withData}, failed ${failed}, total pairs ${totalPairs}`,
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

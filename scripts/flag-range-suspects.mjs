#!/usr/bin/env node
// Range-data review tool. Our nativeStates were derived from GBIF occurrence
// counts (>= 50 records per state = "native"), which over-claims for widely
// cultivated species whose true native range is one region — GBIF can't tell a
// wild population from an escaped garden one. BONAP validation confirmed this:
// endemics and genuinely continental species are accurate, but a few regional
// specialists (e.g. Penstemon grandiflorus, Oenothera caespitosa) claimed the
// entire opposite half of the country.
//
// This script surfaces the records most likely to be over-claimed so they can
// be checked against BONAP and corrected. It does NOT change data.
//
// The strongest over-claim signal is a single native species claiming states
// across climatically incompatible extremes — the deep arid West (AZ/NV) AND
// the humid Southeast (FL/GA/SC/LA) AND the Northeast (ME/VT/NH) at once. Almost
// no true native occupies all three; the handful that do are flagged for a
// human/BONAP check rather than auto-edited.
//
// For each flagged record it prints the BONAP county-map URL to eyeball:
//   https://bonap.net/MapGallery/County/<Genus species>.png
// (green = native, gold = absent, orange = adventive/introduced.)
//
// Usage:  node scripts/flag-range-suspects.mjs

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PLANTS_PATH = join(__dirname, '..', 'src', 'data', 'plants.json')

const ARID_WEST = ['AZ', 'NV']
const HUMID_SE = ['FL', 'GA', 'SC', 'LA']
const NORTHEAST = ['ME', 'VT', 'NH']
const REVIEW_THRESHOLD = 25 // states; below this, over-claim impact is small

const hasAny = (set, codes) => codes.some((c) => set.has(c))

function bonapUrl(scientificName) {
  return `https://bonap.net/MapGallery/County/${scientificName.replace(/ /g, '%20')}.png`
}

function main() {
  const plants = JSON.parse(readFileSync(PLANTS_PATH, 'utf8'))
  const flagged = []
  for (const p of plants) {
    const states = new Set(p.nativeStates || [])
    if (states.size <= REVIEW_THRESHOLD) continue
    // Risk score: spanning all three incompatible regions is the strongest tell.
    const spans =
      Number(hasAny(states, ARID_WEST)) +
      Number(hasAny(states, HUMID_SE)) +
      Number(hasAny(states, NORTHEAST))
    if (spans < 3) continue
    flagged.push({ id: p.id, name: p.scientificName, count: states.size })
  }
  flagged.sort((a, b) => b.count - a.count)

  console.log(
    `${flagged.length} record(s) claim >${REVIEW_THRESHOLD} states spanning arid-West + humid-SE + NE.`,
  )
  console.log('Review each against BONAP; correct only genuine over-claims.\n')
  for (const f of flagged) {
    console.log(`${String(f.count).padStart(3)}  ${f.name}`)
    console.log(`     ${bonapUrl(f.name)}`)
  }
}

main()

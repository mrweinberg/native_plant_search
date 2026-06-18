#!/usr/bin/env node
// Mints skeleton plant records from a per-region seed list so the dataset can
// grow region by region. This is the *only* script that CREATES records — the
// enrich-*.mjs scripts only mutate existing ones.
//
// A seed file lives at scripts/seeds/<region>.txt, one species per line:
//
//   Scientific Name | Common Name        # common name optional
//   Asclepias tuberosa | Butterfly Weed
//   Echinacea purpurea
//   # lines starting with # are ignored
//
// Each new species becomes a skeleton with a transient `_needsReview: true`
// flag and empty curated fields. The pipeline then fills the rest:
//   1. scaffold-records.mjs <region>   (this script — id + skeleton)
//   2. enrich-usda.mjs <new ids…>      (usdaSymbol, nativeStates, nativeRegions)
//   3. enrich-images.mjs               (bundled thumbnails)
//   4. curate notes/bloom/traits, drop _needsReview
//   5. validate-records.mjs
//
// Dedup: a species already present (by id OR scientific name) is skipped, so a
// plant native to several regions is only ever added once. The printed list of
// new ids can be piped straight into enrich-usda.mjs.
//
// Usage:
//   node scripts/scaffold-records.mjs southeast
//   node scripts/scaffold-records.mjs scripts/seeds/southeast.txt

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, isAbsolute } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PLANTS_PATH = join(__dirname, '..', 'src', 'data', 'plants.json')

function seedPath(arg) {
  if (!arg) return null
  if (arg.endsWith('.txt')) return isAbsolute(arg) ? arg : join(process.cwd(), arg)
  return join(__dirname, 'seeds', `${arg}.txt`)
}

// Kebab-case id from the genus + species epithet, matching existing ids
// (e.g. "Asclepias tuberosa" -> "asclepias-tuberosa"). Infraspecific ranks
// (var./ssp.) collapse to genus-species so a species lands in one record.
function toId(scientificName) {
  const [genus, species] = scientificName.trim().split(/\s+/)
  return [genus, species]
    .filter(Boolean)
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '')
}

function parseSeed(text) {
  const out = []
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const [sci, common] = line.split('|').map((s) => s.trim())
    if (!sci) continue
    out.push({
      scientificName: sci,
      commonNames: common ? [common] : [],
    })
  }
  return out
}

// Empty/default skeleton. Curated fields left blank for the curation pass;
// range/symbol/image fields left for the enrich scripts; trait fields seeded
// with the same safe defaults enrich-traits / enrich-garden-traits apply.
function skeleton({ scientificName, commonNames }) {
  return {
    id: toId(scientificName),
    scientificName,
    commonNames,
    family: '',
    nativeStates: [],
    generalAppearance: null,
    lifespan: null,
    heightFeet: null,
    spreadFeet: null,
    lightRequirement: [],
    soilMoisture: [],
    soilType: [],
    bloomMonths: [],
    bloomColors: [],
    leafArrangement: null,
    leafRetention: null,
    wildlifeValue: [],
    deerResistant: false,
    notes: '',
    usdaSymbol: null,
    nativeRegions: [],
    cutFlower: false,
    culinaryUse: false,
    soilPh: ['neutral'],
    spreadHabit: 'clump',
    springEphemeral: false,
    _needsReview: true,
  }
}

function main() {
  const arg = process.argv[2]
  const path = seedPath(arg)
  if (!path || !existsSync(path)) {
    console.error(
      `Seed file not found. Usage: node scripts/scaffold-records.mjs <region|path>\n` +
        (path ? `  looked for: ${path}` : ''),
    )
    process.exit(1)
  }

  const plants = JSON.parse(readFileSync(PLANTS_PATH, 'utf8'))
  const seenIds = new Set(plants.map((p) => p.id))
  const seenNames = new Set(plants.map((p) => p.scientificName.toLowerCase()))

  const seeds = parseSeed(readFileSync(path, 'utf8'))
  const added = []
  let skipped = 0

  for (const seed of seeds) {
    const id = toId(seed.scientificName)
    if (seenIds.has(id) || seenNames.has(seed.scientificName.toLowerCase())) {
      skipped++
      continue
    }
    const rec = skeleton(seed)
    plants.push(rec)
    seenIds.add(id)
    seenNames.add(seed.scientificName.toLowerCase())
    added.push(rec)
  }

  writeFileSync(PLANTS_PATH, JSON.stringify(plants, null, 2) + '\n')

  console.log(`Scaffolded ${added.length} new record(s), skipped ${skipped} duplicate(s).`)
  if (added.length) {
    console.log(`\nNew ids (pass to enrich-usda.mjs):`)
    console.log(added.map((r) => r.id).join(' '))
  }
}

main()

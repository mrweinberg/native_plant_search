#!/usr/bin/env node
// Downloads Wikipedia thumbnail JPEGs into public/plants/<id>.jpg and
// records `imageFile` + `imageSource` on each plant. Bundling the binaries
// means runtime never hits Wikipedia, so no 429s or hot-linking risk.
//
// Idempotent: skips plants whose file already exists on disk (unless --force).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { Buffer } from 'node:buffer'

const PLANTS_PATH = '/Users/max/code/native_plant_search/src/data/plants.json'
const IMAGES_DIR = '/Users/max/code/native_plant_search/public/plants'
const FORCE = process.argv.includes('--force')
const DELAY_MS = 1000
const MAX_RETRIES = 4
const FLUSH_EVERY = 10
const UA = 'native-plant-search/0.1 (https://github.com/; max.renaud.weinberg@gmail.com)'

// Older botanical names still indexed by Wikipedia / iNaturalist for species
// that have been moved to new genera. Tried as a fallback when the canonical
// name returns nothing.
const NAME_SYNONYMS = {
  'Eutrochium altissimum': 'Eupatorium altissimum',
  'Forestiera neomexicana': 'Forestiera pubescens',
  'Viburnum opulus var. americanum': 'Viburnum trilobum',
  'Calylophus serrulata': 'Oenothera serrulata',
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchWithRetry(url) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } })
      if (r.status === 429) {
        const wait = 2000 * 2 ** attempt
        console.warn(`  429 — backing off ${wait}ms`)
        await sleep(wait)
        continue
      }
      return r
    } catch (err) {
      const wait = 2000 * 2 ** attempt
      console.warn(`  network error: ${err.message} — backing off ${wait}ms`)
      await sleep(wait)
    }
  }
  return null
}

async function fetchSummary(scientificName) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    scientificName.replace(/ /g, '_'),
  )}`
  const r = await fetchWithRetry(url)
  if (!r || !r.ok) return null
  return r.json()
}

async function fetchInatThumb(scientificName) {
  const url = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(
    scientificName,
  )}&rank=species&per_page=1`
  const r = await fetchWithRetry(url)
  if (!r || !r.ok) return null
  const data = await r.json()
  const taxon = data?.results?.[0]
  const photo = taxon?.default_photo
  if (!photo?.medium_url) return null
  return {
    imgUrl: photo.medium_url,
    page: `https://www.inaturalist.org/taxa/${taxon.id}`,
  }
}

async function downloadTo(path, url) {
  const r = await fetchWithRetry(url)
  if (!r || !r.ok) return false
  const buf = Buffer.from(await r.arrayBuffer())
  writeFileSync(path, buf)
  return true
}

if (!existsSync(IMAGES_DIR)) mkdirSync(IMAGES_DIR, { recursive: true })

const plants = JSON.parse(readFileSync(PLANTS_PATH, 'utf8'))

let downloaded = 0
let skipped = 0
let missing = 0

for (let i = 0; i < plants.length; i++) {
  const p = plants[i]
  // Migrate away from the old URL-cache field if present.
  if ('wikiImage' in p) delete p.wikiImage

  const filename = `${p.id}.jpg`
  const onDisk = `${IMAGES_DIR}/${filename}`
  const relative = `plants/${filename}`

  if (!FORCE && existsSync(onDisk)) {
    p.imageFile = relative
    if (!p.imageCredit) p.imageCredit = 'Wikimedia'
    skipped++
    continue
  }

  process.stdout.write(`[${i + 1}/${plants.length}] ${p.scientificName} … `)
  const tryNames = [p.scientificName, NAME_SYNONYMS[p.scientificName]].filter(Boolean)
  let imgUrl = null
  let sourceUrl = null
  let credit = null
  for (const name of tryNames) {
    const summary = await fetchSummary(name)
    const wikiThumb = summary?.thumbnail?.source || summary?.originalimage?.source
    if (wikiThumb) {
      imgUrl = wikiThumb
      sourceUrl = summary?.content_urls?.desktop?.page || null
      credit = 'Wikimedia'
      break
    }
  }
  if (!imgUrl) {
    for (const name of tryNames) {
      const inat = await fetchInatThumb(name)
      if (inat) {
        imgUrl = inat.imgUrl
        sourceUrl = inat.page
        credit = 'iNaturalist'
        break
      }
    }
  }
  if (!imgUrl) {
    missing++
    console.log('no image')
  } else {
    const ok = await downloadTo(onDisk, imgUrl)
    if (ok) {
      p.imageFile = relative
      p.imageSource = sourceUrl
      p.imageCredit = credit
      downloaded++
      console.log(`ok (${credit})`)
    } else {
      missing++
      console.log('download failed')
    }
  }
  if ((downloaded + missing) % FLUSH_EVERY === 0) {
    writeFileSync(PLANTS_PATH, JSON.stringify(plants, null, 2) + '\n')
  }
  await sleep(DELAY_MS)
}

writeFileSync(PLANTS_PATH, JSON.stringify(plants, null, 2) + '\n')

console.log(`\nDone. downloaded=${downloaded} skipped=${skipped} missing=${missing}`)

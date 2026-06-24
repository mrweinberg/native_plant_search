import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const plants = JSON.parse(
  readFileSync(join(__dirname, '..', 'src', 'data', 'plants.json'), 'utf8'),
)

// Closed vocabularies for the categorical fields. A new legitimate value should
// be a deliberate edit here — that's the point: it stops stray values (like a
// plant-type word landing in `lifespan`) from silently shipping.
const ENUMS = {
  generalAppearance: ['wildflower', 'tree', 'shrub', 'grass', 'fern', 'vine'],
  lifespan: ['perennial', 'biennial', 'annual'],
  leafArrangement: ['alternate', 'basal', 'opposite', 'whorled'],
  leafRetention: ['deciduous', 'evergreen', 'semi-evergreen'],
  spreadHabit: ['clump', 'spreading', 'aggressive', 'mat-forming'],
}
const ARRAY_ENUMS = {
  lightRequirement: ['sun', 'part shade', 'shade'],
  soilMoisture: ['dry', 'moist', 'wet'],
  soilType: ['loam', 'sandy', 'rocky', 'clay', 'peat'],
  soilPh: ['neutral', 'acidic', 'alkaline'],
  bloomColors: ['white', 'yellow', 'green', 'pink', 'purple', 'brown', 'blue', 'red', 'orange', 'cream'],
  wildlifeValue: ['pollinators', 'songbirds', 'butterflies', 'larval host', 'mammals', 'hummingbirds', 'monarch host'],
  landscapeUses: ['border', 'specimen', 'erosion control', 'container', 'naturalizing', 'hedge or screen', 'rain garden', 'foundation', 'groundcover'],
}
const US_STATES = new Set(
  'AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC'.split(' '),
)

// Collect every failure across the catalog, then assert the list is empty — so a
// failure report names every offending record at once instead of dying on #1.
function audit(check) {
  const problems = []
  for (const p of plants) check(p, (msg) => problems.push(`${p.id || '(no id)'}: ${msg}`))
  return problems
}

describe('catalog data integrity', () => {
  it('has records', () => {
    expect(plants.length).toBeGreaterThan(0)
  })

  it('uses only known values for single-value categorical fields', () => {
    expect(audit((p, fail) => {
      for (const [field, allowed] of Object.entries(ENUMS)) {
        if (!allowed.includes(p[field])) fail(`${field} = ${JSON.stringify(p[field])}`)
      }
    })).toEqual([])
  })

  it('uses only known values inside array categorical fields', () => {
    expect(audit((p, fail) => {
      for (const [field, allowed] of Object.entries(ARRAY_ENUMS)) {
        for (const v of p[field] || []) {
          if (!allowed.includes(v)) fail(`${field} contains ${JSON.stringify(v)}`)
        }
      }
    })).toEqual([])
  })

  it('has sane height and spread geometry', () => {
    expect(audit((p, fail) => {
      for (const dim of ['heightFeet', 'spreadFeet']) {
        const d = p[dim]
        if (!d || typeof d.min !== 'number' || typeof d.max !== 'number') { fail(`${dim} missing min/max`); continue }
        if (d.min > d.max) fail(`${dim} min>max (${d.min}>${d.max})`)
        if (d.min < 0 || d.max <= 0) fail(`${dim} non-positive (${d.min}-${d.max})`)
      }
    })).toEqual([])
  })

  it('has valid bloom months (integers 1-12, no duplicates)', () => {
    expect(audit((p, fail) => {
      const bm = p.bloomMonths || []
      for (const m of bm) if (!Number.isInteger(m) || m < 1 || m > 12) fail(`bad bloom month ${m}`)
      if (new Set(bm).size !== bm.length) fail('duplicate bloom months')
    })).toEqual([])
  })

  it('has at least one valid US native state per record', () => {
    expect(audit((p, fail) => {
      if (!Array.isArray(p.nativeStates) || p.nativeStates.length === 0) { fail('no nativeStates'); return }
      for (const s of p.nativeStates) if (!US_STATES.has(s)) fail(`invalid state ${s}`)
    })).toEqual([])
  })

  it('has the required curated fields populated', () => {
    expect(audit((p, fail) => {
      if (!p.scientificName) fail('no scientificName')
      if (!p.family) fail('no family')
      if (!p.commonNames?.length) fail('no commonNames')
      if (!p.imageFile) fail('no imageFile')
      if (!p.notes) fail('no notes')
    })).toEqual([])
  })

  it('only labels true milkweeds as monarch hosts', () => {
    expect(audit((p, fail) => {
      if (!p.wildlifeValue?.includes('monarch host')) return
      const hay = `${p.scientificName} ${p.commonNames.join(' ')}`.toLowerCase()
      if (!/asclepias|milkweed/.test(hay)) fail('monarch host but not a milkweed')
    })).toEqual([])
  })

  it('has unique ids and scientific names', () => {
    const ids = new Map()
    const sci = new Map()
    const dupes = []
    for (const p of plants) {
      if (ids.has(p.id)) dupes.push(`duplicate id ${p.id}`)
      ids.set(p.id, true)
      if (sci.has(p.scientificName)) dupes.push(`duplicate scientificName ${p.scientificName}`)
      sci.set(p.scientificName, true)
    }
    expect(dupes).toEqual([])
  })
})

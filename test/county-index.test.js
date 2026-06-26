import { describe, it, expect } from 'vitest'
import { useCountyIndex, USPS_FIP } from '../src/composables/useCountyIndex.js'

// Validates the lazy county loader against the committed Ohio chunk (39.json).
// Other states fill in after the national enrichment run; OH is enough to prove
// the load/lookup path end to end.
describe('useCountyIndex', () => {
  const {
    countiesForState,
    plantIdsInCounty,
    plantIdsInCounties,
    plantCountiesInState,
    usCountyGeometry,
    plantCountiesNationwide,
  } = useCountyIndex()

  it('maps OH to state FIPS 39', () => {
    expect(USPS_FIP.OH).toBe('39')
  })

  it('lists every Ohio county with native plants', async () => {
    const counties = await countiesForState('OH')
    expect(counties.length).toBe(88) // all 88 OH counties have catalog natives
    expect(counties.every((c) => /^39\d{3}$/.test(c.fips))).toBe(true)
  })

  it('returns plant ids for a known county (Adams, 39001)', async () => {
    const ids = await plantIdsInCounty('39001')
    expect(ids.length).toBeGreaterThan(100)
    expect(ids).toContain('echinacea-purpurea')
    expect(ids).toContain('asclepias-tuberosa')
  })

  it('unions plant ids across multiple counties without duplicates', async () => {
    const union = await plantIdsInCounties(['39001', '39003'])
    expect(new Set(union).size).toBe(union.length)
    expect(union).toContain('monarda-fistulosa')
  })

  it('resolves empty for an unknown state code', async () => {
    const counties = await countiesForState('ZZ')
    expect(counties).toEqual([])
  })

  it('lists the counties of a state where a plant is native', async () => {
    const fips = await plantCountiesInState('asclepias-tuberosa', 'OH')
    expect(fips.size).toBeGreaterThan(50)
    // Adams County (39001) carries this plant in the index.
    expect(fips.has('001')).toBe(true)
    expect(await plantCountiesInState('not-a-real-plant', 'OH')).toEqual(new Set())
  })

  it('loads national county geometry', async () => {
    const geo = await usCountyGeometry()
    expect(geo.viewBox).toBe('0 0 975 610')
    expect(Object.keys(geo.counties).length).toBeGreaterThan(3000)
    expect(Object.keys(geo.states).length).toBe(51)
    expect(geo.nation.length).toBeGreaterThan(100)
  })

  it('unions native counties nationwide and flags county-less states', async () => {
    const { counties, countyless } = await plantCountiesNationwide({
      id: 'asclepias-tuberosa',
      nativeStates: ['OH', 'IN', 'CT'],
    })
    expect([...counties].every((f) => /^\d{5}$/.test(f))).toBe(true)
    expect([...counties].some((f) => f.startsWith('39'))).toBe(true) // OH counties present
    expect([...counties].some((f) => f.startsWith('18'))).toBe(true) // IN counties present
    // CT structurally lacks county data -> flagged for whole-state fallback, not shaded.
    expect(countyless.has('CT')).toBe(true)
    expect([...counties].some((f) => f.startsWith('09'))).toBe(false)
  })
})

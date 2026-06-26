import { describe, it, expect } from 'vitest'
import { useCountyIndex, USPS_FIP } from '../src/composables/useCountyIndex.js'

// Validates the lazy county loader against the committed Ohio chunk (39.json).
// Other states fill in after the national enrichment run; OH is enough to prove
// the load/lookup path end to end.
describe('useCountyIndex', () => {
  const { countiesForState, plantIdsInCounty, plantIdsInCounties } = useCountyIndex()

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
})

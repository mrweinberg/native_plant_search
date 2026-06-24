import { describe, it, expect } from 'vitest'
import { plantMatchesCriteria, sortPlants } from '../src/composables/usePlantFilters.js'

// Minimal fixtures covering the fields the filter engine reads.
const oak = {
  id: 'quercus-alba', scientificName: 'Quercus alba', commonNames: ['White Oak'],
  generalAppearance: 'tree', lifespan: 'perennial', heightFeet: { min: 50, max: 100 },
  lightRequirement: ['sun'], soilMoisture: ['moist'], bloomMonths: [4, 5],
  bloomColors: ['green'], keystone: true,
}
const milkweed = {
  id: 'asclepias-tuberosa', scientificName: 'Asclepias tuberosa', commonNames: ['Butterfly Weed'],
  generalAppearance: 'wildflower', lifespan: 'perennial', heightFeet: { min: 1, max: 2.5 },
  lightRequirement: ['sun', 'part shade'], soilMoisture: ['dry'], bloomMonths: [6, 7, 8],
  bloomColors: ['orange'], cutFlower: true,
}
const trillium = {
  id: 'trillium-grandiflorum', scientificName: 'Trillium grandiflorum', commonNames: ['White Trillium'],
  generalAppearance: 'wildflower', lifespan: 'perennial', heightFeet: { min: 0.8, max: 1.5 },
  lightRequirement: ['shade', 'part shade'], soilMoisture: ['moist'], bloomMonths: [4, 5],
  bloomColors: ['white'], springEphemeral: true,
}
const all = [oak, milkweed, trillium]
const match = (criteria) => all.filter((p) => plantMatchesCriteria(p, criteria))

describe('plantMatchesCriteria', () => {
  it('empty criteria matches everything', () => {
    expect(match({})).toEqual(all)
  })

  it('text search spans common and scientific names, case-insensitive', () => {
    expect(match({ q: 'butterfly' })).toEqual([milkweed])
    expect(match({ q: 'asclepias' })).toEqual([milkweed])
    expect(match({ q: 'QUERCUS' })).toEqual([oak])
    expect(match({ q: 'no-such-plant' })).toEqual([])
  })

  it('single-value field filter matches exact value', () => {
    expect(match({ selected: { generalAppearance: ['tree'] } })).toEqual([oak])
    expect(match({ selected: { generalAppearance: ['wildflower'] } })).toEqual([milkweed, trillium])
  })

  it('array field uses OR within a group', () => {
    expect(match({ selected: { lightRequirement: ['shade'] } })).toEqual([trillium])
    expect(match({ selected: { lightRequirement: ['sun', 'shade'] } })).toEqual([oak, milkweed, trillium])
  })

  it('multiple groups are ANDed together', () => {
    expect(match({
      selected: { generalAppearance: ['wildflower'], soilMoisture: ['dry'] },
    })).toEqual([milkweed])
  })

  it('heightMax excludes plants whose minimum height exceeds the cap', () => {
    expect(match({ heightMax: 3 })).toEqual([milkweed, trillium])
  })

  it('heightMin excludes plants whose maximum height is below the floor', () => {
    expect(match({ heightMin: 10 })).toEqual([oak])
  })

  it('boolean flags keep only plants with the trait', () => {
    expect(match({ bools: { keystone: true } })).toEqual([oak])
    expect(match({ bools: { cut: true } })).toEqual([milkweed])
    expect(match({ bools: { ephemeral: true } })).toEqual([trillium])
  })

  it('a non-matching value in any group rejects the plant', () => {
    expect(match({ selected: { bloomColors: ['blue'] } })).toEqual([])
  })
})

describe('sortPlants', () => {
  it('common (default) sorts by first common name', () => {
    expect(sortPlants(all, 'common').map((p) => p.id)).toEqual([
      'asclepias-tuberosa', 'quercus-alba', 'trillium-grandiflorum',
    ])
  })

  it('scientific sorts by scientific name', () => {
    expect(sortPlants(all, 'scientific').map((p) => p.id)).toEqual([
      'asclepias-tuberosa', 'quercus-alba', 'trillium-grandiflorum',
    ])
  })

  it('heightAsc sorts by minimum height ascending', () => {
    expect(sortPlants(all, 'heightAsc').map((p) => p.id)).toEqual([
      'trillium-grandiflorum', 'asclepias-tuberosa', 'quercus-alba',
    ])
  })

  it('heightDesc sorts by maximum height descending', () => {
    expect(sortPlants(all, 'heightDesc').map((p) => p.id)).toEqual([
      'quercus-alba', 'asclepias-tuberosa', 'trillium-grandiflorum',
    ])
  })

  it('bloomStart sorts by earliest bloom month', () => {
    expect(sortPlants(all, 'bloomStart').map((p) => p.id)).toEqual([
      'quercus-alba', 'trillium-grandiflorum', 'asclepias-tuberosa',
    ])
  })

  it('does not mutate the input array', () => {
    const input = [...all]
    sortPlants(input, 'heightDesc')
    expect(input).toEqual(all)
  })
})

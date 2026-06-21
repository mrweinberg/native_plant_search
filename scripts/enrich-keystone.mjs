#!/usr/bin/env node
// Add a sourced ecological value: how many native butterfly/moth (Lepidoptera)
// species each plant's GENUS hosts as caterpillars. This is the data Doug
// Tallamy's "keystone plants" work and the NWF Native Plant Finder are built on
// — the one wildlife metric that's quantified rather than tagged.
//
// Numbers are GENUS-level national estimates:
//   - Woody genera: Tallamy (2009), via the Wild Ones host-plant table.
//   - A few herbaceous genera: NWF Native Plant Finder (via Grow Native MA).
// Genera without a sourced number are left blank — we do not invent counts.
//
// Sets `caterpillarHosts` (int) and `keystone` (bool, host count >= 100, the
// powerhouse tier).
//
// Usage: node scripts/enrich-keystone.mjs

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PLANTS_PATH = join(__dirname, '..', 'src', 'data', 'plants.json')
const KEYSTONE_MIN = 100

// genus -> Lepidoptera species hosted (national estimates).
const HOSTS = {
  Quercus: 557, Prunus: 456, Salix: 455, Betula: 411, Populus: 367, Malus: 308,
  Acer: 297, Vaccinium: 294, Alnus: 255, Carya: 235, Ulmus: 215, Pinus: 201,
  Crataegus: 168, Rubus: 163, Picea: 150, Fraxinus: 149, Tilia: 149, Pyrus: 138,
  Rosa: 135, Corylus: 131, Juglans: 129, Castanea: 127, Fagus: 127, Amelanchier: 124,
  Larix: 121, Cornus: 118, Abies: 117, Myrica: 108, Viburnum: 104, Ribes: 99,
  Ostrya: 94, Tsuga: 92, Spiraea: 89, Vitis: 79, Pseudotsuga: 76, Robinia: 72,
  Carpinus: 68, Sorbus: 68, Comptonia: 64, Hamamelis: 63, Rhus: 58, Rhododendron: 51,
  Thuja: 50, Diospyros: 46, Gleditsia: 46, Ceanothus: 45, Platanus: 45, Gaylussacia: 44,
  Celtis: 43, Juniperus: 42, Sambucus: 42, Physocarpus: 41, Syringa: 40, Ilex: 39,
  Sassafras: 38, Lonicera: 37, Liquidambar: 35, Kalmia: 33, Aesculus: 33,
  Parthenocissus: 32, Photinia: 29, Nyssa: 26, Symphoricarpos: 25, Shepherdia: 22,
  Liriodendron: 21, Magnolia: 21, Cephalanthus: 19, Cercis: 19, Smilax: 19, Wisteria: 19,
  Persea: 18, Arctostaphylos: 17, Taxodium: 16, Chamaedaphne: 15, Toxicodendron: 15,
  Oxydendrum: 14, Ampelopsis: 13, Arbutus: 12, Asimina: 12, Berberis: 12, Acacia: 11,
  Euonymus: 11, Frangula: 11, Lindera: 11, Lyonia: 11, Clethra: 10, Rhamnus: 10,
  // herbaceous (NWF Native Plant Finder)
  Solidago: 125, Fragaria: 81, Helianthus: 58,
}

// Genera our catalog spells differently than the source table.
const SYNONYM = { Aronia: 'Photinia', Morella: 'Myrica', Mahonia: 'Berberis' }

function hostsFor(scientificName) {
  const genus = scientificName.split(/\s+/)[0]
  return HOSTS[SYNONYM[genus] || genus] ?? null
}

const plants = JSON.parse(readFileSync(PLANTS_PATH, 'utf8'))
let withCount = 0
let keystones = 0
for (const p of plants) {
  const n = hostsFor(p.scientificName)
  if (n == null) {
    delete p.caterpillarHosts
    delete p.keystone
  } else {
    p.caterpillarHosts = n
    p.keystone = n >= KEYSTONE_MIN
    withCount++
    if (p.keystone) keystones++
  }
}
writeFileSync(PLANTS_PATH, JSON.stringify(plants, null, 2) + '\n')
console.log(`${withCount} plants given a sourced caterpillar-host count; ${keystones} are keystone (>= ${KEYSTONE_MIN}).`)

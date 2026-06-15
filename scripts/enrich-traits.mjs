#!/usr/bin/env node
// Adds two boolean trait fields to every plant in plants.json:
//   - cutFlower:   genuinely good cut/dried arrangement material
//   - culinaryUse: has commonly-used edible parts (cooked or raw)
//
// Curation reflects mainstream horticultural/forager references; conservative
// where toxicity or legal protection makes a casual "yes" misleading
// (e.g. Trillium is protected; Iris versicolor is toxic).
//
// Defaults are false. Plants not listed below get { cutFlower: false, culinaryUse: false }.

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const PLANTS_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'plants.json')

const TRAITS = {
  'asclepias-tuberosa':        { cutFlower: true,  culinaryUse: false },
  'echinacea-purpurea':        { cutFlower: true,  culinaryUse: false },
  'rudbeckia-hirta':           { cutFlower: true,  culinaryUse: false },
  'monarda-fistulosa':         { cutFlower: true,  culinaryUse: true  },
  'liatris-spicata':           { cutFlower: true,  culinaryUse: false },
  'aquilegia-canadensis':      { cutFlower: true,  culinaryUse: false },
  'lobelia-cardinalis':        { cutFlower: true,  culinaryUse: false },
  'coreopsis-lanceolata':      { cutFlower: true,  culinaryUse: false },
  'solidago-rigida':           { cutFlower: true,  culinaryUse: false },
  'symphyotrichum-novae-angliae': { cutFlower: true, culinaryUse: false },
  'baptisia-australis':        { cutFlower: true,  culinaryUse: false },
  'penstemon-digitalis':       { cutFlower: true,  culinaryUse: false },
  'eutrochium-purpureum':      { cutFlower: true,  culinaryUse: false },
  'vernonia-gigantea':         { cutFlower: true,  culinaryUse: false },
  'phlox-divaricata':          { cutFlower: false, culinaryUse: false },
  'tiarella-cordifolia':       { cutFlower: false, culinaryUse: false },
  'heuchera-americana':        { cutFlower: false, culinaryUse: false },
  'polygonatum-biflorum':      { cutFlower: true,  culinaryUse: false },
  'asarum-canadense':          { cutFlower: false, culinaryUse: false },
  'sanguinaria-canadensis':    { cutFlower: false, culinaryUse: false },
  'acer-rubrum':               { cutFlower: false, culinaryUse: false },
  'cornus-florida':            { cutFlower: true,  culinaryUse: false },
  'cercis-canadensis':         { cutFlower: true,  culinaryUse: true  },
  'quercus-alba':              { cutFlower: false, culinaryUse: true  },
  'carpinus-caroliniana':      { cutFlower: false, culinaryUse: false },
  'amelanchier-arborea':       { cutFlower: true,  culinaryUse: true  },
  'hamamelis-virginiana':      { cutFlower: true,  culinaryUse: false },
  'lindera-benzoin':           { cutFlower: false, culinaryUse: true  },
  'itea-virginica':            { cutFlower: true,  culinaryUse: false },
  'viburnum-prunifolium':      { cutFlower: true,  culinaryUse: true  },
  'schizachyrium-scoparium':   { cutFlower: true,  culinaryUse: false },
  'andropogon-gerardii':       { cutFlower: true,  culinaryUse: false },
  'sorghastrum-nutans':        { cutFlower: true,  culinaryUse: false },
  'panicum-virgatum':          { cutFlower: true,  culinaryUse: false },
  'bouteloua-curtipendula':    { cutFlower: true,  culinaryUse: false },
  'sporobolus-heterolepis':    { cutFlower: true,  culinaryUse: false },
  'carex-pensylvanica':        { cutFlower: false, culinaryUse: false },
  'polystichum-acrostichoides': { cutFlower: true, culinaryUse: false },
  'matteuccia-struthiopteris': { cutFlower: true,  culinaryUse: true  },
  'athyrium-filix-femina':     { cutFlower: true,  culinaryUse: false },
  'dryopteris-marginalis':     { cutFlower: true,  culinaryUse: false },
  'osmundastrum-cinnamomeum':  { cutFlower: true,  culinaryUse: false },
  'adiantum-pedatum':          { cutFlower: true,  culinaryUse: false },
  'parthenocissus-quinquefolia': { cutFlower: false, culinaryUse: false },
  'lonicera-sempervirens':     { cutFlower: true,  culinaryUse: false },
  'clematis-virginiana':       { cutFlower: true,  culinaryUse: false },
  'passiflora-incarnata':      { cutFlower: false, culinaryUse: true  },
  'geranium-maculatum':        { cutFlower: false, culinaryUse: false },
  'mertensia-virginica':       { cutFlower: false, culinaryUse: true  },
  'trillium-grandiflorum':     { cutFlower: false, culinaryUse: false },
  'dicentra-cucullaria':       { cutFlower: false, culinaryUse: false },
  'erythronium-americanum':    { cutFlower: false, culinaryUse: true  },
  'claytonia-virginica':       { cutFlower: false, culinaryUse: true  },
  'iris-versicolor':           { cutFlower: true,  culinaryUse: false },
  'silphium-perfoliatum':      { cutFlower: true,  culinaryUse: false },
  'zizia-aurea':               { cutFlower: true,  culinaryUse: false },
  'chelone-glabra':            { cutFlower: true,  culinaryUse: false },
  'asclepias-incarnata':       { cutFlower: true,  culinaryUse: false },
  'asclepias-syriaca':         { cutFlower: true,  culinaryUse: true  },
  'eupatorium-perfoliatum':    { cutFlower: true,  culinaryUse: false },
  'allium-cernuum':            { cutFlower: true,  culinaryUse: true  },
  'pycnanthemum-virginianum':  { cutFlower: true,  culinaryUse: true  },
  'veronicastrum-virginicum':  { cutFlower: true,  culinaryUse: false },
  'helenium-autumnale':        { cutFlower: true,  culinaryUse: false },
  'packera-aurea':             { cutFlower: false, culinaryUse: false },
  'podophyllum-peltatum':      { cutFlower: false, culinaryUse: true  },
  'maianthemum-racemosum':     { cutFlower: true,  culinaryUse: true  },
  'actaea-racemosa':           { cutFlower: true,  culinaryUse: false },
  'anemone-canadensis':        { cutFlower: true,  culinaryUse: false },
  'cephalanthus-occidentalis': { cutFlower: true,  culinaryUse: false },
  'sambucus-canadensis':       { cutFlower: true,  culinaryUse: true  },
  'aronia-melanocarpa':        { cutFlower: true,  culinaryUse: true  },
  'ilex-verticillata':         { cutFlower: true,  culinaryUse: false },
  'physocarpus-opulifolius':   { cutFlower: false, culinaryUse: false },
  'rhus-aromatica':            { cutFlower: false, culinaryUse: true  },
  'liriodendron-tulipifera':   { cutFlower: false, culinaryUse: false },
  'nyssa-sylvatica':           { cutFlower: false, culinaryUse: false },
  'betula-nigra':              { cutFlower: false, culinaryUse: false },
  'platanus-occidentalis':     { cutFlower: false, culinaryUse: false },
  'asimina-triloba':           { cutFlower: false, culinaryUse: true  },
  'sassafras-albidum':         { cutFlower: false, culinaryUse: true  },
}

const plants = JSON.parse(readFileSync(PLANTS_PATH, 'utf8'))
let missing = 0
const updated = plants.map((p) => {
  const t = TRAITS[p.id]
  if (!t) {
    missing++
    return { ...p, cutFlower: p.cutFlower ?? false, culinaryUse: p.culinaryUse ?? false }
  }
  return { ...p, ...t }
})
writeFileSync(PLANTS_PATH, JSON.stringify(updated, null, 2) + '\n')
console.log(`Updated ${plants.length} plants. ${missing} had no entry in TRAITS map (defaulted to false).`)
console.log(`cutFlower=true: ${updated.filter((p) => p.cutFlower).length}`)
console.log(`culinaryUse=true: ${updated.filter((p) => p.culinaryUse).length}`)

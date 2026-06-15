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
  'mertensia-virginica':       { cutFlower: false, culinaryUse: false }, // not a standard edible; Boraginaceae pyrrolizidine concerns
  'trillium-grandiflorum':     { cutFlower: false, culinaryUse: false },
  'dicentra-cucullaria':       { cutFlower: false, culinaryUse: false },
  'erythronium-americanum':    { cutFlower: false, culinaryUse: false }, // bulbs/leaves emetic
  'claytonia-virginica':       { cutFlower: false, culinaryUse: true  },
  'iris-versicolor':           { cutFlower: true,  culinaryUse: false },
  'silphium-perfoliatum':      { cutFlower: true,  culinaryUse: false },
  'zizia-aurea':               { cutFlower: true,  culinaryUse: false },
  'chelone-glabra':            { cutFlower: true,  culinaryUse: false },
  'asclepias-incarnata':       { cutFlower: true,  culinaryUse: false },
  'asclepias-syriaca':         { cutFlower: true,  culinaryUse: false }, // raw plant toxic; only safely edible if boiled in multiple water changes
  'eupatorium-perfoliatum':    { cutFlower: true,  culinaryUse: false },
  'allium-cernuum':            { cutFlower: true,  culinaryUse: true  },
  'pycnanthemum-virginianum':  { cutFlower: true,  culinaryUse: true  },
  'veronicastrum-virginicum':  { cutFlower: true,  culinaryUse: false },
  'helenium-autumnale':        { cutFlower: true,  culinaryUse: false },
  'packera-aurea':             { cutFlower: false, culinaryUse: false },
  'podophyllum-peltatum':      { cutFlower: false, culinaryUse: false }, // only ripe fruit pulp safe; rest contains podophyllotoxin
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
  'sassafras-albidum':         { cutFlower: false, culinaryUse: false }, // FDA banned safrole oil/root bark 1960; leaves still safe but flagging conservatively

  // --- 2026-06 batch ---
  // Trees: nuts/fruits drive culinary; foliage rarely good cut material.
  'quercus-rubra':             { cutFlower: false, culinaryUse: false },
  'quercus-macrocarpa':        { cutFlower: false, culinaryUse: false },
  'quercus-velutina':          { cutFlower: false, culinaryUse: false },
  'quercus-muehlenbergii':     { cutFlower: false, culinaryUse: false },
  'quercus-palustris':         { cutFlower: false, culinaryUse: false },
  'carya-ovata':               { cutFlower: false, culinaryUse: true  }, // sweet hickory nuts
  'carya-glabra':              { cutFlower: false, culinaryUse: false }, // bitter
  'carya-cordiformis':         { cutFlower: false, culinaryUse: false }, // bitter
  'acer-saccharum':            { cutFlower: false, culinaryUse: true  }, // syrup
  'fagus-grandifolia':         { cutFlower: false, culinaryUse: true  }, // beechnuts
  'juglans-nigra':             { cutFlower: false, culinaryUse: true  }, // black walnuts
  'tilia-americana':           { cutFlower: false, culinaryUse: true  }, // flowers for tea, edible leaves
  'prunus-serotina':           { cutFlower: false, culinaryUse: true  }, // cherries for jelly/wine
  'diospyros-virginiana':      { cutFlower: false, culinaryUse: true  }, // persimmons
  'tsuga-canadensis':          { cutFlower: true,  culinaryUse: false }, // evergreen boughs for arrangements
  'pinus-strobus':             { cutFlower: true,  culinaryUse: false }, // boughs
  'juniperus-virginiana':      { cutFlower: true,  culinaryUse: false }, // boughs + berries for decor
  'magnolia-acuminata':        { cutFlower: false, culinaryUse: false },

  // Shrubs
  'viburnum-dentatum':         { cutFlower: true,  culinaryUse: false },
  'viburnum-acerifolium':      { cutFlower: false, culinaryUse: false },
  'cornus-sericea':            { cutFlower: true,  culinaryUse: false }, // red winter twigs prized for arrangements
  'cornus-amomum':             { cutFlower: false, culinaryUse: false },
  'hydrangea-arborescens':     { cutFlower: true,  culinaryUse: false }, // classic cut + dried flower
  'ceanothus-americanus':      { cutFlower: false, culinaryUse: true  }, // historic tea substitute
  'corylus-americana':         { cutFlower: false, culinaryUse: true  }, // edible hazelnuts
  'vaccinium-corymbosum':      { cutFlower: false, culinaryUse: true  }, // blueberries
  'diervilla-lonicera':        { cutFlower: false, culinaryUse: false },
  'spiraea-alba':              { cutFlower: true,  culinaryUse: false },
  'rosa-carolina':             { cutFlower: false, culinaryUse: true  }, // hips for tea, petals edible

  // Vines
  'bignonia-capreolata':       { cutFlower: false, culinaryUse: false },
  'campsis-radicans':          { cutFlower: false, culinaryUse: false },
  'aristolochia-macrophylla':  { cutFlower: false, culinaryUse: false }, // toxic
  'wisteria-frutescens':       { cutFlower: true,  culinaryUse: false },
  'apios-americana':           { cutFlower: false, culinaryUse: true  }, // edible tubers

  // Grasses / sedges
  'carex-muskingumensis':      { cutFlower: false, culinaryUse: false },
  'carex-stricta':             { cutFlower: false, culinaryUse: false },
  'carex-grayi':               { cutFlower: true,  culinaryUse: false }, // mace-shaped seed heads for dried arrangements
  'elymus-virginicus':         { cutFlower: false, culinaryUse: false },
  'elymus-hystrix':            { cutFlower: true,  culinaryUse: false }, // bottlebrush seedheads
  'chasmanthium-latifolium':   { cutFlower: true,  culinaryUse: false }, // oat-like seedheads classic in arrangements
  'juncus-effusus':            { cutFlower: false, culinaryUse: false },

  // Ferns
  'onoclea-sensibilis':        { cutFlower: false, culinaryUse: false },
  'asplenium-platyneuron':     { cutFlower: false, culinaryUse: false },
  'polypodium-virginianum':    { cutFlower: false, culinaryUse: false },

  // Herbs
  'hepatica-americana':        { cutFlower: false, culinaryUse: false }, // tiny, protected
  'jeffersonia-diphylla':      { cutFlower: false, culinaryUse: false },
  'caulophyllum-thalictroides':{ cutFlower: false, culinaryUse: false }, // toxic
  'uvularia-grandiflora':      { cutFlower: false, culinaryUse: false },
  'polemonium-reptans':        { cutFlower: false, culinaryUse: false },
  'solidago-caesia':           { cutFlower: true,  culinaryUse: false },
  'eurybia-divaricata':        { cutFlower: true,  culinaryUse: false },
  'symphyotrichum-laeve':      { cutFlower: true,  culinaryUse: false },
  'symphyotrichum-cordifolium':{ cutFlower: true,  culinaryUse: false },
  'lobelia-siphilitica':       { cutFlower: true,  culinaryUse: false },
  'mimulus-ringens':           { cutFlower: false, culinaryUse: false },
  'senna-hebecarpa':           { cutFlower: true,  culinaryUse: false },
  'aruncus-dioicus':           { cutFlower: true,  culinaryUse: false },
  'coreopsis-tripteris':       { cutFlower: true,  culinaryUse: false },

  // Added from ODNR habitat factsheets
  'aesculus-glabra':           { cutFlower: false, culinaryUse: false }, // all parts toxic
  'acer-saccharinum':          { cutFlower: false, culinaryUse: false },
  'cornus-alternifolia':       { cutFlower: false, culinaryUse: false },
  'symphoricarpos-orbiculatus':{ cutFlower: true,  culinaryUse: false }, // berried branches
  'staphylea-trifolia':        { cutFlower: false, culinaryUse: false }, // pods interesting but shrub form
  'heliopsis-helianthoides':   { cutFlower: true,  culinaryUse: false },
  'ratibida-pinnata':          { cutFlower: true,  culinaryUse: false },
  'rudbeckia-triloba':         { cutFlower: true,  culinaryUse: false },
  'filipendula-rubra':         { cutFlower: true,  culinaryUse: false },
  'gentiana-andrewsii':        { cutFlower: false, culinaryUse: false }, // wilts immediately when cut
  'phlox-paniculata':          { cutFlower: true,  culinaryUse: false },
  'silphium-terebinthinaceum': { cutFlower: false, culinaryUse: false }, // basal-only foliage, stalks too tall
  'camassia-scilloides':       { cutFlower: true,  culinaryUse: false }, // bulbs reportedly edible cooked but conservative
  'celastrus-scandens':        { cutFlower: true,  culinaryUse: false }, // berried branches iconic for fall arrangements
  'symphyotrichum-ericoides':  { cutFlower: true,  culinaryUse: false },
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

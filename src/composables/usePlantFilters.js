import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// The catalog is large, so the list/filter view loads a slim build-time copy
// (detail-only fields like notes/credits stripped — see scripts/gen-list.mjs)
// in its own async chunk, instead of the full catalog. This keeps the home
// page's first paint off the heavy payload; the detail view lazy-loads the full
// record on demand (see usePlantDetail.js). `allPlants` starts empty and fills
// once the chunk resolves; consumers read it reactively.
export const allPlants = ref([])
export const plantsLoaded = ref(false)
import('../data/plants-list.json').then((m) => {
  allPlants.value = m.default
  plantsLoaded.value = true
})

const MULTI_FILTERS = [
  { key: 'generalAppearance', field: 'generalAppearance', isArray: false },
  { key: 'lifespan', field: 'lifespan', isArray: false },
  { key: 'lightRequirement', field: 'lightRequirement', isArray: true },
  { key: 'soilMoisture', field: 'soilMoisture', isArray: true },
  { key: 'soilType', field: 'soilType', isArray: true },
  { key: 'soilPh', field: 'soilPh', isArray: true },
  { key: 'spreadHabit', field: 'spreadHabit', isArray: false },
  { key: 'bloomMonths', field: 'bloomMonths', isArray: true, numeric: true },
  { key: 'bloomColors', field: 'bloomColors', isArray: true },
  { key: 'leafArrangement', field: 'leafArrangement', isArray: false },
  { key: 'leafRetention', field: 'leafRetention', isArray: false },
  { key: 'nativeStates', field: 'nativeStates', isArray: true },
  { key: 'nativeBiomes', field: 'nativeBiomes', isArray: true },
  { key: 'wildlifeValue', field: 'wildlifeValue', isArray: true },
  { key: 'landscapeUses', field: 'landscapeUses', isArray: true },
  { key: 'family', field: 'family', isArray: false },
]

// Boolean "only" filters. `key` doubles as the URL query param (value '1'); the
// table drives the query computed, the filter pass, the active count, the panel
// checkboxes, and the active-chip list, so adding a flag is a one-line change.
export const BOOL_FILTERS = [
  { key: 'deer', field: 'deerResistant', chip: 'Deer-resistant', icon: '🦌',
    panelLabel: 'Deer-resistant only',
    title: 'Plants deer tend to leave alone — a guide, not a guarantee, since hungry deer sample almost anything.' },
  { key: 'cut', field: 'cutFlower', chip: 'Cut flower', icon: '✂️',
    panelLabel: 'Good for cut flowers',
    title: 'Flowers that hold up well when cut for indoor arrangements.' },
  { key: 'edible', field: 'culinaryUse', chip: 'Edible', icon: '🍴',
    panelLabel: 'Edible / culinary use',
    title: 'Has parts traditionally used as food — always confirm safe identification and preparation.' },
  { key: 'ephemeral', field: 'springEphemeral', chip: 'Spring ephemeral', icon: '🌱',
    panelLabel: 'Spring ephemerals only',
    title: 'Woodland wildflowers that bloom early in spring, then die back by summer.' },
  { key: 'keystone', field: 'keystone', chip: 'Keystone plants', icon: '🐛',
    panelLabel: 'Keystone plants only',
    title: 'Genera that host an outsized number of native caterpillar species — top wildlife value (Tallamy / NWF).' },
]

function uniqueSorted(values, numeric = false) {
  const set = new Set(values)
  const arr = [...set]
  if (numeric) return arr.sort((a, b) => a - b)
  return arr.sort((a, b) => String(a).localeCompare(String(b)))
}

export function getFilterOptions() {
  const options = {}
  for (const f of MULTI_FILTERS) {
    const all = []
    for (const p of allPlants.value) {
      const v = p[f.field]
      if (v == null) continue
      if (f.isArray) all.push(...v)
      else all.push(v)
    }
    options[f.key] = uniqueSorted(all, f.numeric)
  }
  options.maxHeight = allPlants.value.length
    ? Math.max(...allPlants.value.map((p) => p.heightFeet?.max ?? 0))
    : 0
  return options
}

// Pure predicate: does a plant satisfy the given filter criteria? Decoupled from
// the router so it's unit-testable. `criteria` mirrors the reactive filter state:
//   { q, selected, heightMax, heightMin, bools }. `q` is normalized here.
export function plantMatchesCriteria(p, criteria) {
  const { selected = {}, heightMax = null, heightMin = null, bools = {} } = criteria
  const q = (criteria.q || '').trim().toLowerCase()
  if (q) {
    const hay = [p.scientificName, ...(p.commonNames || [])].join(' ').toLowerCase()
    if (!hay.includes(q)) return false
  }
  for (const f of MULTI_FILTERS) {
    const chosen = selected[f.key]
    if (!chosen || chosen.length === 0) continue
    const v = p[f.field]
    if (v == null) return false
    if (f.isArray) {
      if (!v.some((x) => chosen.includes(x))) return false
    } else if (!chosen.includes(v)) {
      return false
    }
  }
  if (heightMax != null) {
    const plantMin = p.heightFeet?.min ?? p.heightFeet?.max ?? 0
    if (plantMin > heightMax) return false
  }
  if (heightMin != null) {
    const plantMax = p.heightFeet?.max ?? p.heightFeet?.min ?? 0
    if (plantMax < heightMin) return false
  }
  for (const f of BOOL_FILTERS) {
    if (bools[f.key] && !p[f.field]) return false
  }
  return true
}

// Pure sort: returns a new array ordered by the given sort key.
export function sortPlants(list, sortBy) {
  const out = [...list]
  const firstBloom = (p) => (p.bloomMonths?.length ? Math.min(...p.bloomMonths) : 99)
  const cmpStr = (a, b) => String(a).localeCompare(String(b))
  switch (sortBy) {
    case 'scientific':
      out.sort((a, b) => cmpStr(a.scientificName, b.scientificName))
      break
    case 'heightAsc':
      out.sort((a, b) => (a.heightFeet?.min ?? 0) - (b.heightFeet?.min ?? 0))
      break
    case 'heightDesc':
      out.sort((a, b) => (b.heightFeet?.max ?? 0) - (a.heightFeet?.max ?? 0))
      break
    case 'bloomStart':
      out.sort((a, b) => firstBloom(a) - firstBloom(b))
      break
    case 'common':
    default:
      out.sort((a, b) => cmpStr(a.commonNames?.[0] || '', b.commonNames?.[0] || ''))
  }
  return out
}

export function usePlantFilters() {
  const route = useRoute()
  const router = useRouter()

  const parseList = (val, numeric = false) => {
    if (!val) return []
    const parts = String(val).split(',').filter(Boolean)
    return numeric ? parts.map(Number).filter((n) => !Number.isNaN(n)) : parts
  }

  const query = computed(() => String(route.query.q ?? ''))
  const heightMax = computed(() => {
    const v = Number(route.query.heightMax)
    return Number.isFinite(v) && v > 0 ? v : null
  })
  const heightMin = computed(() => {
    const v = Number(route.query.heightMin)
    return Number.isFinite(v) && v > 0 ? v : null
  })
  // { deer: true, cut: false, ... } — one reactive map for every boolean flag.
  const bools = computed(() => {
    const out = {}
    for (const f of BOOL_FILTERS) out[f.key] = route.query[f.key] === '1'
    return out
  })
  const sortBy = computed(() => String(route.query.sort || 'common'))

  const selected = computed(() => {
    const out = {}
    for (const f of MULTI_FILTERS) {
      out[f.key] = parseList(route.query[f.key], f.numeric)
    }
    return out
  })

  function setQuery(patch) {
    const next = { ...route.query, ...patch }
    for (const k of Object.keys(next)) {
      if (next[k] === '' || next[k] == null || (Array.isArray(next[k]) && next[k].length === 0)) {
        delete next[k]
      }
    }
    router.replace({ query: next })
  }

  function setSearch(q) {
    setQuery({ q: q || undefined })
  }
  function toggleFilter(key, value) {
    const current = selected.value[key] || []
    const exists = current.includes(value)
    const next = exists ? current.filter((v) => v !== value) : [...current, value]
    setQuery({ [key]: next.length ? next.join(',') : undefined })
  }
  function clearFilter(key) {
    setQuery({ [key]: undefined })
  }
  function setHeightMax(val) {
    setQuery({ heightMax: val ? String(val) : undefined })
  }
  function setHeightMin(val) {
    setQuery({ heightMin: val ? String(val) : undefined })
  }
  function setBool(key, val) {
    setQuery({ [key]: val ? '1' : undefined })
  }
  function setSortBy(val) {
    setQuery({ sort: val && val !== 'common' ? val : undefined })
  }
  function clearAll() {
    router.replace({ query: {} })
  }

  const filteredPlants = computed(() => {
    const criteria = {
      q: query.value,
      selected: selected.value,
      heightMax: heightMax.value,
      heightMin: heightMin.value,
      bools: bools.value,
    }
    return allPlants.value.filter((p) => plantMatchesCriteria(p, criteria))
  })

  const sortedPlants = computed(() => sortPlants(filteredPlants.value, sortBy.value))

  const activeFilterCount = computed(() => {
    let n = 0
    if (query.value) n++
    for (const f of MULTI_FILTERS) n += (selected.value[f.key] || []).length
    n += parseList(route.query.county).length // county multiselect lives outside MULTI_FILTERS
    if (heightMax.value != null) n++
    if (heightMin.value != null) n++
    for (const f of BOOL_FILTERS) if (bools.value[f.key]) n++
    return n
  })

  return {
    query,
    selected,
    heightMax,
    heightMin,
    bools,
    sortBy,
    filteredPlants,
    sortedPlants,
    activeFilterCount,
    setSearch,
    toggleFilter,
    clearFilter,
    setHeightMax,
    setHeightMin,
    setBool,
    setSortBy,
    clearAll,
  }
}

export const MONTH_LABELS = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

// Bloom-color → swatch hex, shared by the cards, the calendar, and the detail-page
// bloom strip so colors stay consistent everywhere. White renders as #fff and
// relies on a border for visibility (consumers add it).
export const BLOOM_COLOR_HEX = {
  white: '#ffffff', red: '#c44d4d', pink: '#f0a0b8', orange: '#e08b3a',
  yellow: '#e9c84a', green: '#7ea36b', blue: '#5a7fb8', purple: '#8a5a9a',
  violet: '#9b6aa1', brown: '#8a6a4a', black: '#222',
}

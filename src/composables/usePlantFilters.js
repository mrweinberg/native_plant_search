import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import plantsData from '../data/plants.json'

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
  { key: 'wildlifeValue', field: 'wildlifeValue', isArray: true },
  { key: 'family', field: 'family', isArray: false },
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
    for (const p of plantsData) {
      const v = p[f.field]
      if (v == null) continue
      if (f.isArray) all.push(...v)
      else all.push(v)
    }
    options[f.key] = uniqueSorted(all, f.numeric)
  }
  options.maxHeight = Math.max(...plantsData.map((p) => p.heightFeet?.max ?? 0))
  return options
}

export const allPlants = plantsData

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
  const deerOnly = computed(() => route.query.deer === '1')
  const cutFlowerOnly = computed(() => route.query.cut === '1')
  const culinaryOnly = computed(() => route.query.edible === '1')
  const springEphemeralOnly = computed(() => route.query.ephemeral === '1')
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
  function setDeerOnly(val) {
    setQuery({ deer: val ? '1' : undefined })
  }
  function setCutFlowerOnly(val) {
    setQuery({ cut: val ? '1' : undefined })
  }
  function setCulinaryOnly(val) {
    setQuery({ edible: val ? '1' : undefined })
  }
  function setSpringEphemeralOnly(val) {
    setQuery({ ephemeral: val ? '1' : undefined })
  }
  function setSortBy(val) {
    setQuery({ sort: val && val !== 'common' ? val : undefined })
  }
  function clearAll() {
    router.replace({ query: {} })
  }

  const filteredPlants = computed(() => {
    const q = query.value.trim().toLowerCase()
    const sel = selected.value
    const hMax = heightMax.value
    const hMin = heightMin.value
    const deer = deerOnly.value

    return plantsData.filter((p) => {
      if (q) {
        const hay = [p.scientificName, ...(p.commonNames || [])].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      for (const f of MULTI_FILTERS) {
        const chosen = sel[f.key]
        if (!chosen || chosen.length === 0) continue
        const v = p[f.field]
        if (v == null) return false
        if (f.isArray) {
          if (!v.some((x) => chosen.includes(x))) return false
        } else {
          if (!chosen.includes(v)) return false
        }
      }
      if (hMax != null) {
        const plantMin = p.heightFeet?.min ?? p.heightFeet?.max ?? 0
        if (plantMin > hMax) return false
      }
      if (hMin != null) {
        const plantMax = p.heightFeet?.max ?? p.heightFeet?.min ?? 0
        if (plantMax < hMin) return false
      }
      if (deer && !p.deerResistant) return false
      if (cutFlowerOnly.value && !p.cutFlower) return false
      if (culinaryOnly.value && !p.culinaryUse) return false
      if (springEphemeralOnly.value && !p.springEphemeral) return false
      return true
    })
  })

  const sortedPlants = computed(() => {
    const list = [...filteredPlants.value]
    const firstBloom = (p) => (p.bloomMonths?.length ? Math.min(...p.bloomMonths) : 99)
    const cmpStr = (a, b) => String(a).localeCompare(String(b))
    switch (sortBy.value) {
      case 'scientific':
        list.sort((a, b) => cmpStr(a.scientificName, b.scientificName))
        break
      case 'heightAsc':
        list.sort((a, b) => (a.heightFeet?.min ?? 0) - (b.heightFeet?.min ?? 0))
        break
      case 'heightDesc':
        list.sort((a, b) => (b.heightFeet?.max ?? 0) - (a.heightFeet?.max ?? 0))
        break
      case 'bloomStart':
        list.sort((a, b) => firstBloom(a) - firstBloom(b))
        break
      case 'common':
      default:
        list.sort((a, b) => cmpStr(a.commonNames?.[0] || '', b.commonNames?.[0] || ''))
    }
    return list
  })

  const activeFilterCount = computed(() => {
    let n = 0
    if (query.value) n++
    for (const f of MULTI_FILTERS) n += (selected.value[f.key] || []).length
    if (heightMax.value != null) n++
    if (heightMin.value != null) n++
    if (deerOnly.value) n++
    if (cutFlowerOnly.value) n++
    if (culinaryOnly.value) n++
    if (springEphemeralOnly.value) n++
    return n
  })

  return {
    query,
    selected,
    heightMax,
    heightMin,
    deerOnly,
    cutFlowerOnly,
    culinaryOnly,
    springEphemeralOnly,
    sortBy,
    filteredPlants,
    sortedPlants,
    activeFilterCount,
    setSearch,
    toggleFilter,
    clearFilter,
    setHeightMax,
    setHeightMin,
    setDeerOnly,
    setCutFlowerOnly,
    setCulinaryOnly,
    setSpringEphemeralOnly,
    setSortBy,
    clearAll,
  }
}

export const MONTH_LABELS = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

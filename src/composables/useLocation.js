import { ref, computed } from 'vue'

// The user's home state, persisted so the catalog defaults to plants native to
// where they garden. A single USPS state code (e.g. 'OH') or null for "all".
// Mirrors useFavorites.js: a module-level ref shared across the app, backed by
// localStorage with cross-tab sync.

const STORAGE_KEY = 'nps:location'

// 50 states + DC, matching the codes produced by enrich-usda.mjs.
export const US_STATES = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'],
  ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
  ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'],
  ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'],
  ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'],
  ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'],
  ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'],
  ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'],
  ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'],
  ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'],
  ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'],
  ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
]

const STATE_NAME = Object.fromEntries(US_STATES)

export function stateName(code) {
  return STATE_NAME[code] || code
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw && STATE_NAME[raw] ? raw : null
  } catch {
    return null
  }
}

const location = ref(load())

function persist() {
  try {
    if (location.value) localStorage.setItem(STORAGE_KEY, location.value)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore quota / disabled storage
  }
}

window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) location.value = load()
})

export function useLocation() {
  function setLocation(code) {
    location.value = code && STATE_NAME[code] ? code : null
    persist()
  }
  function clearLocation() {
    location.value = null
    persist()
  }
  return {
    location,
    locationName: computed(() => (location.value ? stateName(location.value) : null)),
    setLocation,
    clearLocation,
  }
}

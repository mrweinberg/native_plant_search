import { ref, computed } from 'vue'

const STORAGE_KEY = 'nps:favorites'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

const favorites = ref(load())

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites.value))
  } catch {
    // ignore quota / disabled storage
  }
}

window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) favorites.value = load()
})

export function useFavorites() {
  const favoriteSet = computed(() => new Set(favorites.value))
  function isFavorite(id) {
    return favoriteSet.value.has(id)
  }
  function toggle(id) {
    const i = favorites.value.indexOf(id)
    if (i === -1) favorites.value.push(id)
    else favorites.value.splice(i, 1)
    persist()
  }
  function clear() {
    favorites.value = []
    persist()
  }
  return {
    favorites,
    favoriteSet,
    count: computed(() => favorites.value.length),
    isFavorite,
    toggle,
    clear,
  }
}

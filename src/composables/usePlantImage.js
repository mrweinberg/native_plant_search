import { ref, watchEffect } from 'vue'

const cache = new Map()

function fetchThumb(scientificName) {
  if (cache.has(scientificName)) return cache.get(scientificName)
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    scientificName.replace(/ /g, '_'),
  )}`
  const promise = fetch(url)
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => data?.originalimage?.source || data?.thumbnail?.source || null)
    .catch(() => null)
  cache.set(scientificName, promise)
  return promise
}

export function usePlantImage(scientificNameRef) {
  const src = ref(null)
  const loading = ref(false)
  watchEffect(async () => {
    const name = typeof scientificNameRef === 'string' ? scientificNameRef : scientificNameRef.value
    if (!name) return
    src.value = null
    loading.value = true
    src.value = await fetchThumb(name)
    loading.value = false
  })
  return { src, loading }
}

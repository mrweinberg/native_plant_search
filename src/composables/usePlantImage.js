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

function unwrap(maybeRef) {
  if (maybeRef == null) return null
  return typeof maybeRef === 'object' && 'value' in maybeRef ? maybeRef.value : maybeRef
}

export function usePlantImage(scientificNameRef, imageFileRef) {
  const src = ref(null)
  const loading = ref(false)
  watchEffect(async () => {
    const name = unwrap(scientificNameRef)
    const file = unwrap(imageFileRef)
    if (file) {
      src.value = `${import.meta.env.BASE_URL}${file}`
      loading.value = false
      return
    }
    if (!name) return
    src.value = null
    loading.value = true
    src.value = await fetchThumb(name)
    loading.value = false
  })
  return { src, loading }
}

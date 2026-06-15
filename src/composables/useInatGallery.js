import { ref, watchEffect } from 'vue'

const cache = new Map()

// iNaturalist serves photo URLs with a size token in the filename
// (square / small / medium / large / original). The API hands back the
// `square` variant by default, so swap in a bigger one for the gallery.
function sized(url, size) {
  return url ? url.replace(/\/square\./, `/${size}.`) : url
}

// The taxa search endpoint returns only a single `default_photo`; the full
// `taxon_photos` gallery lives on the per-taxon detail endpoint, so we resolve
// the name to a taxon id first, then fetch that taxon's photos.
function fetchPhotos(scientificName) {
  if (cache.has(scientificName)) return cache.get(scientificName)
  const searchUrl = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(
    scientificName,
  )}&rank=species&per_page=1`
  const promise = fetch(searchUrl)
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      const id = data?.results?.[0]?.id
      if (!id) return null
      return fetch(`https://api.inaturalist.org/v1/taxa/${id}`).then((r) =>
        r.ok ? r.json() : null,
      )
    })
    .then((data) => {
      const taxon = data?.results?.[0]
      if (!taxon?.taxon_photos?.length) return []
      return taxon.taxon_photos
        .map((tp) => tp.photo)
        .filter((p) => p?.url)
        .map((p) => ({
          thumb: sized(p.url, 'medium'),
          full: sized(p.url, 'large'),
          attribution: p.attribution || '',
        }))
    })
    .catch(() => [])
  cache.set(scientificName, promise)
  return promise
}

export function useInatGallery(scientificNameRef) {
  const photos = ref([])
  const loading = ref(false)
  watchEffect(async () => {
    const name = typeof scientificNameRef === 'string' ? scientificNameRef : scientificNameRef.value
    if (!name) return
    photos.value = []
    loading.value = true
    photos.value = await fetchPhotos(name)
    loading.value = false
  })
  return { photos, loading }
}

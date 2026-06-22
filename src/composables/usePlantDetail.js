// Lazy-loads the full catalog (with the detail-only fields the slim list omits)
// only when a detail page needs it. The import is cached, so the full payload is
// fetched at most once per session and reused across detail pages.
let cache = null

export function loadFullPlant(id) {
  if (!cache) {
    cache = import('../data/plants.json').then((m) => {
      const map = Object.create(null)
      for (const p of m.default) map[p.id] = p
      return map
    })
  }
  return cache.then((map) => map[id] || null)
}

// Per-route head management for the SPA: keeps <title>, meta description,
// canonical, and Open Graph / Twitter tags in sync as the user navigates, so
// shared links and crawled pages get page-specific metadata. The static tags in
// index.html are the defaults/fallback; this updates them in place.

const SITE = 'https://bedfellow.org'
const DEFAULT_TITLE = 'Bedfellow — Plan a native garden that blooms all season'
const DEFAULT_DESC =
  'Search North American native plants by region, light, soil, and bloom time, and find companion plants that thrive together.'
const DEFAULT_IMAGE = `${SITE}/plants/echinacea-purpurea.jpg`

function upsert(selector, create, value, attr = 'content') {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = create()
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

function metaName(name, value) {
  upsert(`meta[name="${name}"]`, () => {
    const m = document.createElement('meta')
    m.setAttribute('name', name)
    return m
  }, value)
}

function metaProp(prop, value) {
  upsert(`meta[property="${prop}"]`, () => {
    const m = document.createElement('meta')
    m.setAttribute('property', prop)
    return m
  }, value)
}

// Set head tags for a route. `path` should be the clean route path ("/plant/x").
export function setHead({ title, description, path = '/', image, type = 'website' } = {}) {
  const fullTitle = title ? `${title} — Bedfellow` : DEFAULT_TITLE
  const desc = (description || DEFAULT_DESC).replace(/\s+/g, ' ').trim().slice(0, 200)
  const url = `${SITE}${path}`
  const img = image || DEFAULT_IMAGE

  document.title = fullTitle
  metaName('description', desc)
  upsert('link[rel="canonical"]', () => {
    const l = document.createElement('link')
    l.setAttribute('rel', 'canonical')
    return l
  }, url, 'href')

  metaProp('og:type', type)
  metaProp('og:title', fullTitle)
  metaProp('og:description', desc)
  metaProp('og:url', url)
  metaProp('og:image', img)
  metaName('twitter:title', fullTitle)
  metaName('twitter:description', desc)
  metaName('twitter:image', img)
}

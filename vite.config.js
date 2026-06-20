import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const SITE = 'https://bedfellow.org'
const DEFAULT_IMAGE = `${SITE}/plants/echinacea-purpurea.jpg`

// Emit sitemap.xml at build time: the home, favorites, and sources pages plus
// one URL per plant, so search engines can discover every detail page.
function sitemap() {
  return {
    name: 'generate-sitemap',
    apply: 'build',
    closeBundle() {
      const plants = JSON.parse(
        readFileSync(join(import.meta.dirname, 'src/data/plants.json'), 'utf8'),
      )
      const today = new Date().toISOString().slice(0, 10)
      const urls = [
        { loc: '/', priority: '1.0' },
        { loc: '/favorites', priority: '0.3' },
        { loc: '/sources', priority: '0.3' },
        ...plants.map((p) => ({ loc: `/plant/${p.id}`, priority: '0.7' })),
      ]
      const body = urls
        .map(
          (u) =>
            `  <url><loc>${SITE}${u.loc}</loc><lastmod>${today}</lastmod><priority>${u.priority}</priority></url>`,
        )
        .join('\n')
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
      writeFileSync(join(import.meta.dirname, 'dist/sitemap.xml'), xml)
      console.log(`sitemap.xml: ${urls.length} URLs`)
    },
  }
}

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

// Replace (or insert) a <meta> tag's content by its name=/property= key.
function setMeta(html, attr, key, value) {
  const re = new RegExp(`(<meta\\s+${attr}="${key}"[^>]*?content=")[^"]*(")`, 'i')
  if (re.test(html)) return html.replace(re, `$1${value}$2`)
  return html.replace('</head>', `    <meta ${attr}="${key}" content="${value}" />\n  </head>`)
}

// Bake per-route metadata into static HTML so social scrapers and non-JS
// crawlers get correct preview cards and titles. The built dist/index.html is
// the template (correct hashed asset refs + default tags); we clone it per route
// and swap the head tags. The body stays the SPA shell — the client app and
// useHead.js take over on load, and Google/Bing render the JS for full content.
function prerender() {
  return {
    name: 'prerender-meta',
    apply: 'build',
    enforce: 'post',
    closeBundle() {
      const root = import.meta.dirname
      const dist = join(root, 'dist')
      const template = readFileSync(join(dist, 'index.html'), 'utf8')
      const plants = JSON.parse(readFileSync(join(root, 'src/data/plants.json'), 'utf8'))

      const render = ({ title, description, path, image, type = 'website' }) => {
        const t = escapeHtml(title)
        const d = escapeHtml(String(description).replace(/\s+/g, ' ').trim().slice(0, 200))
        const url = `${SITE}${path}`
        const img = escapeHtml(image || DEFAULT_IMAGE)
        let html = template
        html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${t}</title>`)
        html = setMeta(html, 'name', 'description', d)
        html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
        html = setMeta(html, 'property', 'og:type', type)
        html = setMeta(html, 'property', 'og:title', t)
        html = setMeta(html, 'property', 'og:description', d)
        html = setMeta(html, 'property', 'og:url', url)
        html = setMeta(html, 'property', 'og:image', img)
        html = setMeta(html, 'name', 'twitter:title', t)
        html = setMeta(html, 'name', 'twitter:description', d)
        html = setMeta(html, 'name', 'twitter:image', img)
        return html
      }

      const write = (routePath, html) => {
        const dir = join(dist, routePath)
        mkdirSync(dir, { recursive: true })
        writeFileSync(join(dir, 'index.html'), html)
      }

      for (const p of plants) {
        write(
          `plant/${p.id}`,
          render({
            title: `${p.commonNames[0]} (${p.scientificName}) — Bedfellow`,
            description:
              p.notes ||
              `${p.commonNames[0]} (${p.scientificName}), a native ${p.generalAppearance || 'plant'}.`,
            path: `/plant/${p.id}`,
            image: p.imageFile ? `${SITE}/${p.imageFile}` : DEFAULT_IMAGE,
            type: 'article',
          }),
        )
      }
      write(
        'sources',
        render({
          title: 'Sources & data — Bedfellow',
          description:
            'The data sources behind Bedfellow: USDA PLANTS, GBIF, Wikimedia, iNaturalist, and regional native-plant authorities.',
          path: '/sources',
        }),
      )
      write(
        'favorites',
        render({
          title: 'Favorites — Bedfellow',
          description:
            'Your saved native plants, with a bloom-coverage timeline and companion planting beds.',
          path: '/favorites',
        }),
      )
      console.log(`prerendered ${plants.length} plant pages + sources + favorites`)
    },
  }
}

export default defineConfig({
  plugins: [vue(), sitemap(), prerender()],
  base: '/',
  build: {
    // The plant catalog is deliberately code-split into its own lazily-loaded
    // chunk (see usePlantFilters.js), so its size is expected and not part of
    // the initial app shell. Raise the warning threshold past it.
    chunkSizeWarningLimit: 1000,
  },
})

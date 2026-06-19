import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SITE = 'https://bedfellow.org'

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

export default defineConfig({
  plugins: [vue(), sitemap()],
  base: '/',
  build: {
    // The plant catalog is deliberately code-split into its own lazily-loaded
    // chunk (see usePlantFilters.js), so its size is expected and not part of
    // the initial app shell. Raise the warning threshold past it.
    chunkSizeWarningLimit: 1000,
  },
})

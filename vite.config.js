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
        { loc: '/about', priority: '0.3' },
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

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December']

// Static body content for a plant page: real name, description, and key facts
// baked into the HTML so crawlers (and no-JS visitors) get the content without
// running the app. Vue replaces #app on mount, so this is purely a fallback.
function plantContent(p) {
  const e = escapeHtml
  const rows = []
  const add = (label, val) => { if (val) rows.push(`<dt>${label}</dt><dd>${e(val)}</dd>`) }
  add('Family', p.family)
  add('Type', p.generalAppearance)
  add('Lifespan', p.lifespan)
  if (p.heightFeet) add('Height', `${p.heightFeet.min}–${p.heightFeet.max} ft`)
  if (p.spreadFeet) add('Spacing', `${p.spreadFeet.min}–${p.spreadFeet.max} ft apart`)
  add('Light', (p.lightRequirement || []).join(', '))
  add('Soil moisture', (p.soilMoisture || []).join(', '))
  add('Soil pH', (p.soilPh || []).join(', '))
  if (p.bloomMonths?.length) add('Bloom', p.bloomMonths.map((m) => MONTHS[m]).join(', '))
  add('Bloom colors', (p.bloomColors || []).join(', '))
  add('Wildlife value', (p.wildlifeValue || []).join(', '))
  if (p.caterpillarHosts) add('Caterpillar hosts', `~${p.caterpillarHosts} butterfly & moth species`)
  add('Landscape uses', (p.landscapeUses || []).join(', '))
  add('Native states', (p.nativeStates || []).join(', '))
  const alt = p.commonNames.length > 1
    ? `<p>Also known as: ${e(p.commonNames.slice(1).join(', '))}</p>` : ''
  const notes = p.notes ? `<p>${e(p.notes)}</p>` : ''
  return (
    `<main><p><a href="/">&larr; Bedfellow</a></p>` +
    `<h1>${e(p.commonNames[0])}</h1>` +
    `<p><em>${e(p.scientificName)}</em></p>` +
    alt + notes +
    (rows.length ? `<dl>${rows.join('')}</dl>` : '') +
    `</main>`
  )
}

// BreadcrumbList structured data (Home > plant) — a Google-supported rich result.
function breadcrumb(p) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Bedfellow', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: p.commonNames[0], item: `${SITE}/plant/${p.id}` },
    ],
  }
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`
}

// Static homepage body so crawlers and LLMs get a real H1, descriptive copy,
// and internal links instead of an empty app shell. Vue clobbers #app on mount,
// so this never reaches interactive users.
function homeContent(plants) {
  const e = escapeHtml
  const sample = plants.filter((p) => p.keystone).slice(0, 12)
  const links = sample
    .map((p) => `<li><a href="/plant/${p.id}">${e(p.commonNames[0])} (${e(p.scientificName)})</a></li>`)
    .join('')
  return (
    `<main>` +
    `<h1>Search North American native plants</h1>` +
    `<p>Bedfellow helps you plan a native garden that blooms all season. Filter ${plants.length} ` +
    `North American native plants by region and state, light, soil moisture and type, soil pH, bloom ` +
    `time, height, and wildlife value — then save favorites, build companion-planting beds, and check ` +
    `bloom coverage month by month.</p>` +
    `<p>Native range, scientific names, and photos come from USDA PLANTS, GBIF, Wikimedia Commons, and ` +
    `iNaturalist; growing conditions and descriptions are editorially curated. ` +
    `<a href="/sources">See sources &amp; data</a>.</p>` +
    `<h2>Explore</h2>` +
    `<ul><li><a href="/favorites">Favorites, bloom timeline &amp; companion beds</a></li>` +
    `<li><a href="/sources">Sources &amp; data</a></li></ul>` +
    `<h2>Keystone native plants</h2>` +
    `<p>Keystone genera support an outsized number of native caterpillar species — the food base for ` +
    `songbirds. A few in the catalog:</p>` +
    `<ul>${links}</ul>` +
    `</main>`
  )
}

// Static body for the About page so crawlers and LLMs get the real story and
// internal links instead of an empty shell. Mirrors src/views/AboutView.vue.
function aboutContent() {
  return (
    `<main>` +
    `<h1>About Bedfellow</h1>` +
    `<h2>Why make Bedfellow?</h2>` +
    `<p>Hey, I'm Max. This year, me and my wife decided to take the plunge on taking our gardens ` +
    `back after years of neglect. After much education and planning, we found that we really wanted ` +
    `to follow the native plant ethos when growing our garden. My wife, especially, took to it.</p>` +
    `<p>When looking over her shoulder, browsing the many resources to find plants native to your ` +
    `area, I noticed that what they had in authority, they lacked in tooling. They were built by ` +
    `people who knew plants, more than anything.</p>` +
    `<p>I don't know plants; I know software. So I felt like I could build a tool to help plan our ` +
    `garden, one that lets you figure out bloom cycles, light requirements, and especially finding ` +
    `those that are great to eat or decorate with. Using the volumes of public information to ` +
    `validate and fill out the data, I am hoping that Bedfellow is a helpful tool for us and others ` +
    `to plan their perfect garden that blooms all season long.</p>` +
    `<p>It's still a very young app, but it's getting significantly better by the day. It's already ` +
    `helping us fill out our gardening plans and I hope it'll help you, too!</p>` +
    `<h2>Why native plants?</h2>` +
    `<p>When you go to a garden center, you'll find many beautiful plants to decorate your outdoor ` +
    `spaces. Vivid tropicals and exotics are common, meant to attract the eye, but those plants may ` +
    `be out of sync with your ecosystem. They may support wonderful birds and butterflies, but they ` +
    `don't support <em>your</em> birds and butterflies.</p>` +
    `<p>Native plants keep you engaged with your ecosystem. Because they're from your area, they ` +
    `grow more naturally, but they also support the local wildlife as food, places to nest, and ` +
    `sources to pollinate.</p>` +
    `<p>In our ecosystem, different living beings need each other. You can support beautiful birds ` +
    `and little caterpillars with just some care. A few favorites from the catalog:</p>` +
    `<ul>` +
    `<li><a href="/plant/asclepias-tuberosa">Butterfly Weed</a> and its fellow milkweeds are the ` +
    `only plants monarch caterpillars can eat — no milkweed, no monarchs.</li>` +
    `<li><a href="/plant/lobelia-cardinalis">Cardinal Flower</a> holds out scarlet tubes shaped for ` +
    `the long bills of ruby-throated hummingbirds.</li>` +
    `<li>A single <a href="/plant/quercus-alba">White Oak</a> can host hundreds of kinds of ` +
    `caterpillars — the protein that feeds baby chickadees and other songbirds.</li>` +
    `</ul>` +
    `<p>Native plants are also far more likely to play nicely. They are made for your environment, ` +
    `so they are far less likely to spread wildly and become a lasting problem.</p>` +
    `<h2>Get in touch</h2>` +
    `<p>Questions, suggestions, or just want to say hi? Email me at ` +
    `<a href="mailto:max@bedfellow.org">max@bedfellow.org</a>.</p>` +
    `</main>`
  )
}

// Concise static body for the Sources page (the live view holds the full text).
function sourcesContent(plants) {
  return (
    `<main>` +
    `<h1>Sources &amp; data</h1>` +
    `<p>Bedfellow's catalog of ${plants.length} native plants is built in two layers. Native range, ` +
    `scientific names, and photographs come from public databases; growing conditions, bloom times, ` +
    `wildlife value, deer resistance, and descriptions are editorially written with AI assistance from ` +
    `the horticultural references below, and may contain errors.</p>` +
    `<ul>` +
    `<li>USDA PLANTS Database — scientific names, symbols, and native status by region</li>` +
    `<li>GBIF — per-state occurrence records used as a presence proxy</li>` +
    `<li>Wikimedia Commons and iNaturalist — photographs, under their individual licenses</li>` +
    `<li>Lady Bird Johnson Wildflower Center, Xerces Society, Calscape, Oregon Flora, and the ` +
    `Arizona-Sonora Desert Museum — species selection and horticulture</li>` +
    `<li>Doug Tallamy / NWF Native Plant Finder — caterpillar host counts and keystone designations</li>` +
    `</ul>` +
    `</main>`
  )
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

      const render = ({ title, description, path, image, type = 'website', content, headExtra }) => {
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
        if (headExtra) html = html.replace('</head>', `    ${headExtra}\n  </head>`)
        if (content) html = html.replace(/<div id="app">\s*<\/div>/, `<div id="app"><div data-ssr>${content}</div></div>`)
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
            content: plantContent(p),
            headExtra: breadcrumb(p),
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
          content: sourcesContent(plants),
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
      write(
        'about',
        render({
          title: 'About — Bedfellow',
          description: 'About Bedfellow, a free tool for searching North American native plants and planning a garden that blooms all season.',
          path: '/about',
          content: aboutContent(),
        }),
      )
      // Overwrite the homepage shell with baked content + a real H1 (was an
      // empty app div — the main SEO/GEO gap from the audit).
      writeFileSync(
        join(dist, 'index.html'),
        render({
          title: 'Bedfellow — Plan a native garden that blooms all season',
          description:
            'Search North American native plants by region, light, soil, and bloom time, and plan a garden with continuous bloom and companion plants that thrive together.',
          path: '/',
          content: homeContent(plants),
        }),
      )
      console.log(`prerendered home + ${plants.length} plant pages + sources + favorites + about`)
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

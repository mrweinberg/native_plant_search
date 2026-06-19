# Bedfellow

A browser-based catalog and planner for Ohio native plants. Built to help home gardeners and habitat planters narrow ~291 species down to the ones that actually fit a given spot — light, moisture, soil, pH, bloom window, wildlife value — and discover companions that thrive in the same conditions.

Live data is bundled at build time, so the site is a static SPA with no backend. It deploys to GitHub Pages.

## Stack

- **Vue 3** with `<script setup>` Composition API
- **Vue Router 4** in HTML5 history mode (clean URLs for SEO; a `404.html` SPA fallback handles deep links on GitHub Pages)
- **Vite 5** for dev server and build
- No CSS framework — custom variables in `src/styles.css`
- No state library — filter state lives in the URL query string; favorites in `localStorage`

## Data

All plant records live in `src/data/plants.json`. Each entry has identity (scientific name, common names, family, USDA symbol), growth shape (height, spread, lifespan, leaf arrangement/retention), site requirements (light, soil moisture, soil type, soil pH, spread habit), bloom data (months, colors), wildlife value, native range (states + USDA regions), and a curated `notes` blurb.

Three garden-planning fields exist on every plant:

- `soilPh` — array of `acidic` / `neutral` / `alkaline`
- `spreadHabit` — `clump` / `rhizomatous` / `aggressive`
- `springEphemeral` — boolean (dies back by midsummer)

Images and photo galleries are fetched at runtime from Wikipedia and iNaturalist — they're not bundled.

## Features

- Search by common or scientific name
- Multi-axis filtering: type, light, moisture, soil, pH, spread habit, bloom month, color, leaf traits, native state, wildlife value, family, plus height range and boolean toggles (deer-resistant, cut flower, edible, spring ephemeral)
- Sticky removable chips show every active filter at the top of the results
- Calendar view that visualizes bloom months across the filtered set
- Per-plant detail page with iNaturalist photo gallery, Wikipedia link, and a **Companion plants** section that scores other natives on shared growing conditions plus a bloom-succession bonus
- Favorites stored in `localStorage`, with a dedicated view
- Filter state encoded in the URL so any view is shareable / linkable

## Project layout

```
src/
  components/    PlantCard, FilterPanel, MultiSelectDropdown, BloomCalendar, ...
  composables/   usePlantFilters (filter state + options), usePlantImage, useInatGallery, useFavorites
  views/         PlantListView, PlantDetailView, FavoritesView
  data/          plants.json (single source of truth)
  router.js      hash-history routes
  styles.css     CSS variables, base styles
scripts/         build-time data enrichment (notes below)
docs/            curated source material (ODNR ranking, etc.)
public/          favicon
```

## Scripts

```bash
npm install
npm run dev      # vite dev server
npm run build    # build to dist/
npm run preview  # serve dist/ locally
```

### Seed pipeline (adding plants region by region)

The dataset grows one region at a time. A seed file at `scripts/seeds/<region>.txt` lists garden-worthy natives (`Scientific Name | Common Name`, one per line). The pipeline turns that list into review-ready records:

1. `node scripts/scaffold-records.mjs <region>` — mints skeleton records (kebab `id` + empty curated fields, flagged `_needsReview`), deduping by id and scientific name so a species native to several regions is added once. Prints the new ids.
2. `node scripts/enrich-usda.mjs <new ids…>` — fills `usdaSymbol`, `nativeStates`, `nativeRegions`.
3. `node scripts/enrich-images.mjs` — downloads bundled thumbnails for any record missing one.
4. **Curate** the botanical/garden fields (notes, bloom, light, moisture, height…) and drop `_needsReview`.
5. `node scripts/validate-records.mjs` — gates the batch: fails if any record still has `_needsReview`, a missing required field, no `nativeStates`, or no `imageFile`. Review the diff, then commit.

### Data enrichment scripts

These are one-shot Node scripts run manually to mutate `src/data/plants.json` in place. They are not part of the build.

- `scripts/enrich-usda.mjs` — backfills USDA symbols and native state/region data
- `scripts/enrich-traits.mjs` — sets `deerResistant`, `cutFlower`, `culinaryUse` flags by id
- `scripts/enrich-garden-traits.mjs` — sets `soilPh`, `spreadHabit`, `springEphemeral` by id

Run them with `node scripts/<name>.mjs`. Each prints how many records it updated and which ids it couldn't find — review the diff before committing.

## Deployment

`npm run build` produces a static `dist/`, served at **bedfellow.org** (custom apex domain) via GitHub Pages. The Vite config uses `base: '/'` and the router uses HTML5 history mode for clean, indexable URLs. Deep links survive hard refreshes through a `public/404.html` SPA fallback (rafgraph/spa-github-pages technique) paired with a decode script in `index.html`.

SEO/discoverability artifacts:

- `public/CNAME` — custom domain
- `public/robots.txt` — allows crawling, points to the sitemap
- `sitemap.xml` — generated at build time (a Vite plugin in `vite.config.js`) with one URL per plant plus the home/favorites/sources pages
- `public/site.webmanifest`, theme color, Open Graph/Twitter tags, and WebSite JSON-LD in `index.html`
- `src/composables/useHead.js` — sets per-route `<title>`, description, canonical, and Open Graph tags (plant detail pages get plant-specific metadata)

## Sources

- ODNR Division of Wildlife native plant fact sheets (see `docs/odnr-candidates.md` for the ranked candidate list driving curation)
- USDA PLANTS Database — symbols, distribution
- GBIF — distribution cross-check
- Wikipedia REST API — images and external links
- iNaturalist API — photo galleries

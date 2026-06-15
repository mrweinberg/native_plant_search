# AGENTS.md

Notes for AI coding agents working in this repo. Optimize for the conventions already in the codebase rather than introducing new patterns.

## What this project is

A Vue 3 + Vite single-page app cataloging ~291 Ohio native plants. All data is bundled in `src/data/plants.json` and consumed at runtime. No backend, no build-time data fetch, no test suite. Deploys as static files to GitHub Pages.

## Conventions to preserve

### State lives in the URL, not in a store
Filter selections, search query, sort, view mode, and boolean toggles are all derived from `route.query` inside `src/composables/usePlantFilters.js`. When adding a new filter, follow the existing pattern:

1. Add an entry to the `MULTI_FILTERS` array (for array/scalar filters that produce option lists) **or** add a boolean computed reading `route.query.<short_key> === '1'`.
2. Add a `set<Thing>` function that calls `setQuery`.
3. Add it to the `filteredPlants` filter loop, the `activeFilterCount` computed, and the return object.
4. Wire it through `FilterPanel.vue` (prop + emit + entry in `groups` array or a new toggle) and through `PlantListView.vue`.
5. Add an entry to `GROUP_TITLES` and `activeChips` in `PlantListView.vue` so it shows up in the sticky filter-chip row.

### Plants are a flat JSON array
`src/data/plants.json` is the single source of truth. Field schema is implicit — read existing records to learn it. Common patterns:

- Array-valued site fields (`lightRequirement`, `soilMoisture`, `soilType`, `soilPh`, `bloomMonths`, `bloomColors`, `nativeStates`, `nativeRegions`, `wildlifeValue`) — a plant can have multiple values; filters use intersection logic.
- Scalar enums (`generalAppearance`, `lifespan`, `leafArrangement`, `leafRetention`, `spreadHabit`, `family`).
- Range objects (`heightFeet`, `spreadFeet`) — `{ min, max }`.
- Booleans (`deerResistant`, `cutFlower`, `culinaryUse`, `springEphemeral`).

Do not introduce a TypeScript schema or a runtime validator unless asked.

### Data enrichment happens in `scripts/*.mjs`
When backfilling a new field across all plants, follow the pattern in `scripts/enrich-garden-traits.mjs`: a flat object keyed by plant `id`, a writer that loads `plants.json`, merges, and writes pretty-printed JSON back. Print the number of records updated and any missing ids. Do not write generated data via the build pipeline.

### Images are fetched at runtime
Detail and card images come from `usePlantImage` (Wikipedia REST summary) and `useInatGallery` (iNaturalist taxa endpoint). Do not bundle binary assets for plants. New visual content should be sourced the same way or via a build-time enrichment to `plants.json` (caching only metadata/URLs, never binaries).

### Styling
Plain scoped CSS in each SFC, plus shared variables in `src/styles.css` (`--card`, `--border`, `--ink`, `--ink-soft`, `--accent`, `--accent-soft`, `--bg`). Use those rather than hex literals where possible. Mobile breakpoint is `max-width: 800px`.

### Routing
Hash history (`createWebHashHistory`). Detail-page back links preserve query so the user returns to the same filtered view — when adding new internal navigation, pass `route.query` through.

## What NOT to do

- Don't add a state library (Pinia, Vuex). Filter state in the URL is intentional.
- Don't add a CSS framework, design tokens beyond `styles.css`, or component library.
- Don't add a test runner or lint config without being asked.
- Don't introduce build-time data fetches in `vite.config.js`. Enrichment is explicit, run by a human, committed to `plants.json`.
- Don't break the URL-as-state contract. Every filter change must be a `router.replace` of the query.

## Verification

There is no test suite. The build is the basic check:

```bash
npm run build
```

For UI changes, run `npm run dev` and verify in a browser. If you cannot run a browser, say so explicitly rather than claiming a feature works.

## Useful pointers

- `docs/odnr-candidates.md` — ranked candidate list (S/A/B/C/D tiers) driving which species get added
- `src/composables/usePlantFilters.js` — the only place filter logic lives; read it before touching filters
- `src/views/PlantDetailView.vue` — companion plants scoring lives inline at the top of `<script setup>`; weights and bonuses are documented by the code, not in a separate file

## When in doubt

Match the existing pattern. This codebase deliberately stays small and direct — no premature abstractions, no defensive validation of internal data, no comments explaining what well-named code already says. If you're tempted to add structure "for future flexibility," don't.

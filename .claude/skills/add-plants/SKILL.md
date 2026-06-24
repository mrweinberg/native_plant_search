---
name: add-plants
description: Add one or more native plant species to the Bedfellow catalog (src/data/plants.json). Use when asked to add plants, fill catalog gaps, expand a genus, or import a region's natives. Covers verifying nativity, the scaffold→enrich→curate pipeline, and the format gotchas that keep the diff clean.
---

# Adding plants to the catalog

The catalog is a flat array in `src/data/plants.json` (one object per species).
New records are minted by `scripts/scaffold-records.mjs` and filled by the
`enrich-*.mjs` scripts plus an editorial pass. **Verify nativity before adding**,
and keep the diff to additions only.

All scripts need network access (USDA PLANTS, GBIF, Wikimedia/iNaturalist).

## Step 0 — Verify candidates (the gate)

Never add a species on memory alone. Run the verifier; it checks USDA L48
nativity + GBIF presence and flags synonyms and dupes:

```
node scripts/verify-natives.mjs "Genus species" "Genus species2"
node scripts/verify-natives.mjs --seed scripts/seeds/<region>.txt
```

Verdicts:
- **ADD** — USDA-native to L48, GBIF accepted name, ≥2 states. Add it.
- **REVIEW(<2 states)** — native but thin/regional presence. Judgment call; the
  catalog *does* include single-state CA/TX endemics, so this is often still a yes.
- **DROP(GBIF synonym)** — its range conflates with the accepted name. Skip.
- **DROP(not L48-native)** / **SKIP(dupe)** — exclude.

Only carry ADD (and accepted REVIEW) species forward.

## Step 1 — Seed file

Add the cleared species to a seed file, one per line, `Scientific Name | Common Name`:

```
# scripts/seeds/gap-<topic>.txt
Coreopsis pubescens | Star Tickseed
```

## Step 2 — Scaffold skeletons

```
node scripts/scaffold-records.mjs gap-<topic>      # or a path to the .txt
```

Prints the new ids. Dupes (by id or scientific name) are skipped automatically.

## Step 3 — Enrich range + USDA symbol

Pass the new ids so it doesn't re-hit the whole catalog:

```
node scripts/enrich-usda.mjs <id1> <id2> …
```

Fills `usdaSymbol`, `nativeRegions`, `nativeStates`. A record that comes back with
no `nativeStates` isn't really US-native — drop it.

## Step 4 — Images (mind the collateral)

```
node scripts/enrich-images.mjs        # fetches only records missing a file
node scripts/optimize-images.mjs      # macOS `sips`; recompresses oversized JPEGs
```

⚠️ **`optimize-images.mjs` touches every over-threshold image, not just the new
ones.** After running it, revert the collateral and keep only the new (untracked)
images:

```
git checkout -- public/plants/        # restores modified existing images
git status --short public/plants       # should show ONLY your new ?? files
```

## Step 5 — Editorial curation

The scaffold leaves curated fields blank. Fill them from horticultural knowledge
(this is how the whole catalog was built — "editorially curated with AI
assistance"). Easiest via a one-off node script that sets fields by id, deletes
`_needsReview`, and writes the file (see Step 6 for the writer).

Fields to curate per record: `family`, `generalAppearance`, `lifespan`,
`heightFeet {min,max}`, `spreadFeet {min,max}`, `lightRequirement`, `soilMoisture`,
`soilType`, `soilPh`, `bloomMonths` (1–12), `bloomColors`, `leafArrangement`,
`leafRetention`, `wildlifeValue`, `spreadHabit`, `landscapeUses`, `deerResistant`,
`cutFlower`, `culinaryUse`, `springEphemeral`, `notes`, and refine `commonNames`.

**Stay inside the closed vocabularies** — `test/data.test.js` is the source of
truth (ENUMS / ARRAY_ENUMS) and will fail the build if you stray. As of writing:
- generalAppearance: wildflower, tree, shrub, grass, fern, vine
- lifespan: perennial, biennial, annual
- leafArrangement: alternate, basal, opposite, whorled
- leafRetention: deciduous, evergreen, semi-evergreen
- spreadHabit: clump, spreading, aggressive, mat-forming
- lightRequirement: sun, part shade, shade
- soilMoisture: dry, moist, wet · soilType: loam, sandy, rocky, clay, peat · soilPh: neutral, acidic, alkaline
- bloomColors: white, yellow, green, pink, purple, brown, blue, red, orange, cream
- wildlifeValue: pollinators, songbirds, butterflies, larval host, mammals, hummingbirds, monarch host
- landscapeUses: border, specimen, erosion control, container, naturalizing, hedge or screen, rain garden, foundation, groundcover

Match the existing field order (read any complete record, e.g. `coreopsis-verticillata`):
`id, scientificName, commonNames, family, nativeStates, generalAppearance, lifespan,
heightFeet, spreadFeet, lightRequirement, soilMoisture, soilType, bloomMonths,
bloomColors, leafArrangement, leafRetention, wildlifeValue, deerResistant, notes,
usdaSymbol, nativeRegions, cutFlower, culinaryUse, soilPh, spreadHabit,
springEphemeral, imageFile, imageSource, imageCredit, imageLicense, imageAuthor,
landscapeUses`.

Flag any records whose horticultural specifics are best-effort (rare/regional
species) so the owner can review — range/identity is verified, traits are editorial.

## Step 6 — Normalize the JSON format (critical)

`plants.json` is committed at **1-space** indent, but every pipeline script writes
**2-space**. So after the pipeline runs, re-serialize to 1-space or the diff will
reformat all ~1,800 records:

```js
import { readFileSync, writeFileSync } from 'node:fs'
const p = 'src/data/plants.json'
const data = JSON.parse(readFileSync(p, 'utf8'))
// …apply curated fields by id, delete _needsReview…
writeFileSync(p, JSON.stringify(data, null, 1) + '\n')   // 1-space + trailing newline
```

Then confirm the diff is additions-only:

```
git diff --stat src/data/plants.json     # insertions ≫ deletions (≈1)
```
Or compare against HEAD: parse both, assert the first N existing records are byte-identical.

## Step 7 — Validate, regenerate, test, build

```
node scripts/validate-records.mjs        # completeness + dup-id gate (must pass)
node scripts/gen-list.mjs                # rebuild the slim plants-list.json (gitignored)
npm test                                 # data-integrity + filter tests must pass
npx vite build                           # prerenders one page per plant + sitemap
```

If a new image field appears on records (e.g. `imageLicense`/`imageAuthor` from the
license-capture work), add it to `DETAIL_ONLY` in `scripts/gen-list.mjs` so it
stays out of the list payload.

## Step 8 — Commit

Stage only this session's files with explicit paths (commit-scope convention):

```
git add src/data/plants.json scripts/seeds/gap-<topic>.txt public/plants/<new>.jpg [scripts/gen-list.mjs]
```

`plants-list.json` is gitignored (rebuilt on dev/build) — don't stage it.

## Gotchas recap
- Verify before adding; exclude GBIF synonyms (range conflation).
- `optimize-images` recompresses unrelated images — revert the collateral.
- Re-serialize `plants.json` to 1-space + trailing newline at the end.
- Respect the `test/data.test.js` enum vocabularies.
- Single-state endemics are acceptable (catalog precedent), but flag low-presence ones.

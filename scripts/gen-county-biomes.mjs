#!/usr/bin/env node
// Build the county -> Level I biome crosswalk (src/data/county-biome.json) by
// point-in-polygon of each county's centroid against the EPA/CEC North America
// Level I ecoregions. Both inputs are authoritative: USDA county distribution
// (gated elsewhere) and the CEC ecoregion framework. enrich-biomes.mjs then
// derives each plant's nativeBiomes from its county index + this crosswalk.
//
// Regen (rarely needed — ecoregions/counties are static). Work files cache in a
// temp dir; delete them to refetch:
//   1. CEC Level I shapefile: dmap-prod-oms-edc.s3.../cec_na/na_cec_eco_l1.zip
//   2. reproject to WGS84 GeoJSON with mapshaper (run once, no committed dep):
//        npx --yes mapshaper na_cec_eco_l1.shp -proj wgs84 -simplify 10% \
//          keep-shapes -o format=geojson eco_l1.geojson
//   3. Census county centroids: 2023_Gaz_counties_national.zip (INTPTLAT/LONG)
// This script automates 1+3 and the join; step 2 is shelled to npx mapshaper.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'src', 'data', 'county-biome.json')
const WORK = process.env.ECO_WORK || join(tmpdir(), 'bedfellow-eco')
mkdirSync(WORK, { recursive: true })

async function download(url, file) {
  const path = join(WORK, file)
  if (existsSync(path)) return path
  process.stdout.write(`fetching ${file}… `)
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${r.status} for ${url}`)
  writeFileSync(path, Buffer.from(await r.arrayBuffer()))
  console.log('ok')
  return path
}

// --- 1) ecoregion polygons (WGS84 GeoJSON) ---
const geojsonPath = join(WORK, 'eco_l1.geojson')
if (!existsSync(geojsonPath)) {
  const zip = await download(
    'https://dmap-prod-oms-edc.s3.us-east-1.amazonaws.com/ORD/Ecoregions/cec_na/na_cec_eco_l1.zip',
    'l1.zip',
  )
  execSync(`unzip -oq "${zip}" -d "${WORK}"`)
  console.log('reprojecting shapefile -> WGS84 GeoJSON (mapshaper)…')
  execSync(
    `npx --yes mapshaper "${join(WORK, 'NA_CEC_Eco_Level1.shp')}" -proj wgs84 ` +
      `-simplify 10% keep-shapes -o format=geojson "${geojsonPath}"`,
    { stdio: 'inherit' },
  )
}
const eco = JSON.parse(readFileSync(geojsonPath, 'utf8'))

// --- 2) county centroids (FIPS -> [lat, lon]) ---
const gazZip = await download(
  'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/2023_Gaz_counties_national.zip',
  'gaz.zip',
)
execSync(`unzip -oq "${gazZip}" -d "${WORK}"`)
const gaz = readFileSync(join(WORK, '2023_Gaz_counties_national.txt'), 'latin1').trim().split(/\r?\n/)
const h = gaz[0].split('\t').map((s) => s.trim())
const [gi, la, lo] = ['GEOID', 'INTPTLAT', 'INTPTLONG'].map((k) => h.indexOf(k))
const centroids = {}
for (const line of gaz.slice(1)) {
  const c = line.split('\t')
  centroids[c[gi].trim()] = [+c[la], +c[lo]]
}

// --- 3) point-in-polygon join ---
const titleCase = (s) =>
  s.toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase())
const inRing = ([x, y], r) => {
  let inside = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
const inPoly = (pt, p) => inRing(pt, p[0]) && !p.slice(1).some((hole) => inRing(pt, hole))
const inGeom = (pt, g) =>
  g.type === 'Polygon' ? inPoly(pt, g.coordinates) : g.coordinates.some((p) => inPoly(pt, p))

const feats = eco.features
  .filter((f) => f.properties.NA_L1NAME !== 'WATER')
  .map((f) => {
    let b = [Infinity, Infinity, -Infinity, -Infinity]
    const scan = (r) => r.forEach(([x, y]) => {
      if (x < b[0]) b[0] = x; if (x > b[2]) b[2] = x; if (y < b[1]) b[1] = y; if (y > b[3]) b[3] = y
    })
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
    polys.forEach((p) => p.forEach(scan))
    return { name: titleCase(f.properties.NA_L1NAME), geom: f.geometry, bbox: b }
  })

const crosswalk = {}
for (const [fips, c] of Object.entries(centroids)) {
  const pt = [c[1], c[0]]
  for (const f of feats) {
    const [x0, y0, x1, y1] = f.bbox
    if (pt[0] < x0 || pt[0] > x1 || pt[1] < y0 || pt[1] > y1) continue
    if (inGeom(pt, f.geom)) { crosswalk[fips] = f.name; break }
  }
}

const sorted = Object.fromEntries(Object.entries(crosswalk).sort())
writeFileSync(OUT, JSON.stringify(sorted))
const biomes = [...new Set(Object.values(sorted))].sort()
console.log(
  `\nwrote ${OUT}\n${Object.keys(sorted).length}/${Object.keys(centroids).length} counties assigned, ` +
    `${biomes.length} biomes:\n  ${biomes.join('\n  ')}`,
)

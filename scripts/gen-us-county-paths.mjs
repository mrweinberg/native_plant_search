#!/usr/bin/env node
// Generate the national county geometry for RangeMap's choropleth: every county
// projected to Albers USA (AK/HI as insets) plus state fills, a county-border
// mesh, a state-border mesh, and the nation outline — all in one aligned file
// (src/data/usCountyPaths.json), loaded lazily and cached across detail pages.
//
// State fills let the map fall back to whole-state shading for native states
// with no USDA county data (e.g. Connecticut). The border meshes mean the map
// renders as a handful of merged <path>s instead of 3k+ elements.
//
// Generation-time deps: d3-geo, topojson-client (devDependencies).
// Usage: node scripts/gen-us-county-paths.mjs

import { geoAlbersUsa, geoPath } from 'd3-geo'
import { feature, mesh } from 'topojson-client'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { gzipSync } from 'node:zlib'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'usCountyPaths.json')
const SRC = 'https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json'

const topo = await (await fetch(SRC)).json()
const W = 975, H = 610
const path = geoPath(geoAlbersUsa().scale(1300).translate([W / 2, H / 2]))
// Integer precision is plenty on a 975px-wide canvas and meaningfully smaller.
const round = (d) => (d ? d.replace(/\d+\.\d+/g, (n) => Math.round(+n)) : '')

const counties = {}
for (const f of feature(topo, topo.objects.counties).features) {
  const d = path(f)
  if (d) counties[String(f.id).padStart(5, '0')] = round(d)
}
const states = {}
for (const f of feature(topo, topo.objects.states).features) {
  const d = path(f)
  if (d) states[String(f.id).padStart(2, '0')] = round(d)
}
const countyBorders = round(path(mesh(topo, topo.objects.counties, (a, b) => a !== b)))
const stateBorders = round(path(mesh(topo, topo.objects.states, (a, b) => a !== b)))
const nation = round(path(feature(topo, topo.objects.nation)))

const out = JSON.stringify({ viewBox: `0 0 ${W} ${H}`, counties, states, countyBorders, stateBorders, nation })
writeFileSync(OUT, out)
console.log(
  `counties ${Object.keys(counties).length}, states ${Object.keys(states).length} — ` +
    `${(out.length / 1e6).toFixed(2)} MB raw / ${(gzipSync(out).length / 1024).toFixed(0)} KB gz`,
)

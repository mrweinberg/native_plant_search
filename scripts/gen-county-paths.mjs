#!/usr/bin/env node
// Generate per-state county SVG paths for the plant-detail county map, from the
// pre-projected us-atlas counties TopoJSON (Albers USA, ~975x610 canvas). One
// JSON file per 2-digit state FIPS: { viewBox, paths: { countyFIP3: d } }, so
// RangeMap only ever loads the state in view. TopoJSON arcs are decoded inline
// (delta-encoded ints + transform) to avoid a build dependency.
//
// Usage: node scripts/gen-county-paths.mjs

import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'countyPaths')
const SRC = 'https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json'

const topo = await (await fetch(SRC)).json()
const { scale: [sx, sy], translate: [tx, ty] } = topo.transform

// Decode one arc index to absolute [x,y] points (negative index = reversed arc).
function decodeArc(idx) {
  const arc = topo.arcs[idx < 0 ? ~idx : idx]
  let x = 0, y = 0
  const pts = arc.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty] })
  return idx < 0 ? pts.reverse() : pts
}
function ringCoords(ring) {
  const out = []
  for (const idx of ring) {
    const pts = decodeArc(idx)
    out.push(...(out.length ? pts.slice(1) : pts)) // arcs share endpoints
  }
  return out
}
// Decode a geometry to rings of raw [lon, lat] points.
function geomRings(geom) {
  const polys = geom.type === 'Polygon' ? [geom.arcs] : geom.arcs
  const rings = []
  for (const poly of polys) for (const ring of poly) rings.push(ringCoords(ring))
  return rings
}

// Group counties by state FIPS (county id = 5-digit FIPS).
const byState = {}
for (const geom of topo.objects.counties.geometries) {
  const id = String(geom.id || '').padStart(5, '0')
  if (!/^\d{5}$/.test(id)) continue
  ;(byState[id.slice(0, 2)] ||= []).push(geom)
}

mkdirSync(OUT_DIR, { recursive: true })
let states = 0, counties = 0, bytes = 0
for (const [sf, geoms] of Object.entries(byState)) {
  // Decode once, find the state's latitude band to set the equirectangular
  // x-scale (cos(refLat)); without it lon/lat stretches the map horizontally.
  const decoded = geoms.map((g) => ({ fip: String(g.id).padStart(5, '0').slice(2), rings: geomRings(g) }))
  let minLat = Infinity, maxLat = -Infinity
  for (const { rings } of decoded) for (const r of rings) for (const [, lat] of r) {
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  }
  const k = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180)
  // Project: x = lon*k, y = -lat (flip so north is up).
  const bbox = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  const paths = {}
  for (const { fip, rings } of decoded) {
    let d = ''
    for (const r of rings) {
      d += 'M' + r.map(([lon, lat]) => {
        const x = lon * k, y = -lat
        if (x < bbox.minX) bbox.minX = x
        if (x > bbox.maxX) bbox.maxX = x
        if (y < bbox.minY) bbox.minY = y
        if (y > bbox.maxY) bbox.maxY = y
        return `${x.toFixed(2)},${y.toFixed(2)}`
      }).join('L') + 'Z'
    }
    paths[fip] = d
  }
  const pad = Math.max(bbox.maxX - bbox.minX, bbox.maxY - bbox.minY) * 0.02
  const vb = [
    (bbox.minX - pad).toFixed(2),
    (bbox.minY - pad).toFixed(2),
    (bbox.maxX - bbox.minX + 2 * pad).toFixed(2),
    (bbox.maxY - bbox.minY + 2 * pad).toFixed(2),
  ].join(' ')
  const out = JSON.stringify({ viewBox: vb, paths })
  writeFileSync(join(OUT_DIR, `${sf}.json`), out)
  states++; counties += geoms.length; bytes += out.length
}
console.log(`Wrote ${states} state files, ${counties} counties, ${(bytes / 1e6).toFixed(2)} MB total`)

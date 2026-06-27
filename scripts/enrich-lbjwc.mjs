#!/usr/bin/env node
// Source light / soil-moisture / bloom-months / bloom-colors from the Lady Bird
// Johnson Wildflower Center's NPIN database (wildflower.org), keyed by USDA
// symbol (their id_plant). These are curated, native-garden-focused values and
// far more reliable than our editorial guesses for these fields.
//
// FACTS ONLY: we extract the structured controlled-vocabulary values, never the
// prose (Soil Description / Conditions Comments / Bloom Notes). robots.txt
// permits /plants/. Be a polite crawler — identify, rate-limit, cache.
//
// Writes the factual extract to src/data/lbjwc-traits.json (provenance) and
// applies it to plants.json (per field, only where NPIN has a value; otherwise
// the editorial value is kept). Re-serializes plants.json at 1-space.
//
// Usage: node scripts/enrich-lbjwc.mjs

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PLANTS = join(ROOT, 'src', 'data', 'plants.json')
const OUT = join(ROOT, 'src', 'data', 'lbjwc-traits.json')
const CACHE = join(tmpdir(), 'bedfellow-lbjwc')
mkdirSync(CACHE, { recursive: true })
const UA = 'BedfellowBot/1.0 (native-plant catalog; +https://bedfellow.org; factual trait data, ~3/s)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function page(symbol) {
  const f = join(CACHE, `${symbol}.html`)
  if (existsSync(f)) return readFileSync(f, 'utf8')
  let html = ''
  try {
    const r = await fetch(`https://www.wildflower.org/plants/result.php?id_plant=${symbol}`, {
      headers: { 'User-Agent': UA },
    })
    html = r.ok ? await r.text() : ''
  } catch { /* network — leave empty */ }
  writeFileSync(f, html)
  await sleep(350)
  return html
}

// Value list after a "Label:" up to the next "Capitalized Label:".
function valueAfter(text, label) {
  const i = text.indexOf(`${label}:`)
  if (i < 0) return []
  let rest = text.slice(i + label.length + 1)
  const m = rest.match(/[A-Z][A-Za-z0-9]+(?: [A-Za-z0-9]+){0,3}:/)
  if (m) rest = rest.slice(0, m.index)
  return rest.split(/\s*,\s*/).map((s) => s.trim()).filter(Boolean)
}

const LIGHT = { sun: 'sun', 'part shade': 'part shade', shade: 'shade' }
const SOIL = { dry: 'dry', moist: 'moist', wet: 'wet' }
const MONTH = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 }
const COLOR = { white:'white',yellow:'yellow',green:'green',pink:'pink',purple:'purple',brown:'brown',blue:'blue',red:'red',orange:'orange',cream:'cream',violet:'purple',lavender:'purple',maroon:'red',gold:'yellow' }
const unmappedColors = new Set()

function parse(html) {
  if (!/Light Requirement/.test(html)) return null
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ')
  const map = (vals, table, lower = true) =>
    [...new Set(vals.map((v) => table[lower ? v.toLowerCase() : v]).filter(Boolean))]
  const light = map(valueAfter(text, 'Light Requirement'), LIGHT)
  const soil = map(valueAfter(text, 'Soil Moisture'), SOIL)
  const months = [...new Set(valueAfter(text, 'Bloom Time').map((v) => MONTH[v.slice(0, 3).toLowerCase()]).filter(Boolean))].sort((a, b) => a - b)
  const rawColors = valueAfter(text, 'Bloom Color')
  rawColors.forEach((c) => { if (!COLOR[c.toLowerCase()]) unmappedColors.add(c.toLowerCase()) })
  const colors = map(rawColors, COLOR)
  const out = {}
  if (light.length) out.lightRequirement = light
  if (soil.length) out.soilMoisture = soil
  if (months.length) out.bloomMonths = months
  if (colors.length) out.bloomColors = colors
  return Object.keys(out).length ? out : null
}

const plants = JSON.parse(readFileSync(PLANTS, 'utf8'))
const extract = {}
const counts = { lightRequirement: 0, soilMoisture: 0, bloomMonths: 0, bloomColors: 0 }
let covered = 0
const eq = (a, b) => JSON.stringify([...(a || [])].sort()) === JSON.stringify([...(b || [])].sort())

for (let i = 0; i < plants.length; i++) {
  const p = plants[i]
  if (!p.usdaSymbol) continue
  const t = parse(await page(p.usdaSymbol))
  if (!t) continue
  covered++
  extract[p.usdaSymbol] = t
  for (const f of Object.keys(counts)) {
    if (t[f] && !eq(t[f], p[f])) counts[f]++
    if (t[f]) p[f] = t[f] // NPIN is authority where present; otherwise keep editorial
  }
  if ((i + 1) % 100 === 0) console.log(`[${i + 1}/${plants.length}] covered ${covered}`)
}

writeFileSync(OUT, JSON.stringify(extract, null, 0) + '\n')
writeFileSync(PLANTS, JSON.stringify(plants, null, 1) + '\n')
console.log(`\nNPIN coverage: ${covered}/${plants.length}`)
console.log('fields changed vs editorial:', JSON.stringify(counts))
if (unmappedColors.size) console.log('unmapped bloom colors (kept editorial for those):', [...unmappedColors].join(', '))

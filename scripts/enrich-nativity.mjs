#!/usr/bin/env node
// Harden nativeStates against WCVP (Kew World Checklist) via GBIF. See
// docs/data-quality.md for the rationale and the conservative policy:
//   - no WCVP record            -> keep ours unchanged
//   - WCVP has 0 native US state -> keep ours (cosmopolitan/taxonomic guard)
//   - otherwise: ADD WCVP-native US states, REMOVE only states WCVP explicitly
//     flags INTRODUCED/MANAGED. States merely absent from WCVP are kept.
//
// Writes plants.json at 1-space. Changing nativeStates cascades: re-run
// enrich-county.mjs then enrich-biomes.mjs. Writes a change log to
// /tmp/nativity_changes.json for review.
//
// Usage: node scripts/enrich-nativity.mjs

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const PLANTS = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'plants.json')
const NAME_USPS = { Alabama:'AL',Alaska:'AK',Arizona:'AZ',Arkansas:'AR',California:'CA',Colorado:'CO',Connecticut:'CT',Delaware:'DE',Florida:'FL',Georgia:'GA',Hawaii:'HI',Idaho:'ID',Illinois:'IL',Indiana:'IN',Iowa:'IA',Kansas:'KS',Kentucky:'KY',Louisiana:'LA',Maine:'ME',Maryland:'MD',Massachusetts:'MA',Michigan:'MI',Minnesota:'MN',Mississippi:'MS',Missouri:'MO',Montana:'MT',Nebraska:'NE',Nevada:'NV','New Hampshire':'NH','New Jersey':'NJ','New Mexico':'NM','New York':'NY','North Carolina':'NC','North Dakota':'ND',Ohio:'OH',Oklahoma:'OK',Oregon:'OR',Pennsylvania:'PA','Rhode Island':'RI','South Carolina':'SC','South Dakota':'SD',Tennessee:'TN',Texas:'TX',Utah:'UT',Vermont:'VT',Virginia:'VA',Washington:'WA','West Virginia':'WV',Wisconsin:'WI',Wyoming:'WY','District of Columbia':'DC' }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const getJSON = async (u) => { try { const r = await fetch(u); return r.ok ? r.json() : null } catch { return null } }

// Returns { wcvp: bool, native: Set<USPS>, introduced: Set<USPS> }.
async function wcvp(sci) {
  const m = await getJSON(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(sci)}`)
  if (!m?.usageKey) return { wcvp: false }
  const d = await getJSON(`https://api.gbif.org/v1/species/${m.usageKey}/distributions?limit=500`)
  const rows = (d?.results || []).filter((r) => /World Checklist/i.test(r.source || '') && NAME_USPS[r.locality])
  if (!rows.length) return { wcvp: false }
  const native = new Set(), introduced = new Set()
  for (const r of rows) {
    const s = NAME_USPS[r.locality]
    if (r.establishmentMeans === 'INTRODUCED' || r.establishmentMeans === 'MANAGED') introduced.add(s)
    else native.add(s)
  }
  return { wcvp: true, native, introduced }
}

const plants = JSON.parse(readFileSync(PLANTS, 'utf8'))
const changes = []
let kept = 0
for (let i = 0; i < plants.length; i++) {
  const p = plants[i]
  const ours = new Set(p.nativeStates || [])
  const w = await wcvp(p.scientificName)
  let next = ours
  if (!w.wcvp || w.native.size === 0) {
    kept++ // no WCVP / cosmopolitan guard -> unchanged
  } else {
    next = new Set([...ours, ...w.native])
    for (const s of w.introduced) next.delete(s)
  }
  const before = [...ours].sort()
  const after = [...next].sort()
  if (before.join() !== after.join()) {
    p.nativeStates = after
    changes.push({
      id: p.id, before, after,
      added: after.filter((s) => !ours.has(s)),
      removed: before.filter((s) => !next.has(s)),
    })
  }
  if ((i + 1) % 100 === 0) console.log(`[${i + 1}/${plants.length}] changed so far ${changes.length}`)
  await sleep(90)
}

writeFileSync(PLANTS, JSON.stringify(plants, null, 1) + '\n')
writeFileSync('/tmp/nativity_changes.json', JSON.stringify(changes))
const addT = changes.reduce((a, c) => a + c.added.length, 0)
const remT = changes.reduce((a, c) => a + c.removed.length, 0)
console.log(`\nchanged ${changes.length}/${plants.length} (unchanged ${plants.length - changes.length}); +${addT} states, -${remT} states`)
console.log('change log: /tmp/nativity_changes.json')

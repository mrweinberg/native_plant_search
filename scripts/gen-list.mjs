// Generate src/data/plants-list.json: a slim copy of the catalog with the
// detail-only fields stripped, used by the search/list view so the home page
// doesn't have to download and parse the full catalog before first paint.
// The full plants.json is still loaded lazily by the detail view.
// Runs on `npm run dev` and `npm run build`; the output is gitignored.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
// Fields only the detail page uses — safe to omit from the list payload.
// spreadFeet is kept (it's small and shows in the detail Size section, which
// renders before the full record loads — keeping it avoids a brief "—" flash).
const DETAIL_ONLY = new Set([
  'notes', 'imageSource', 'imageCredit', 'nativeRegions',
  'usdaSymbol', 'caterpillarHosts',
])

const all = JSON.parse(readFileSync(join(root, 'src/data/plants.json'), 'utf8'))
const slim = all.map((p) => {
  const o = {}
  for (const k in p) if (!DETAIL_ONLY.has(k)) o[k] = p[k]
  return o
})
const out = JSON.stringify(slim)
writeFileSync(join(root, 'src/data/plants-list.json'), out)
console.log(`plants-list.json: ${slim.length} records, ${(Buffer.byteLength(out) / 1024).toFixed(0)} KB`)

<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import PlantCard from '../components/PlantCard.vue'
import BloomCalendar from '../components/BloomCalendar.vue'
import FavoriteButton from '../components/FavoriteButton.vue'
import { allPlants, MONTH_LABELS } from '../composables/usePlantFilters.js'
import { useFavorites } from '../composables/useFavorites.js'
import { useLocation } from '../composables/useLocation.js'

const { favorites, favoriteSet, clear, addMany } = useFavorites()
const { location, locationName } = useLocation()
const route = useRoute()
const router = useRouter()

// A shared list arrives as ?ids=a,b,c — render it read-only (without touching the
// viewer's own saved favorites) and offer to merge it in. Otherwise show the
// viewer's own favorites from localStorage.
const sharedIds = computed(() => {
  const raw = route.query.ids
  if (raw == null || raw === '') return null
  return String(raw).split(',').map((s) => s.trim()).filter(Boolean)
})
const isShared = computed(() => sharedIds.value != null)
const sourceIds = computed(() => (isShared.value ? sharedIds.value : favorites.value))

const plants = computed(() =>
  sourceIds.value
    .map((id) => allPlants.value.find((p) => p.id === id))
    .filter(Boolean),
)

const copied = ref(false)
const shareUrl = computed(
  () => `${window.location.origin}/favorites?ids=${favorites.value.join(',')}`,
)
async function copyShare() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    window.prompt('Copy your shareable list link:', shareUrl.value)
  }
}
function importShared() {
  if (sharedIds.value) addMany(sharedIds.value)
  router.push({ name: 'favorites' }) // drop ?ids and show the merged own list
}

// Printable plant / shopping list: a clean, alphabetized table the browser can
// print or "Save as PDF" — the free version of what competitors paywall.
const printPlants = computed(() =>
  [...plants.value].sort((a, b) => a.commonNames[0].localeCompare(b.commonNames[0])),
)
const printDate = computed(() =>
  new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
)
function printList() {
  window.print()
}
function fmtMonths(p) {
  return p.bloomMonths?.length ? p.bloomMonths.map((m) => MONTH_LABELS[m]).join(', ') : '—'
}
function fmtHeight(p) {
  return p.heightFeet ? `${p.heightFeet.min}–${p.heightFeet.max} ft` : '—'
}
function fmtList(arr) {
  return arr && arr.length ? arr.join(', ') : '—'
}

const viewMode = ref('grid')

const coverage = computed(() => {
  const counts = Array(13).fill(0)
  for (const p of plants.value) {
    for (const m of p.bloomMonths || []) counts[m]++
  }
  const months = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    return { month: m, label: MONTH_LABELS[m], count: counts[m] }
  })
  const covered = months.filter((m) => m.count > 0).length
  const gaps = months.filter((m) => m.count === 0).map((m) => m.label)
  const peak = months.reduce((a, b) => (b.count > a.count ? b : a), months[0])
  return { months, covered, gaps, peak }
})

const lightSet = (p) => new Set(p.lightRequirement || [])
const moistSet = (p) => new Set(p.soilMoisture || [])

// The growing conditions of what's already saved — suggestions must match these,
// so anything recommended will actually thrive alongside the current favorites.
const profile = computed(() => {
  const light = new Set()
  const moist = new Set()
  for (const p of plants.value) {
    for (const l of lightSet(p)) light.add(l)
    for (const m of moistSet(p)) moist.add(m)
  }
  return { light, moist }
})

// For each empty month, native candidates that bloom then AND share the saved
// light/moisture profile. Ranked so plants closing the most gaps surface first.
const suggestions = computed(() => {
  if (isShared.value) return [] // gap-fill is for your own list, not a shared one
  const gapMonths = new Set(
    coverage.value.months.filter((m) => m.count === 0).map((m) => m.month),
  )
  if (gapMonths.size === 0 || plants.value.length === 0) return []
  const { light, moist } = profile.value
  const have = favoriteSet.value
  const loc = location.value
  // Keep suggestions regionally plantable: a home state if one is set, otherwise
  // the combined native range of the saved plants, so the plan holds together.
  const favStates = new Set()
  if (!loc) for (const p of plants.value) for (const s of p.nativeStates || []) favStates.add(s)
  const scored = []
  for (const p of allPlants.value) {
    if (have.has(p.id)) continue
    if (loc) {
      if (!(p.nativeStates || []).includes(loc)) continue
    } else if (favStates.size && !(p.nativeStates || []).some((s) => favStates.has(s))) {
      continue
    }
    const fills = (p.bloomMonths || []).filter((m) => gapMonths.has(m))
    if (!fills.length) continue
    const lOverlap = [...lightSet(p)].filter((x) => light.has(x)).length
    const mOverlap = [...moistSet(p)].filter((x) => moist.has(x)).length
    if (light.size && !lOverlap) continue
    if (moist.size && !mOverlap) continue
    scored.push({
      plant: p,
      fills: fills.sort((a, b) => a - b).map((m) => MONTH_LABELS[m]),
      score: fills.length * 10 + lOverlap + mOverlap,
    })
  }
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    // Tie-break toward higher ecological (caterpillar) value.
    const ae = a.plant.caterpillarHosts || 0
    const be = b.plant.caterpillarHosts || 0
    if (be !== ae) return be - ae
    return a.plant.commonNames[0].localeCompare(b.plant.commonNames[0])
  })
  return scored.slice(0, 6)
})

// Group saved plants into beds by the conditions they want, so a gardener can
// see which favorites can share a planting spot. Each plant lands in one bed
// keyed by its primary (first-listed) light + moisture.
const LIGHT_LABEL = { sun: 'Full sun', 'part shade': 'Part shade', shade: 'Shade' }
const LIGHT_ORDER = { sun: 0, 'part shade': 1, shade: 2 }
const MOIST_LABEL = { dry: 'Dry', moist: 'Medium', wet: 'Wet' }
const MOIST_ORDER = { dry: 0, moist: 1, wet: 2 }
const lightLabel = (l) => LIGHT_LABEL[l] || 'Unknown light'
const moistLabel = (m) => MOIST_LABEL[m] || 'Unknown'

const beds = computed(() => {
  const map = new Map()
  for (const p of plants.value) {
    const light = (p.lightRequirement || [])[0] || 'unknown'
    const moist = (p.soilMoisture || [])[0] || 'unknown'
    const key = `${light}|${moist}`
    if (!map.has(key)) map.set(key, { light, moist, plants: [] })
    map.get(key).plants.push(p)
  }
  return [...map.values()].sort(
    (a, b) =>
      b.plants.length - a.plants.length ||
      (LIGHT_ORDER[a.light] ?? 9) - (LIGHT_ORDER[b.light] ?? 9) ||
      (MOIST_ORDER[a.moist] ?? 9) - (MOIST_ORDER[b.moist] ?? 9),
  )
})

function confirmClear() {
  if (favoriteSet.value.size === 0) return
  if (confirm(`Remove all ${favoriteSet.value.size} favorites?`)) clear()
}

// "Back to search" — mirror the detail page: jump straight back to the search
// page's spot in history (restoring its filters and scroll), or fall back to a
// fresh push to the list when there's no search page in history.
function goBack() {
  const raw = sessionStorage.getItem('bf:listPos')
  const listPos = raw == null ? null : Number(raw)
  const cur = window.history.state?.position
  if (listPos != null && Number.isInteger(listPos) && typeof cur === 'number' && cur > listPos) {
    router.go(listPos - cur)
  } else {
    router.push({ name: 'list' })
  }
}
</script>

<template>
  <div class="favorites">
    <a href="#" class="back" @click.prevent="goBack">← Back to search</a>
    <div class="head">
      <div>
        <h1>{{ isShared ? 'Shared plant list' : 'Favorites' }}</h1>
        <p class="muted">
          {{ plants.length }} {{ isShared ? 'plant' : 'saved plant' }}{{ plants.length === 1 ? '' : 's' }}
        </p>
      </div>
      <div v-if="plants.length" class="head-actions">
        <template v-if="isShared">
          <button type="button" class="action-btn primary" @click="importShared">★ Add all to my favorites</button>
          <button type="button" class="action-btn" @click="printList">🖨 Print list</button>
        </template>
        <template v-else>
          <button type="button" class="action-btn" @click="copyShare">{{ copied ? '✓ Link copied' : '🔗 Share' }}</button>
          <button type="button" class="action-btn" @click="printList">🖨 Print list</button>
          <button type="button" class="action-btn" @click="confirmClear">Clear all</button>
        </template>
      </div>
    </div>

    <p v-if="isShared && plants.length" class="shared-note">
      You're viewing a list someone shared. Adding it won't remove any of your own favorites.
    </p>

    <section v-if="plants.length" class="coverage" aria-label="Bloom coverage summary">
      <div class="coverage-summary">
        <div class="stat">
          <div class="stat-num">{{ coverage.covered }}<span class="stat-denom">/12</span></div>
          <div class="stat-label">months in bloom</div>
        </div>
        <div class="coverage-strip" role="img" :aria-label="`Bloom coverage by month`">
          <div
            v-for="m in coverage.months"
            :key="m.month"
            class="cov-cell"
            :class="{ active: m.count > 0 }"
            :style="m.count > 0 ? { opacity: 0.35 + Math.min(0.65, m.count * 0.15) } : null"
            :title="`${m.label}: ${m.count} plant${m.count === 1 ? '' : 's'} in bloom`"
          >
            <span>{{ m.label[0] }}</span>
          </div>
        </div>
        <div class="gaps">
          <template v-if="coverage.gaps.length === 0">
            <strong>Year-round bloom!</strong> Your favorites cover every month.
          </template>
          <template v-else>
            <strong>Gaps:</strong> {{ coverage.gaps.join(', ') }}
          </template>
        </div>
      </div>
    </section>

    <section v-if="suggestions.length && !isShared" class="suggest" aria-label="Plants to fill bloom gaps">
      <div class="suggest-head">
        <h2>Fill your gaps</h2>
        <p class="muted">Natives that bloom in your empty months and like the same conditions as your saved plants.</p>
      </div>
      <ul class="suggest-list">
        <li v-for="s in suggestions" :key="s.plant.id" class="suggest-card">
          <RouterLink
            :to="{ name: 'detail', params: { id: s.plant.id } }"
            class="suggest-link"
          >
            <span class="suggest-name">{{ s.plant.commonNames[0] }}</span>
            <span class="suggest-sci">{{ s.plant.scientificName }}</span>
            <span class="suggest-fills">
              Covers
              <span v-for="mo in s.fills" :key="mo" class="fill-chip">{{ mo }}</span>
            </span>
          </RouterLink>
          <FavoriteButton :plant-id="s.plant.id" size="sm" />
        </li>
      </ul>
    </section>

    <div v-if="plants.length" class="view-row">
      <div class="view-toggle" role="tablist">
        <button
          type="button"
          :class="{ active: viewMode === 'grid' }"
          @click="viewMode = 'grid'"
        >Grid</button>
        <button
          type="button"
          :class="{ active: viewMode === 'calendar' }"
          @click="viewMode = 'calendar'"
        >Calendar</button>
        <button
          type="button"
          :class="{ active: viewMode === 'beds' }"
          @click="viewMode = 'beds'"
        >Beds</button>
      </div>
    </div>

    <template v-if="plants.length">
      <div v-if="viewMode === 'grid'" class="grid">
        <PlantCard v-for="p in plants" :key="p.id" :plant="p" />
      </div>
      <BloomCalendar v-else-if="viewMode === 'calendar'" :plants="plants" />
      <div v-else class="beds">
        <div v-for="bed in beds" :key="bed.light + bed.moist" class="bed">
          <div class="bed-head">
            <span class="bed-title">{{ lightLabel(bed.light) }} · {{ moistLabel(bed.moist) }} soil</span>
            <span class="bed-count">{{ bed.plants.length }}</span>
          </div>
          <ul class="bed-plants">
            <li v-for="p in bed.plants" :key="p.id">
              <RouterLink :to="{ name: 'detail', params: { id: p.id } }">
                <span class="bp-name">{{ p.commonNames[0] }}</span>
                <span class="bp-sci">{{ p.scientificName }}</span>
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>
    </template>
    <div v-else class="empty">
      <template v-if="isShared">
        <p>This shared list is empty or its links are no longer valid.</p>
        <p><RouterLink to="/">Browse plants →</RouterLink></p>
      </template>
      <template v-else>
        <p>You haven't saved any favorites yet.</p>
        <p>
          Tap the ☆ on a plant to save it.
          <RouterLink to="/">Browse plants →</RouterLink>
        </p>
      </template>
    </div>

    <section v-if="plants.length" class="print-sheet">
      <div class="ps-head">
        <h2>Native Plant List<span v-if="locationName"> — {{ locationName }}</span></h2>
        <p>{{ plants.length }} plant{{ plants.length === 1 ? '' : 's' }} · {{ printDate }} · bedfellow.org</p>
      </div>
      <table class="ps-table">
        <thead>
          <tr>
            <th class="ps-check">✓</th>
            <th>Plant</th>
            <th>Type</th>
            <th>Mature size</th>
            <th>Light</th>
            <th>Soil moisture</th>
            <th>Bloom</th>
            <th class="ps-qty">Qty</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in printPlants" :key="p.id">
            <td class="ps-check">☐</td>
            <td>
              <span class="ps-name">{{ p.commonNames[0] }}</span><br />
              <span class="ps-sci">{{ p.scientificName }}</span>
            </td>
            <td class="cap">{{ p.generalAppearance || '—' }}</td>
            <td>{{ fmtHeight(p) }}</td>
            <td class="cap">{{ fmtList(p.lightRequirement) }}</td>
            <td class="cap">{{ fmtList(p.soilMoisture) }}</td>
            <td>{{ fmtMonths(p) }}</td>
            <td class="ps-qty"></td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.favorites { max-width: 1280px; margin: 0 auto; }
.back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-soft);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 7px 14px;
  text-decoration: none;
  margin-bottom: 14px;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}
.back:hover {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
  text-decoration: none;
}
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}
h1 { margin: 0 0 4px; font-size: 24px; }
.muted { color: var(--ink-soft); font-size: 14px; margin: 0; }
.head-actions { display: flex; gap: 8px; flex-shrink: 0; }
.action-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 12px;
  color: var(--ink-soft);
  font-size: 13px;
  cursor: pointer;
}
.action-btn:hover { color: var(--accent); border-color: var(--accent); }
.action-btn.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  font-weight: 600;
}
.action-btn.primary:hover { color: #fff; filter: brightness(1.08); }
.shared-note {
  background: var(--accent-soft);
  border-left: 3px solid var(--accent);
  color: var(--ink-soft);
  font-size: 13px;
  padding: 8px 12px;
  border-radius: 4px;
  margin: 0 0 16px;
}

.coverage {
  background: var(--card);
  border-radius: 10px;
  padding: 14px 18px;
  margin-bottom: 16px;
}
.coverage-summary {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-areas:
    "stat strip"
    "stat gaps";
  gap: 6px 20px;
  align-items: center;
}
.stat { grid-area: stat; text-align: center; padding-right: 8px; }
.stat-num { font-size: 28px; font-weight: 700; color: var(--accent); line-height: 1; }
.stat-denom { font-size: 16px; font-weight: 500; color: var(--ink-soft); }
.stat-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-soft);
  margin-top: 4px;
}
.coverage-strip {
  grid-area: strip;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 3px;
}
.cov-cell {
  background: rgba(0, 0, 0, 0.05);
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: var(--ink-soft);
  text-transform: uppercase;
}
.cov-cell.active {
  background: var(--accent);
  color: #fff;
}
.gaps { grid-area: gaps; font-size: 13px; color: var(--ink-soft); }
.gaps strong { color: var(--ink); font-weight: 600; }

.suggest {
  background: var(--card);
  border-radius: 10px;
  padding: 14px 18px;
  margin-bottom: 16px;
}
.suggest-head { margin-bottom: 12px; }
.suggest-head h2 { margin: 0 0 2px; font-size: 16px; }
.suggest-head .muted { font-size: 13px; }
.suggest-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
}
.suggest-card {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 8px 8px 12px;
}
.suggest-link {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
  text-decoration: none;
  color: inherit;
}
.suggest-link:hover .suggest-name { color: var(--accent); }
.suggest-name { font-weight: 600; font-size: 14px; }
.suggest-sci {
  font-style: italic;
  color: var(--ink-soft);
  font-size: 11px;
}
.suggest-fills {
  font-size: 11px;
  color: var(--ink-soft);
  margin-top: 3px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}
.fill-chip {
  background: var(--accent-soft);
  color: var(--accent);
  border-radius: 4px;
  padding: 1px 6px;
  font-weight: 600;
}
.view-row { margin-bottom: 12px; }
.view-toggle {
  display: inline-flex;
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
}
.view-toggle button {
  background: var(--card);
  color: var(--ink-soft);
  border: none;
  padding: 5px 12px;
  font-size: 13px;
  cursor: pointer;
}
.view-toggle button.active { background: var(--accent); color: #fff; }

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.beds {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
  align-items: start;
}
.bed {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}
.bed-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px;
  background: var(--accent-soft);
  border-bottom: 1px solid var(--border);
}
.bed-title { font-weight: 700; font-size: 13px; color: var(--accent); }
.bed-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
  background: var(--card);
  border-radius: 999px;
  min-width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
}
.bed-plants { list-style: none; margin: 0; padding: 6px 0; }
.bed-plants li { border-top: 1px solid var(--border); }
.bed-plants li:first-child { border-top: none; }
.bed-plants a {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 7px 14px;
  text-decoration: none;
  color: inherit;
}
.bed-plants a:hover { background: var(--accent-soft); }
.bp-name { font-weight: 600; font-size: 13px; }
.bp-sci { font-style: italic; color: var(--ink-soft); font-size: 11px; }
@media (max-width: 800px) {
  .grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
  .coverage-summary {
    grid-template-columns: 1fr;
    grid-template-areas:
      "stat"
      "strip"
      "gaps";
    gap: 10px;
  }
  .stat { text-align: left; padding-right: 0; }
  .stat-num { display: inline; }
  .stat-label { display: inline; margin-left: 8px; }
}
.empty {
  background: var(--card);
  border: 1px dashed var(--border);
  border-radius: 10px;
  padding: 36px 24px;
  text-align: center;
  color: var(--ink-soft);
}
.empty p { margin: 6px 0; }

.print-sheet { display: none; }
@media print {
  .favorites > *:not(.print-sheet) { display: none !important; }
  .print-sheet { display: block; }
  .ps-head h2 { font-size: 18px; margin: 0 0 2px; color: #111; }
  .ps-head p { font-size: 11px; color: #555; margin: 0 0 12px; }
  .ps-table { width: 100%; border-collapse: collapse; font-size: 11px; color: #111; }
  .ps-table th,
  .ps-table td { border: 1px solid #bbb; padding: 5px 7px; text-align: left; vertical-align: top; }
  .ps-table th {
    background: #eee;
    font-size: 9.5px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .ps-name { font-weight: 700; }
  .ps-sci { font-style: italic; color: #555; font-size: 10px; }
  .ps-check { width: 16px; text-align: center; font-size: 13px; }
  .ps-qty { width: 38px; }
  .print-sheet .cap { text-transform: capitalize; }
  .ps-table tr { page-break-inside: avoid; }
}
</style>

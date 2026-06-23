<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import SearchBar from '../components/SearchBar.vue'
import FilterPanel from '../components/FilterPanel.vue'
import PlantCard from '../components/PlantCard.vue'
import BloomCalendar from '../components/BloomCalendar.vue'
import { usePlantFilters, plantsLoaded, MONTH_LABELS } from '../composables/usePlantFilters.js'
import { useLocation } from '../composables/useLocation.js'
import { useFavorites } from '../composables/useFavorites.js'

const { count: favCount } = useFavorites()

const {
  query,
  selected,
  heightMax,
  heightMin,
  deerOnly,
  cutFlowerOnly,
  culinaryOnly,
  springEphemeralOnly,
  keystoneOnly,
  sortBy,
  sortedPlants,
  activeFilterCount,
  setSearch,
  toggleFilter,
  setHeightMax,
  setHeightMin,
  setDeerOnly,
  setCutFlowerOnly,
  setCulinaryOnly,
  setSpringEphemeralOnly,
  setKeystoneOnly,
  setSortBy,
  clearFilter,
  clearAll,
} = usePlantFilters()

// Incremental render: mount cards in chunks and append on scroll, instead of
// mounting the whole (1700+) catalog up front. Only ~a dozen cards are ever
// visible, so this keeps the DOM and component count proportional to what's
// seen. `allPlants` is a module-level singleton (usePlantFilters), so on a back
// navigation the data is already in memory — restoring the prior count below
// reproduces the exact list height synchronously, letting native scroll
// restoration land where the user left off.
const CHUNK = 60
function restoredCount() {
  // Only restore the larger count when returning to the *same* list history
  // entry (back nav / reload), matching the bf:listPos scroll-restore gate.
  const pos = window.history.state?.position
  const storedPos = sessionStorage.getItem('bf:listPos')
  if (storedPos != null && Number(storedPos) === pos) {
    const saved = Number(sessionStorage.getItem('bf:listCount'))
    if (Number.isInteger(saved) && saved > CHUNK) return saved
  }
  return CHUNK
}
const visibleCount = ref(restoredCount())
const visiblePlants = computed(() => sortedPlants.value.slice(0, visibleCount.value))
const hasMore = computed(() => visibleCount.value < sortedPlants.value.length)

// Persist the count alongside the scroll position so back nav can restore it.
watch(visibleCount, (n) => sessionStorage.setItem('bf:listCount', String(n)))

// A genuine filter/search/sort change resets to the first chunk (fresh result
// set, start at the top). Keyed off the user-controlled inputs only, so the
// async data load (which doesn't touch these) never clobbers a restored count.
const filterKey = computed(() =>
  JSON.stringify([
    query.value, selected.value, heightMax.value, heightMin.value,
    deerOnly.value, cutFlowerOnly.value, culinaryOnly.value,
    springEphemeralOnly.value, keystoneOnly.value, sortBy.value,
  ]),
)
watch(filterKey, () => { visibleCount.value = CHUNK })

const sentinel = ref(null)
let observer = null
function loadMore() {
  if (hasMore.value) {
    visibleCount.value = Math.min(visibleCount.value + CHUNK, sortedPlants.value.length)
  }
}
// Re-observe if the sentinel mounts later (e.g. switching back from calendar).
watch(sentinel, (el) => { if (el) observer?.observe(el) })

const GROUP_TITLES = {
  generalAppearance: 'Type',
  lifespan: 'Lifespan',
  lightRequirement: 'Light',
  soilMoisture: 'Moisture',
  soilType: 'Soil',
  soilPh: 'pH',
  spreadHabit: 'Spread',
  bloomMonths: 'Bloom',
  bloomColors: 'Color',
  leafArrangement: 'Leaves',
  leafRetention: 'Foliage',
  nativeStates: 'State',
  wildlifeValue: 'Wildlife',
  landscapeUses: 'Use',
  family: 'Family',
}

const activeChips = computed(() => {
  const chips = []
  for (const [key, vals] of Object.entries(selected.value)) {
    for (const v of vals) {
      const label = key === 'bloomMonths' ? MONTH_LABELS[v] : String(v)
      chips.push({
        label: `${GROUP_TITLES[key] || key}: ${label}`,
        remove: () => toggleFilter(key, v),
      })
    }
  }
  if (heightMin.value != null) {
    chips.push({ label: `Min height: ${heightMin.value} ft`, remove: () => setHeightMin(null) })
  }
  if (heightMax.value != null) {
    chips.push({ label: `Max height: ${heightMax.value} ft`, remove: () => setHeightMax(null) })
  }
  if (deerOnly.value) chips.push({ label: 'Deer-resistant', remove: () => setDeerOnly(false) })
  if (cutFlowerOnly.value) chips.push({ label: 'Cut flower', remove: () => setCutFlowerOnly(false) })
  if (culinaryOnly.value) chips.push({ label: 'Edible', remove: () => setCulinaryOnly(false) })
  if (springEphemeralOnly.value) chips.push({ label: 'Spring ephemeral', remove: () => setSpringEphemeralOnly(false) })
  if (keystoneOnly.value) chips.push({ label: 'Keystone plants', remove: () => setKeystoneOnly(false) })
  return chips
})

const route = useRoute()
const router = useRouter()
const viewMode = computed(() => (route.query.view === 'calendar' ? 'calendar' : 'grid'))
function setViewMode(v) {
  const q = { ...route.query }
  if (v === 'grid') delete q.view
  else q.view = v
  router.replace({ query: q })
}

// The home-state chip (App.vue) drives the existing nativeStates filter: write
// it into the route query so the filter engine does the work. Applied on mount
// only when the user hasn't already chosen states, and re-applied whenever the
// chip changes so it stays authoritative for state selection.
const { location } = useLocation()
function syncLocationToFilter() {
  const q = { ...route.query }
  if (location.value) q.nativeStates = location.value
  else delete q.nativeStates
  router.replace({ query: q })
}
onMounted(() => {
  // Remember this page's spot in the history stack so the detail-page
  // "Back to search" button can jump straight back here (restoring filters and
  // scroll via the browser), even after hopping between detail pages. Filters
  // use router.replace, so this position stays stable while filtering.
  const pos = window.history.state?.position
  if (typeof pos === 'number') sessionStorage.setItem('bf:listPos', String(pos))
  if (location.value && !route.query.nativeStates) syncLocationToFilter()
  // Load the next chunk before the sentinel reaches the viewport.
  observer = new IntersectionObserver(
    (entries) => { if (entries.some((e) => e.isIntersecting)) loadMore() },
    { rootMargin: '800px 0px' },
  )
  if (sentinel.value) observer.observe(sentinel.value)
})
onUnmounted(() => observer?.disconnect())
watch(location, syncLocationToFilter)

const drawerOpen = ref(false)
watch(drawerOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})
watch(() => route.fullPath, () => { drawerOpen.value = false })
</script>

<template>
  <div class="layout" :class="{ 'drawer-open': drawerOpen }">
    <div class="drawer-backdrop" @click="drawerOpen = false"></div>
    <FilterPanel
      class="sidebar"
      :open="drawerOpen"
      @close="drawerOpen = false"
      :selected="selected"
      :height-max="heightMax"
      :height-min="heightMin"
      :deer-only="deerOnly"
      :cut-flower-only="cutFlowerOnly"
      :culinary-only="culinaryOnly"
      :spring-ephemeral-only="springEphemeralOnly"
      :keystone-only="keystoneOnly"
      @toggle="(k, v) => toggleFilter(k, v)"
      @height-max="setHeightMax"
      @height-min="setHeightMin"
      @deer-only="setDeerOnly"
      @cut-flower-only="setCutFlowerOnly"
      @culinary-only="setCulinaryOnly"
      @spring-ephemeral-only="setSpringEphemeralOnly"
      @keystone-only="setKeystoneOnly"
      @clear-group="clearFilter"
      @clear="clearAll"
    />
    <div class="results">
      <h1 class="sr-only">Native plant search — plan a North American garden that blooms all season</h1>
      <div class="toolbar">
        <div class="toolbar-row">
          <button class="filters-btn" type="button" @click="drawerOpen = true">
            ☰ Filters
            <span v-if="activeFilterCount" class="count">{{ activeFilterCount }}</span>
          </button>
          <SearchBar :model-value="query" @update:model-value="setSearch" />
          <label class="sort">
            Sort
            <select :value="sortBy" @change="setSortBy($event.target.value)">
              <option value="common">Common name (A–Z)</option>
              <option value="scientific">Scientific name (A–Z)</option>
              <option value="heightAsc">Height (shortest first)</option>
              <option value="heightDesc">Height (tallest first)</option>
              <option value="bloomStart">Bloom (earliest first)</option>
            </select>
          </label>
          <div class="view-toggle" role="tablist">
            <button
              type="button"
              :class="{ active: viewMode === 'grid' }"
              @click="setViewMode('grid')"
            >Grid</button>
            <button
              type="button"
              :class="{ active: viewMode === 'calendar' }"
              @click="setViewMode('calendar')"
            >Calendar</button>
          </div>
          <RouterLink :to="{ name: 'favorites' }" class="tb-fav">
            <span class="star" aria-hidden="true">★</span>
            <span class="tb-fav-label">Favorites</span>
            <span v-if="favCount" class="count">{{ favCount }}</span>
          </RouterLink>
        </div>
        <div class="toolbar-meta">
          <span class="result-count">
            {{ sortedPlants.length }} plants<span v-if="activeFilterCount > 0" class="muted"> · {{ activeFilterCount }} filter{{ activeFilterCount === 1 ? '' : 's' }} active</span>
          </span>
          <template v-if="activeChips.length">
            <button
              v-for="(c, i) in activeChips"
              :key="i"
              type="button"
              class="active-chip"
              @click="c.remove()"
              :title="`Remove ${c.label}`"
            >{{ c.label }} <span class="x">✕</span></button>
            <button type="button" class="clear-chip" @click="clearAll">Clear all</button>
          </template>
        </div>
      </div>
      <template v-if="viewMode === 'grid'">
        <template v-if="sortedPlants.length">
          <div class="grid">
            <PlantCard
              v-for="(p, i) in visiblePlants"
              :key="p.id"
              :plant="p"
              :priority="i < 8"
            />
          </div>
          <div v-if="hasMore" ref="sentinel" class="load-sentinel" aria-hidden="true"></div>
        </template>
        <div v-else-if="!plantsLoaded" class="empty">Loading plants…</div>
        <div v-else class="empty">
          No plants match your filters. <button @click="clearAll" type="button">Clear filters</button>
        </div>
      </template>
      <BloomCalendar v-else :plants="sortedPlants" />
    </div>
  </div>
</template>

<style scoped>
/* Visually hidden but present for search engines and screen readers. */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  align-items: start;
  position: relative;
}
.drawer-backdrop { display: none; }
.filters-btn { display: none; }
@media (max-width: 800px) {
  .layout { grid-template-columns: 1fr; }
  .filters-btn {
    display: inline-flex;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 14px;
    color: var(--ink);
    font-weight: 600;
    font-size: 14px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .filters-btn .count {
    background: var(--accent);
    color: #fff;
    font-size: 11px;
    border-radius: 999px;
    padding: 1px 7px;
    font-weight: 700;
  }
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: min(320px, 88vw);
    z-index: 30;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
    max-height: 100vh;
    border-radius: 0;
    box-shadow: 2px 0 18px rgba(0, 0, 0, 0.18);
  }
  .layout.drawer-open .sidebar { transform: translateX(0); }
  .drawer-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    z-index: 20;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }
  .layout.drawer-open .drawer-backdrop {
    opacity: 1;
    pointer-events: auto;
  }
}
.toolbar {
  position: sticky;
  top: 0;
  z-index: 15;
  background: var(--bg);
  padding: 12px 0 10px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--border);
}
.toolbar-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.toolbar :deep(.search-bar) {
  flex: 1 1 240px;
  margin-bottom: 0;
  min-width: 0;
}
.tb-fav {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
  text-decoration: none;
  white-space: nowrap;
}
.tb-fav:hover { border-color: var(--accent); color: var(--accent); text-decoration: none; }
.tb-fav .star { color: #e0a512; font-size: 13px; }
.tb-fav .count {
  background: var(--accent);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  border-radius: 999px;
  padding: 1px 7px;
}
.toolbar-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 9px;
  font-size: 13px;
  color: var(--ink-soft);
}
.result-count { white-space: nowrap; margin-right: 4px; }
.muted { color: var(--ink-soft); }
.sort { display: flex; align-items: center; gap: 6px; font-size: 13px; }
.sort select {
  font: inherit;
  padding: 4px 6px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--card);
  color: var(--ink);
}
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
  padding: 5px 10px;
  font-size: 13px;
}
.view-toggle button.active {
  background: var(--accent);
  color: #fff;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
/* Windowing: let the browser skip layout/paint for off-screen cards. The full
   list height is preserved (via the intrinsic-size estimate), so scrollbar and
   the scroll-restoring back button keep working. Cuts the dominant render cost
   of mounting the whole catalog at once. */
.grid :deep(.card) {
  content-visibility: auto;
  contain-intrinsic-size: auto 320px;
}
@media (max-width: 800px) {
  .grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
  .tb-fav-label { display: none; }
}
.load-sentinel {
  height: 1px;
  width: 100%;
}
.empty {
  background: var(--card);
  border: 1px dashed var(--border);
  border-radius: 10px;
  padding: 24px;
  text-align: center;
  color: var(--ink-soft);
}
.empty button {
  background: none;
  border: none;
  color: var(--accent);
  margin-left: 6px;
  text-decoration: underline;
}
.active-chip {
  background: var(--accent-soft);
  color: var(--accent);
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 12px;
  padding: 3px 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.active-chip:hover { background: var(--card); }
.active-chip .x { font-size: 10px; opacity: 0.7; }
.clear-chip {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 12px;
  cursor: pointer;
  padding: 3px 6px;
}
.clear-chip:hover { text-decoration: underline; }
</style>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SearchBar from '../components/SearchBar.vue'
import FilterPanel from '../components/FilterPanel.vue'
import PlantCard from '../components/PlantCard.vue'
import BloomCalendar from '../components/BloomCalendar.vue'
import { usePlantFilters, MONTH_LABELS } from '../composables/usePlantFilters.js'
import { useLocation } from '../composables/useLocation.js'

const {
  query,
  selected,
  heightMax,
  heightMin,
  deerOnly,
  cutFlowerOnly,
  culinaryOnly,
  springEphemeralOnly,
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
  setSortBy,
  clearFilter,
  clearAll,
} = usePlantFilters()

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
  if (location.value && !route.query.nativeStates) syncLocationToFilter()
})
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
      @toggle="(k, v) => toggleFilter(k, v)"
      @height-max="setHeightMax"
      @height-min="setHeightMin"
      @deer-only="setDeerOnly"
      @cut-flower-only="setCutFlowerOnly"
      @culinary-only="setCulinaryOnly"
      @spring-ephemeral-only="setSpringEphemeralOnly"
      @clear-group="clearFilter"
      @clear="clearAll"
    />
    <div class="results">
      <div class="mobile-bar">
        <button class="filters-btn" type="button" @click="drawerOpen = true">
          ☰ Filters
          <span v-if="activeFilterCount" class="count">{{ activeFilterCount }}</span>
        </button>
      </div>
      <SearchBar :model-value="query" @update:model-value="setSearch" />
      <div v-if="activeChips.length" class="active-chips">
        <button
          v-for="(c, i) in activeChips"
          :key="i"
          type="button"
          class="active-chip"
          @click="c.remove()"
          :title="`Remove ${c.label}`"
        >{{ c.label }} <span class="x">✕</span></button>
        <button type="button" class="clear-chip" @click="clearAll">Clear all</button>
      </div>
      <div class="result-bar">
        <span>{{ sortedPlants.length }} plants</span>
        <span v-if="activeFilterCount > 0" class="muted">
          · {{ activeFilterCount }} filter{{ activeFilterCount === 1 ? '' : 's' }} active
        </span>
        <span class="spacer"></span>
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
      </div>
      <template v-if="viewMode === 'grid'">
        <div v-if="sortedPlants.length" class="grid">
          <PlantCard v-for="p in sortedPlants" :key="p.id" :plant="p" />
        </div>
        <div v-else class="empty">
          No plants match your filters. <button @click="clearAll" type="button">Clear filters</button>
        </div>
      </template>
      <BloomCalendar v-else :plants="sortedPlants" />
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  align-items: start;
  position: relative;
}
.drawer-backdrop { display: none; }
.mobile-bar { display: none; }
@media (max-width: 800px) {
  .layout { grid-template-columns: 1fr; }
  .mobile-bar { display: flex; margin-bottom: 10px; }
  .filters-btn {
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
.result-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  color: var(--ink-soft);
  font-size: 14px;
  flex-wrap: wrap;
}
.muted { color: var(--ink-soft); }
.spacer { flex: 1; }
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
@media (max-width: 800px) {
  .grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
  .spacer { flex-basis: 100%; height: 0; }
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
.active-chips {
  position: sticky;
  top: 0;
  z-index: 5;
  background: var(--bg, var(--card));
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 0;
  margin-bottom: 4px;
  border-bottom: 1px solid var(--border);
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

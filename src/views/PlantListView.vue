<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SearchBar from '../components/SearchBar.vue'
import FilterPanel from '../components/FilterPanel.vue'
import PlantCard from '../components/PlantCard.vue'
import BloomCalendar from '../components/BloomCalendar.vue'
import { usePlantFilters } from '../composables/usePlantFilters.js'

const {
  query,
  selected,
  heightMax,
  heightMin,
  deerOnly,
  cutFlowerOnly,
  culinaryOnly,
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
  setSortBy,
  clearAll,
} = usePlantFilters()

const route = useRoute()
const router = useRouter()
const viewMode = computed(() => (route.query.view === 'calendar' ? 'calendar' : 'grid'))
function setViewMode(v) {
  const q = { ...route.query }
  if (v === 'grid') delete q.view
  else q.view = v
  router.replace({ query: q })
}

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
      @toggle="(k, v) => toggleFilter(k, v)"
      @height-max="setHeightMax"
      @height-min="setHeightMin"
      @deer-only="setDeerOnly"
      @cut-flower-only="setCutFlowerOnly"
      @culinary-only="setCulinaryOnly"
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
</style>

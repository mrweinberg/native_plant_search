<script setup>
import SearchBar from '../components/SearchBar.vue'
import FilterPanel from '../components/FilterPanel.vue'
import PlantCard from '../components/PlantCard.vue'
import { usePlantFilters } from '../composables/usePlantFilters.js'

const {
  query,
  selected,
  heightMax,
  heightMin,
  deerOnly,
  filteredPlants,
  activeFilterCount,
  setSearch,
  toggleFilter,
  setHeightMax,
  setHeightMin,
  setDeerOnly,
  clearAll,
} = usePlantFilters()
</script>

<template>
  <div class="layout">
    <FilterPanel
      class="sidebar"
      :selected="selected"
      :height-max="heightMax"
      :height-min="heightMin"
      :deer-only="deerOnly"
      @toggle="(k, v) => toggleFilter(k, v)"
      @height-max="setHeightMax"
      @height-min="setHeightMin"
      @deer-only="setDeerOnly"
      @clear="clearAll"
    />
    <div class="results">
      <SearchBar :model-value="query" @update:model-value="setSearch" />
      <div class="result-bar">
        <span>{{ filteredPlants.length }} plants</span>
        <span v-if="activeFilterCount > 0" class="muted">
          · {{ activeFilterCount }} filter{{ activeFilterCount === 1 ? '' : 's' }} active
        </span>
      </div>
      <div v-if="filteredPlants.length" class="grid">
        <PlantCard v-for="p in filteredPlants" :key="p.id" :plant="p" />
      </div>
      <div v-else class="empty">
        No plants match your filters. <button @click="clearAll" type="button">Clear filters</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  align-items: start;
}
@media (max-width: 800px) {
  .layout { grid-template-columns: 1fr; }
}
.result-bar {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  color: var(--ink-soft);
  font-size: 14px;
}
.muted { color: var(--ink-soft); }
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
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

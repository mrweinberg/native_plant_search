<script setup>
import { computed } from 'vue'
import FilterChip from './FilterChip.vue'
import { getFilterOptions, MONTH_LABELS } from '../composables/usePlantFilters.js'

const props = defineProps({
  selected: { type: Object, required: true },
  heightMax: { type: Number, default: null },
  heightMin: { type: Number, default: null },
  deerOnly: { type: Boolean, default: false },
})
const emit = defineEmits(['toggle', 'heightMax', 'heightMin', 'deerOnly', 'clear'])

const options = computed(() => getFilterOptions())

const groups = [
  { key: 'generalAppearance', title: 'Plant type' },
  { key: 'lifespan', title: 'Lifespan' },
  { key: 'lightRequirement', title: 'Light' },
  { key: 'soilMoisture', title: 'Soil moisture' },
  { key: 'soilType', title: 'Soil type' },
  { key: 'bloomMonths', title: 'Bloom month', isMonth: true },
  { key: 'bloomColors', title: 'Bloom color' },
  { key: 'leafArrangement', title: 'Leaf arrangement' },
  { key: 'leafRetention', title: 'Leaf retention' },
  { key: 'nativeStates', title: 'Native to state' },
  { key: 'wildlifeValue', title: 'Wildlife value' },
  { key: 'family', title: 'Plant family' },
]

function labelFor(group, val) {
  if (group.isMonth) return MONTH_LABELS[val] || String(val)
  return String(val)
}
</script>

<template>
  <aside class="filter-panel">
    <div class="filter-head">
      <h2>Filters</h2>
      <button class="clear" @click="emit('clear')" type="button">Clear all</button>
    </div>

    <section class="filter-group">
      <h3>Height range (ft)</h3>
      <label class="range-label">Min height
        <span class="range-value">{{ heightMin == null ? 'Any' : `≥ ${heightMin} ft` }}</span>
      </label>
      <input
        type="range"
        :min="0"
        :max="options.maxHeight"
        :value="heightMin ?? 0"
        @input="emit('heightMin', Number($event.target.value) === 0 ? null : Number($event.target.value))"
      />
      <label class="range-label">Max height
        <span class="range-value">{{ heightMax == null ? 'Any' : `≤ ${heightMax} ft` }}</span>
      </label>
      <input
        type="range"
        :min="1"
        :max="options.maxHeight"
        :value="heightMax ?? options.maxHeight"
        @input="emit('heightMax', Number($event.target.value) === options.maxHeight ? null : Number($event.target.value))"
      />
    </section>

    <section class="filter-group">
      <label class="toggle">
        <input
          type="checkbox"
          :checked="deerOnly"
          @change="emit('deerOnly', $event.target.checked)"
        />
        Deer-resistant only
      </label>
    </section>

    <section v-for="g in groups" :key="g.key" class="filter-group">
      <h3>{{ g.title }}</h3>
      <div class="chips">
        <FilterChip
          v-for="val in options[g.key]"
          :key="val"
          :label="labelFor(g, val)"
          :active="(selected[g.key] || []).includes(val)"
          @toggle="emit('toggle', g.key, val)"
        />
      </div>
    </section>
  </aside>
</template>

<style scoped>
.filter-panel {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px 16px;
  position: sticky;
  top: 16px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}
.filter-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}
h2 { font-size: 16px; margin: 0; }
h3 {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ink-soft);
  margin: 14px 0 6px;
}
.clear {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 12px;
  padding: 0;
}
.clear:hover { text-decoration: underline; }
.filter-group { border-top: 1px solid var(--border); padding-top: 8px; }
.filter-group:first-of-type { border-top: none; }
.chips { display: flex; flex-wrap: wrap; gap: 2px; }
input[type='range'] { width: 100%; }
.range-label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--ink-soft);
  margin-top: 6px;
}
.range-value { font-weight: 500; }
.toggle { display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; }
</style>

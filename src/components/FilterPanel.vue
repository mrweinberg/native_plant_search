<script setup>
import { computed } from 'vue'
import FilterChip from './FilterChip.vue'
import MultiSelectDropdown from './MultiSelectDropdown.vue'
import { getFilterOptions, MONTH_LABELS } from '../composables/usePlantFilters.js'

const DROPDOWN_THRESHOLD = 8

const props = defineProps({
  selected: { type: Object, required: true },
  heightMax: { type: Number, default: null },
  heightMin: { type: Number, default: null },
  deerOnly: { type: Boolean, default: false },
  cutFlowerOnly: { type: Boolean, default: false },
  culinaryOnly: { type: Boolean, default: false },
  springEphemeralOnly: { type: Boolean, default: false },
  keystoneOnly: { type: Boolean, default: false },
  open: { type: Boolean, default: false },
})
const emit = defineEmits([
  'toggle', 'heightMax', 'heightMin', 'deerOnly', 'cutFlowerOnly', 'culinaryOnly',
  'springEphemeralOnly', 'keystoneOnly', 'clear', 'clearGroup', 'close',
])

const options = computed(() => getFilterOptions())

const groups = [
  { key: 'generalAppearance', title: 'Plant type' },
  { key: 'lifespan', title: 'Lifespan' },
  { key: 'lightRequirement', title: 'Light' },
  { key: 'soilMoisture', title: 'Soil moisture' },
  { key: 'soilType', title: 'Soil type' },
  { key: 'soilPh', title: 'Soil pH' },
  { key: 'spreadHabit', title: 'Spread habit' },
  { key: 'bloomMonths', title: 'Bloom month', isMonth: true },
  { key: 'bloomColors', title: 'Bloom color' },
  { key: 'leafArrangement', title: 'Leaf arrangement' },
  { key: 'leafRetention', title: 'Leaf retention' },
  { key: 'nativeStates', title: 'Native to state' },
  { key: 'wildlifeValue', title: 'Wildlife value' },
  { key: 'landscapeUses', title: 'Landscape use' },
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
      <button class="close" @click="emit('close')" type="button" aria-label="Close filters">✕</button>
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
      <label class="toggle">
        <input
          type="checkbox"
          :checked="cutFlowerOnly"
          @change="emit('cutFlowerOnly', $event.target.checked)"
        />
        Good for cut flowers
      </label>
      <label class="toggle">
        <input
          type="checkbox"
          :checked="culinaryOnly"
          @change="emit('culinaryOnly', $event.target.checked)"
        />
        Edible / culinary use
      </label>
      <label class="toggle">
        <input
          type="checkbox"
          :checked="springEphemeralOnly"
          @change="emit('springEphemeralOnly', $event.target.checked)"
        />
        Spring ephemerals only
      </label>
      <label class="toggle" title="Genera that host an outsized number of native caterpillar species (Tallamy / NWF)">
        <input
          type="checkbox"
          :checked="keystoneOnly"
          @change="emit('keystoneOnly', $event.target.checked)"
        />
        🐛 Keystone plants only
      </label>
    </section>

    <section v-for="g in groups" :key="g.key" class="filter-group">
      <h3>{{ g.title }}</h3>
      <MultiSelectDropdown
        v-if="options[g.key].length > DROPDOWN_THRESHOLD"
        :title="g.title"
        :options="options[g.key]"
        :selected="selected[g.key] || []"
        :label-for="(v) => labelFor(g, v)"
        @toggle="(v) => emit('toggle', g.key, v)"
        @clear="emit('clearGroup', g.key)"
      />
      <div v-else class="chips">
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
  border-radius: 10px;
  padding: 14px 16px;
  position: sticky;
  top: 16px;
  max-height: calc(100vh - 20px);
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
.close {
  display: none;
  background: none;
  border: none;
  font-size: 18px;
  color: var(--ink-soft);
  padding: 0 4px;
  margin-left: 8px;
  cursor: pointer;
}
@media (max-width: 800px) {
  .filter-panel {
    max-height: none;
    height: 100%;
    border-radius: 0;
    padding-bottom: 32px;
  }
  .close { display: inline-block; }
}
.filter-group { padding-top: 8px; }
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

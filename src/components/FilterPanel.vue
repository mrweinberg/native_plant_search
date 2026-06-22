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

// Height sliders use a logarithmic scale so the 1–6 ft band — where most
// plants live — gets the bulk of the track, instead of being a sliver next to
// the few 100–200 ft trees. The stored filter value stays in real feet (the
// number inputs and URL are unchanged); only the slider's position is mapped.
const STEPS = 100
const FMIN = 0.5 // shortest meaningful height; slider floor
const lnFloor = Math.log(FMIN)
const lnMax = computed(() => Math.log(options.value.maxHeight))

function niceRound(f) {
  if (f < 10) return Math.round(f * 2) / 2 // 0.5 ft steps when small
  if (f < 50) return Math.round(f)
  return Math.round(f / 5) * 5
}
function posToFeet(pos) {
  return niceRound(Math.exp(lnFloor + (pos / STEPS) * (lnMax.value - lnFloor)))
}
function feetToPos(feet) {
  const f = Math.max(FMIN, Math.min(options.value.maxHeight, feet))
  return Math.round((STEPS * (Math.log(f) - lnFloor)) / (lnMax.value - lnFloor))
}
const minPos = computed(() => (props.heightMin == null ? 0 : feetToPos(props.heightMin)))
const maxPos = computed(() => (props.heightMax == null ? STEPS : feetToPos(props.heightMax)))

function clampFeet(v) {
  if (v === '' || v == null || Number.isNaN(Number(v))) return null
  const n = Math.max(0, Math.min(options.value.maxHeight, Number(v)))
  return n > 0 ? n : null
}
function onMinSlider(e) {
  const pos = Number(e.target.value)
  emit('heightMin', pos <= 0 ? null : posToFeet(pos))
}
function onMaxSlider(e) {
  const pos = Number(e.target.value)
  emit('heightMax', pos >= STEPS ? null : posToFeet(pos))
}

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
      <div class="height-row">
        <label class="height-field" for="height-min-num">Min</label>
        <input
          id="height-min-num"
          class="height-num"
          type="number"
          inputmode="decimal"
          min="0"
          step="0.5"
          :max="options.maxHeight"
          :value="heightMin ?? ''"
          placeholder="Any"
          @change="emit('heightMin', clampFeet($event.target.value))"
        />
        <input
          class="height-slider"
          type="range"
          :min="0"
          :max="STEPS"
          :value="minPos"
          aria-label="Minimum height"
          @input="onMinSlider"
        />
      </div>
      <div class="height-row">
        <label class="height-field" for="height-max-num">Max</label>
        <input
          id="height-max-num"
          class="height-num"
          type="number"
          inputmode="decimal"
          min="0"
          step="0.5"
          :max="options.maxHeight"
          :value="heightMax ?? ''"
          placeholder="Any"
          @change="emit('heightMax', clampFeet($event.target.value))"
        />
        <input
          class="height-slider"
          type="range"
          :min="0"
          :max="STEPS"
          :value="maxPos"
          aria-label="Maximum height"
          @input="onMaxSlider"
        />
      </div>
    </section>

    <section class="filter-group">
      <label class="toggle" title="Plants deer tend to leave alone — a guide, not a guarantee, since hungry deer sample almost anything.">
        <input
          type="checkbox"
          :checked="deerOnly"
          @change="emit('deerOnly', $event.target.checked)"
        />
        🦌 Deer-resistant only
      </label>
      <label class="toggle" title="Flowers that hold up well when cut for indoor arrangements.">
        <input
          type="checkbox"
          :checked="cutFlowerOnly"
          @change="emit('cutFlowerOnly', $event.target.checked)"
        />
        ✂️ Good for cut flowers
      </label>
      <label class="toggle" title="Has parts traditionally used as food — always confirm safe identification and preparation.">
        <input
          type="checkbox"
          :checked="culinaryOnly"
          @change="emit('culinaryOnly', $event.target.checked)"
        />
        🍴 Edible / culinary use
      </label>
      <label class="toggle" title="Woodland wildflowers that bloom early in spring, then die back by summer.">
        <input
          type="checkbox"
          :checked="springEphemeralOnly"
          @change="emit('springEphemeralOnly', $event.target.checked)"
        />
        🌱 Spring ephemerals only
      </label>
      <label class="toggle" title="Genera that host an outsized number of native caterpillar species — top wildlife value (Tallamy / NWF).">
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
.height-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
.height-field {
  font-size: 12px;
  color: var(--ink-soft);
  width: 28px;
  flex: none;
}
.height-num {
  width: 60px;
  flex: none;
  padding: 3px 6px;
  font-size: 13px;
  border: 1px solid var(--line, #ccc);
  border-radius: 6px;
  background: var(--surface, #fff);
  color: inherit;
}
.height-slider { flex: 1; min-width: 0; }
.toggle { display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; }
</style>

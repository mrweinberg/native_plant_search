<script setup>
import { computed, ref, onMounted } from 'vue'
import { stateName, useLocation } from '../composables/useLocation.js'
import CountyMap from './CountyMap.vue'

const props = defineProps({ plant: { type: Object, required: true } })

// When the visitor has a home state and this plant is native there, show a
// county-level map of that state beneath the national one ("where in my state").
const { location: homeState } = useLocation()
const showCounty = computed(
  () => homeState.value && (props.plant.nativeStates || []).includes(homeState.value),
)

// The path data is ~140KB, so load it lazily on mount (its own chunk) — routed
// views aren't code-split, so a static import would bloat the main bundle.
const viewBox = ref('192 9 1028 746')
const paths = ref(null)
onMounted(async () => {
  const m = await import('../data/usStatePaths.js')
  viewBox.value = m.default.viewBox
  paths.value = m.default.paths
})

const nativeSet = computed(() => new Set(props.plant.nativeStates || []))
const stateList = computed(() =>
  paths.value ? Object.entries(paths.value).map(([code, d]) => ({ code, d })) : [],
)

// Non-state native regions worth noting under the map (state codes are drawn).
const REGION_LABEL = {
  CAN: 'Canada', AK: 'Alaska', PR: 'Puerto Rico',
  GL: 'Greenland', SPM: 'St. Pierre & Miquelon', HI: 'Hawaii',
}
const extraRegions = computed(() => {
  const states = nativeSet.value
  return (props.plant.nativeRegions || [])
    .filter((r) => REGION_LABEL[r] && r !== 'L48')
    // AK / HI are drawn on the map, so only mention them if not already shaded.
    .filter((r) => !((r === 'AK' || r === 'HI') && states.has(r)))
    .map((r) => REGION_LABEL[r])
})
const count = computed(() => nativeSet.value.size)
</script>

<template>
  <div class="range-map">
    <svg
      v-if="stateList.length"
      :viewBox="viewBox"
      class="map"
      role="img"
      :aria-label="`US map with ${count} native state${count === 1 ? '' : 's'} highlighted`"
    >
      <path
        v-for="s in stateList"
        :key="s.code"
        :d="s.d"
        class="state"
        :class="{ native: nativeSet.has(s.code) }"
      >
        <title>{{ stateName(s.code) || s.code }}{{ nativeSet.has(s.code) ? ' — native' : '' }}</title>
      </path>
    </svg>
    <div v-else class="map-skeleton" aria-hidden="true"></div>

    <div class="legend">
      <span class="key"><span class="sw native"></span> Native ({{ count }} state{{ count === 1 ? '' : 's' }})</span>
      <span class="key"><span class="sw"></span> Not recorded</span>
    </div>
    <p v-if="extraRegions.length" class="extra">Also native in {{ extraRegions.join(', ') }}.</p>

    <CountyMap v-if="showCounty" :plant-id="plant.id" :state="homeState" />
  </div>
</template>

<style scoped>
.range-map { margin-bottom: 6px; }
.map { width: 100%; height: auto; display: block; }
.map-skeleton {
  width: 100%;
  aspect-ratio: 1028 / 746;
  border-radius: 8px;
  background: var(--accent-soft);
  animation: skeleton-pulse 1.4s ease-in-out infinite;
}
@keyframes skeleton-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@media (prefers-reduced-motion: reduce) { .map-skeleton { animation: none; opacity: 0.7; } }
.state {
  fill: #e7e7e2;
  stroke: var(--card);
  stroke-width: 1;
  transition: fill 0.1s;
}
.state.native { fill: var(--accent); }
.state:hover { fill: #d3d3cc; }
.state.native:hover { fill: var(--accent); filter: brightness(1.08); }
.legend { display: flex; gap: 16px; margin-top: 6px; font-size: 12px; color: var(--ink-soft); }
.key { display: inline-flex; align-items: center; gap: 6px; }
.sw { width: 12px; height: 12px; border-radius: 3px; background: #e7e7e2; display: inline-block; }
.sw.native { background: var(--accent); }
.extra { font-size: 13px; color: var(--ink-soft); margin: 8px 0 0; }
</style>

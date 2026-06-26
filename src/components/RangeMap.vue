<script setup>
import { computed, ref, onMounted } from 'vue'
import { useCountyIndex, USPS_FIP } from '../composables/useCountyIndex.js'

const props = defineProps({ plant: { type: Object, required: true } })

const { usCountyGeometry, plantCountiesNationwide } = useCountyIndex()

// National county geometry (~270KB gz) loads lazily in its own chunk, cached
// across detail pages. `shaded` is the set of 5-digit county FIPS this plant is
// native to, unioned across its native states.
const geo = ref(null)
const shaded = ref(new Set())
onMounted(async () => {
  const [g, s] = await Promise.all([usCountyGeometry(), plantCountiesNationwide(props.plant)])
  geo.value = g
  shaded.value = s
})

// States that have at least one shaded county (so the rest of their native
// states can fall back to whole-state fill — e.g. Connecticut, which has no
// USDA county data).
const statesWithData = computed(() => {
  const set = new Set()
  for (const f of shaded.value) set.add(f.slice(0, 2))
  return set
})
const fallbackD = computed(() => {
  if (!geo.value) return ''
  return (props.plant.nativeStates || [])
    .map((s) => USPS_FIP[s])
    .filter((fp) => fp && !statesWithData.value.has(fp) && geo.value.states[fp])
    .map((fp) => geo.value.states[fp])
    .join('')
})
const shadedD = computed(() => {
  if (!geo.value) return ''
  let d = ''
  for (const f of shaded.value) {
    const p = geo.value.counties[f]
    if (p) d += p
  }
  return d
})
// One merged accent path: shaded counties + whole-state fallbacks.
const nativeFillD = computed(() => fallbackD.value + shadedD.value)

const stateCount = computed(() => (props.plant.nativeStates || []).length)

// Non-state native regions worth a footnote (Canada etc.; AK/HI render on the map).
const REGION_LABEL = { CAN: 'Canada', PR: 'Puerto Rico', GL: 'Greenland', SPM: 'St. Pierre & Miquelon' }
const extraRegions = computed(() =>
  (props.plant.nativeRegions || []).filter((r) => REGION_LABEL[r]).map((r) => REGION_LABEL[r]),
)
</script>

<template>
  <div class="range-map">
    <svg
      v-if="geo"
      :viewBox="geo.viewBox"
      class="map"
      role="img"
      :aria-label="`US county map; native across ${stateCount} state${stateCount === 1 ? '' : 's'}`"
    >
      <path :d="geo.nation" class="base" />
      <path :d="nativeFillD" class="native-fill" />
      <path :d="geo.countyBorders" class="county-line" />
      <path :d="geo.stateBorders" class="state-line" />
      <path :d="geo.nation" class="nation-line" />
    </svg>
    <div v-else class="map-skeleton" aria-hidden="true"></div>

    <div class="legend">
      <span class="key"><span class="sw native"></span> Native county</span>
      <span class="key"><span class="sw"></span> Not recorded</span>
    </div>
    <p class="extra">
      Recorded native across {{ stateCount }} state{{ stateCount === 1 ? '' : 's' }}<span
        v-if="extraRegions.length"
      >, and in {{ extraRegions.join(', ') }}</span>.
    </p>
  </div>
</template>

<style scoped>
.range-map { margin-bottom: 6px; }
.map { width: 100%; height: auto; display: block; }
.map-skeleton {
  width: 100%;
  aspect-ratio: 975 / 610;
  border-radius: 8px;
  background: var(--accent-soft);
  animation: skeleton-pulse 1.4s ease-in-out infinite;
}
@keyframes skeleton-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@media (prefers-reduced-motion: reduce) { .map-skeleton { animation: none; opacity: 0.7; } }
.base { fill: #e7e7e2; }
.native-fill { fill: var(--accent); }
.county-line { fill: none; stroke: #fff; stroke-width: 0.5; opacity: 0.5; }
.state-line { fill: none; stroke: #fff; stroke-width: 1.1; }
.nation-line { fill: none; stroke: #9a9a90; stroke-width: 1.1; }
.legend { display: flex; gap: 16px; margin-top: 6px; font-size: 12px; color: var(--ink-soft); }
.key { display: inline-flex; align-items: center; gap: 6px; }
.sw { width: 12px; height: 12px; border-radius: 3px; background: #e7e7e2; display: inline-block; }
.sw.native { background: var(--accent); }
.extra { font-size: 13px; color: var(--ink-soft); margin: 8px 0 0; }
</style>

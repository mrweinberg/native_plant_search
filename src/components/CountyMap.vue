<script setup>
import { ref, computed, watch } from 'vue'
import { useCountyIndex } from '../composables/useCountyIndex.js'
import { stateName } from '../composables/useLocation.js'

// Single-state county map: shades the counties of `state` (USPS code) where the
// plant is natively recorded. Geometry and presence are both loaded lazily and
// only for the one state in view.
const props = defineProps({
  plantId: { type: String, required: true },
  state: { type: String, required: true },
})

const { countyGeometry, plantCountiesInState, countyName } = useCountyIndex()

const geo = ref(null) // { viewBox, paths }
const present = ref(new Set())
const names = ref({})

watch(
  () => [props.plantId, props.state],
  async () => {
    geo.value = null
    const [g, p] = await Promise.all([
      countyGeometry(props.state),
      plantCountiesInState(props.plantId, props.state),
    ])
    geo.value = g
    present.value = p
    // Resolve names only for shaded counties, for the tooltips.
    const entries = await Promise.all(
      [...p].map(async (cf) => [cf, (await countyName(props.state + cf)) || cf]),
    )
    names.value = Object.fromEntries(entries)
  },
  { immediate: true },
)

const counties = computed(() =>
  geo.value ? Object.entries(geo.value.paths).map(([fip, d]) => ({ fip, d })) : [],
)
const count = computed(() => present.value.size)
</script>

<template>
  <div v-if="geo && count" class="county-map">
    <h3 class="cm-title">Counties in {{ stateName(state) }}</h3>
    <svg
      :viewBox="geo.viewBox"
      class="cmap"
      role="img"
      :aria-label="`${stateName(state)} county map with ${count} native count${count === 1 ? 'y' : 'ies'} highlighted`"
    >
      <path
        v-for="c in counties"
        :key="c.fip"
        :d="c.d"
        class="county"
        :class="{ present: present.has(c.fip) }"
      >
        <title v-if="present.has(c.fip)">{{ names[c.fip] }} — native</title>
      </path>
    </svg>
    <p class="cm-note">
      Recorded as native in <strong>{{ count }}</strong> of
      {{ stateName(state) }}’s counties.
    </p>
  </div>
</template>

<style scoped>
.county-map { margin-top: 14px; }
.cm-title {
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 6px;
  color: var(--ink);
}
.cmap { width: 100%; height: auto; display: block; max-height: 320px; }
.county {
  fill: #e7e7e2;
  stroke: var(--card);
  stroke-width: 0.015;
}
.county.present { fill: var(--accent); }
.cm-note { font-size: 13px; color: var(--ink-soft); margin: 6px 0 0; }
</style>

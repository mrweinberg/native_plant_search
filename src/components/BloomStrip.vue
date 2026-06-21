<script setup>
import { computed } from 'vue'
import { MONTH_LABELS, BLOOM_COLOR_HEX } from '../composables/usePlantFilters.js'

const props = defineProps({ plant: { type: Object, required: true } })

const months = Array.from({ length: 12 }, (_, i) => i + 1)
const bloomSet = computed(() => new Set(props.plant.bloomMonths || []))
const fill = computed(() => {
  const c = props.plant.bloomColors?.[0]
  return BLOOM_COLOR_HEX[c] || 'var(--accent)'
})
const swatches = computed(() =>
  (props.plant.bloomColors || []).map((c) => ({ name: c, hex: BLOOM_COLOR_HEX[c] || '#ccc' })),
)
const season = (m) =>
  m >= 3 && m <= 5 ? 'season-spring' : m >= 6 && m <= 8 ? 'season-summer' : m >= 9 && m <= 11 ? 'season-fall' : ''
</script>

<template>
  <div class="bloom-strip">
    <div class="strip" role="img" :aria-label="bloomSet.size
      ? `Blooms in ${(plant.bloomMonths || []).map((m) => MONTH_LABELS[m]).join(', ')}`
      : 'No bloom data'">
      <div v-for="m in months" :key="m" class="month" :class="season(m)">
        <div
          class="bar"
          :class="{ on: bloomSet.has(m) }"
          :style="bloomSet.has(m) ? { background: fill } : null"
          :title="bloomSet.has(m) ? `Blooms in ${MONTH_LABELS[m]}` : ''"
        ></div>
        <div class="m-label">{{ MONTH_LABELS[m].slice(0, 1) }}</div>
      </div>
    </div>
    <div class="swatches" v-if="swatches.length">
      <span v-for="s in swatches" :key="s.name" class="sw" :title="s.name">
        <span class="dot" :style="{ background: s.hex, borderColor: s.name === 'white' ? '#bbb' : 'transparent' }"></span>
        <span class="cap">{{ s.name }}</span>
      </span>
    </div>
    <p v-if="!bloomSet.size" class="none">No bloom-time data recorded.</p>
  </div>
</template>

<style scoped>
.strip {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 3px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px;
  background: var(--card);
}
.month { display: flex; flex-direction: column; align-items: stretch; gap: 4px; border-radius: 4px; padding: 2px; }
.season-spring { background: rgba(126, 163, 107, 0.08); }
.season-summer { background: rgba(233, 200, 74, 0.10); }
.season-fall { background: rgba(224, 139, 58, 0.10); }
.bar {
  height: 22px;
  border-radius: 3px;
  background: transparent;
}
.bar.on { box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1); }
.m-label {
  text-align: center;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--ink-soft);
}
.swatches { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px; }
.sw { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--ink-soft); }
.dot { width: 13px; height: 13px; border-radius: 50%; border: 1px solid transparent; display: inline-block; }
.cap { text-transform: capitalize; }
.none { font-size: 13px; color: var(--ink-soft); font-style: italic; margin: 8px 0 0; }
</style>

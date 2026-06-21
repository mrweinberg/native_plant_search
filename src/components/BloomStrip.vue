<script setup>
import { computed } from 'vue'
import { MONTH_LABELS, BLOOM_COLOR_HEX } from '../composables/usePlantFilters.js'

const props = defineProps({ plant: { type: Object, required: true } })

const months = Array.from({ length: 12 }, (_, i) => i + 1)
const bloomSet = computed(() => new Set(props.plant.bloomMonths || []))

// Filled cells show the whole bloom palette as crisp vertical bands, so the
// chart itself conveys the colors (no separate, mismatched legend). The data has
// no per-month color, so every active month gets the same banded fill.
const fill = computed(() => {
  const cols = (props.plant.bloomColors || []).map((c) => BLOOM_COLOR_HEX[c] || 'var(--accent)')
  if (!cols.length) return 'var(--accent)'
  if (cols.length === 1) return cols[0]
  const step = 100 / cols.length
  const stops = cols.map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`).join(', ')
  return `linear-gradient(90deg, ${stops})`
})
const colorCaption = computed(() => (props.plant.bloomColors || []).join(', '))
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
    <p v-if="bloomSet.size && colorCaption" class="caption">
      <span class="cap-label">Colors:</span> <span class="cap-val">{{ colorCaption }}</span>
    </p>
    <p v-else-if="!bloomSet.size" class="caption none">No bloom-time data recorded.</p>
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
.bar { height: 22px; border-radius: 3px; background: transparent; }
.bar.on { box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1); }
.m-label {
  text-align: center;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--ink-soft);
}
.caption { font-size: 12.5px; color: var(--ink-soft); margin: 8px 0 0; }
.cap-label { text-transform: uppercase; letter-spacing: 0.05em; font-size: 11px; font-weight: 600; }
.cap-val { text-transform: capitalize; }
.caption.none { font-style: italic; }
</style>

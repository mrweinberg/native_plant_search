<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { MONTH_LABELS } from '../composables/usePlantFilters.js'

defineProps({ plants: { type: Array, required: true } })
const route = useRoute()

const months = Array.from({ length: 12 }, (_, i) => i + 1)
const colorMap = {
  white: '#e4e4e4', red: '#c44d4d', pink: '#f0a0b8', orange: '#e08b3a',
  yellow: '#e9c84a', green: '#7ea36b', blue: '#5a7fb8', purple: '#8a5a9a',
  violet: '#9b6aa1', brown: '#8a6a4a', black: '#222',
}
function cellColor(plant, month) {
  if (!plant.bloomMonths?.includes(month)) return null
  const c = plant.bloomColors?.[0]
  return colorMap[c] || 'var(--accent)'
}
</script>

<template>
  <div class="cal-scroll">
  <div class="cal">
    <div class="cal-head">
      <div class="cell label-cell"></div>
      <div
        v-for="m in months"
        :key="m"
        class="cell month-cell"
        :class="{ 'season-spring': m >= 3 && m <= 5, 'season-summer': m >= 6 && m <= 8, 'season-fall': m >= 9 && m <= 11 }"
      >
        {{ MONTH_LABELS[m] }}
      </div>
    </div>
    <RouterLink
      v-for="p in plants"
      :key="p.id"
      :to="{ name: 'detail', params: { id: p.id }, query: route.query }"
      class="cal-row"
    >
      <div class="cell label-cell">
        <div class="common">{{ p.commonNames[0] }}</div>
        <div class="sci">{{ p.scientificName }}</div>
      </div>
      <div
        v-for="m in months"
        :key="m"
        class="cell bloom-cell"
        :style="{ background: cellColor(p, m) || 'transparent' }"
        :title="cellColor(p, m) ? `${p.commonNames[0]} blooms in ${MONTH_LABELS[m]}` : ''"
      ></div>
    </RouterLink>
    <p v-if="!plants.length" class="empty">No plants match your filters.</p>
  </div>
  </div>
</template>

<style scoped>
.cal-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--card);
}
.cal {
  min-width: 640px;
}
.cal-head, .cal-row {
  display: grid;
  grid-template-columns: minmax(180px, 1.6fr) repeat(12, 1fr);
  align-items: stretch;
}
.cal-head {
  border-bottom: 1px solid var(--border);
  background: var(--bg);
  position: sticky;
  top: 0;
}
.cal-row {
  border-bottom: 1px solid var(--border);
  color: inherit;
  text-decoration: none;
  transition: background 0.08s;
}
.cal-row:last-child { border-bottom: none; }
.cal-row:hover { background: var(--accent-soft); text-decoration: none; }
.cell {
  padding: 6px 8px;
  min-height: 38px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-right: 1px solid var(--border);
  font-size: 12px;
}
.cell:last-child { border-right: none; }
.month-cell {
  text-align: center;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ink-soft);
  font-size: 11px;
}
.season-spring { background: rgba(126, 163, 107, 0.08); }
.season-summer { background: rgba(233, 200, 74, 0.10); }
.season-fall { background: rgba(224, 139, 58, 0.10); }
.label-cell { background: var(--card); }
.common { font-weight: 600; font-size: 13px; }
.sci { font-style: italic; color: var(--ink-soft); font-size: 11px; }
.bloom-cell {
  margin: 8px 3px;
  border-right: none;
  border-radius: 3px;
  min-height: 22px;
}
.empty { padding: 24px; text-align: center; color: var(--ink-soft); }
</style>

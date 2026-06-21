<script setup>
import { computed } from 'vue'

const props = defineProps({ plant: { type: Object, required: true } })

// Catalog heights span groundcovers (<1 ft) to forest trees (~180 ft). A linear
// scale would crush the small end, so use a square-root scale against a fixed
// reference so both extremes stay legible. Reference marks give context.
const REF = 180
const has = computed(() => !!props.plant.heightFeet)
const min = computed(() => props.plant.heightFeet?.min ?? 0)
const max = computed(() => props.plant.heightFeet?.max ?? 0)
const pos = (v) => Math.min(100, (Math.sqrt(Math.max(v, 0)) / Math.sqrt(REF)) * 100)
const left = computed(() => pos(min.value))
const width = computed(() => Math.max(2, pos(max.value) - pos(min.value)))
const ticks = [1, 6, 30, 100]
const label = computed(() =>
  min.value === max.value ? `${max.value} ft` : `${min.value}–${max.value} ft`,
)
</script>

<template>
  <div class="height-bar" v-if="has">
    <div class="track" role="img" :aria-label="`Mature height ${label}`">
      <div
        v-for="t in ticks"
        :key="t"
        class="tick"
        :class="{ human: t === 6 }"
        :style="{ left: `${pos(t)}%` }"
      >
        <span class="tick-label">{{ t === 6 ? '6 ft' : `${t}` }}</span>
      </div>
      <div class="range" :style="{ left: `${left}%`, width: `${width}%` }"></div>
    </div>
    <div class="value">{{ label }} tall</div>
  </div>
</template>

<style scoped>
.height-bar { margin-top: 4px; }
.track {
  position: relative;
  height: 16px;
  border-radius: 999px;
  background: var(--accent-soft);
  margin: 18px 0 6px;
}
.range {
  position: absolute;
  top: 0;
  bottom: 0;
  background: var(--accent);
  border-radius: 999px;
  min-width: 6px;
}
.tick {
  position: absolute;
  top: -6px;
  bottom: -6px;
  width: 1px;
  background: var(--border);
}
.tick.human { background: var(--ink-soft); }
.tick-label {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 9px;
  color: var(--ink-soft);
  white-space: nowrap;
}
.value { font-size: 14px; font-weight: 500; }
</style>

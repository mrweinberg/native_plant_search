<script setup>
import { computed } from 'vue'
import TraitIcon from './TraitIcon.vue'

const props = defineProps({ plant: { type: Object, required: true } })

// Normalize 'part-shade' / 'part shade' to one key.
const LIGHT = {
  sun: { icon: 'sun', label: 'Full sun' },
  'part shade': { icon: 'part-sun', label: 'Part shade' },
  'part-shade': { icon: 'part-sun', label: 'Part shade' },
  shade: { icon: 'shade', label: 'Shade' },
}
const MOISTURE = {
  dry: { icon: 'drop-dry', label: 'Dry soil' },
  moist: { icon: 'drop-moist', label: 'Moist soil' },
  wet: { icon: 'drop-wet', label: 'Wet soil' },
}
const LIFESPAN = {
  perennial: { icon: 'perennial', label: 'Perennial' },
  annual: { icon: 'annual', label: 'Annual' },
  biennial: { icon: 'biennial', label: 'Biennial' },
}
const RETENTION = {
  deciduous: { icon: 'leaf-deciduous', label: 'Deciduous' },
  evergreen: { icon: 'leaf-evergreen', label: 'Evergreen' },
  'semi-evergreen': { icon: 'leaf-semi', label: 'Semi-evergreen' },
}

// Categorical pills (one accent style), de-duplicated and order-preserved.
const conditionPills = computed(() => {
  const p = props.plant
  const out = []
  const seen = new Set()
  const push = (entry) => {
    if (entry && !seen.has(entry.label)) { seen.add(entry.label); out.push(entry) }
  }
  for (const v of p.lightRequirement || []) push(LIGHT[v])
  for (const v of p.soilMoisture || []) push(MOISTURE[v])
  push(LIFESPAN[p.lifespan])
  push(RETENTION[p.leafRetention])
  return out
})

// Boolean badges with their own color classes (reuse detail-page .trait* styling).
const badges = computed(() => {
  const p = props.plant
  const list = []
  if (p.keystone) list.push({ icon: 'keystone', label: 'Keystone plant', cls: 'b-keystone', title: "Its genus hosts an outsized number of native caterpillar species — a Tallamy 'keystone' plant" })
  if (p.deerResistant) list.push({ icon: 'deer', label: 'Deer-resistant', cls: 'b-deer', title: 'A guide, not a guarantee — hungry deer will browse almost anything' })
  if (p.cutFlower) list.push({ icon: 'cut-flower', label: 'Cut flower', cls: 'b-cut', title: 'Good for cut-flower arrangements' })
  if (p.culinaryUse) list.push({ icon: 'edible', label: 'Edible', cls: 'b-edible', title: 'Has edible parts — always confirm safe identification and preparation' })
  if (p.springEphemeral) list.push({ icon: 'ephemeral', label: 'Spring ephemeral', cls: 'b-ephemeral', title: 'Blooms early in spring, then dies back by summer' })
  return list
})
</script>

<template>
  <div class="pills" v-if="conditionPills.length || badges.length">
    <span v-for="c in conditionPills" :key="c.label" class="pill pill-cond" :title="c.label">
      <TraitIcon :name="c.icon" />{{ c.label }}
    </span>
    <span v-for="b in badges" :key="b.label" class="pill" :class="b.cls" :title="b.title">
      <TraitIcon :name="b.icon" />{{ b.label }}
    </span>
  </div>
</template>

<style scoped>
.pills { display: flex; flex-wrap: wrap; gap: 6px; margin: 16px 0 4px; }
.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 500;
  padding: 5px 11px 5px 9px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--ink);
}
.pill-cond { background: var(--accent-soft); color: var(--accent); border-color: transparent; }
.b-keystone { color: #2f6b2f; border-color: #a9d2a9; background: #e1f0e1; }
.b-deer { color: #4a6a4a; border-color: #b3d4b3; background: #e8f4e8; }
.b-cut { color: #8a4a8a; border-color: #d4b3d4; background: #f4e8f4; }
.b-edible { color: #8a5a2a; border-color: #d9c2a3; background: #f6ecdc; }
.b-ephemeral { color: #3d6e7a; border-color: #b3d4d9; background: #e3f0f3; }
</style>

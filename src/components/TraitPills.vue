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

function mapValues(values, table) {
  const out = []
  const seen = new Set()
  for (const v of values || []) {
    const e = table[v]
    if (e && !seen.has(e.label)) { seen.add(e.label); out.push(e) }
  }
  return out
}

// Each entry is a labeled group of value pills (condition styling).
const groups = computed(() => {
  const p = props.plant
  const g = []
  const light = mapValues(p.lightRequirement, LIGHT)
  if (light.length) g.push({ label: 'Light', pills: light })
  const moist = mapValues(p.soilMoisture, MOISTURE)
  if (moist.length) g.push({ label: 'Soil moisture', pills: moist })
  const cycle = mapValues([p.lifespan, p.leafRetention], { ...LIFESPAN, ...RETENTION })
  if (cycle.length) g.push({ label: 'Life cycle', pills: cycle })
  return g
})

// Boolean feature badges (own color classes).
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
  <div class="trait-groups" v-if="groups.length || badges.length">
    <div v-for="grp in groups" :key="grp.label" class="grp">
      <span class="grp-label">{{ grp.label }}</span>
      <span class="grp-pills">
        <span v-for="c in grp.pills" :key="c.label" class="pill pill-cond" :title="c.label">
          <TraitIcon :name="c.icon" />{{ c.label }}
        </span>
      </span>
    </div>
    <div v-if="badges.length" class="grp">
      <span class="grp-label">Features</span>
      <span class="grp-pills">
        <span v-for="b in badges" :key="b.label" class="pill" :class="b.cls" :title="b.title">
          <TraitIcon :name="b.icon" />{{ b.label }}
        </span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.trait-groups {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 22px;
  margin: 16px 0 4px;
}
.grp { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.grp-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-soft);
  font-weight: 600;
}
.grp-pills { display: inline-flex; flex-wrap: wrap; gap: 6px; }
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

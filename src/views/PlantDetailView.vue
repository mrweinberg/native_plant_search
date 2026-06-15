<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { allPlants, MONTH_LABELS } from '../composables/usePlantFilters.js'
import { usePlantImage } from '../composables/usePlantImage.js'

const route = useRoute()
const plant = computed(() => allPlants.find((p) => p.id === route.params.id))
const sciName = computed(() => plant.value?.scientificName || '')
const { src: imageSrc } = usePlantImage(sciName)
const wikiUrl = computed(() =>
  sciName.value
    ? `https://en.wikipedia.org/wiki/${encodeURIComponent(sciName.value.replace(/ /g, '_'))}`
    : null,
)

const backQuery = computed(() => {
  const q = { ...route.query }
  return q
})

function fmtList(v) {
  if (!v) return '—'
  if (Array.isArray(v)) return v.length ? v.join(', ') : '—'
  return String(v)
}
function fmtMonths(months) {
  if (!months?.length) return '—'
  return months.map((m) => MONTH_LABELS[m]).join(', ')
}
function fmtRange(r, unit) {
  if (!r) return '—'
  return `${r.min}–${r.max} ${unit}`
}
</script>

<template>
  <div v-if="plant" class="detail">
    <RouterLink :to="{ name: 'list', query: backQuery }" class="back">← Back to results</RouterLink>
    <div class="header">
      <div class="image-wrap">
        <img v-if="imageSrc" :src="imageSrc" :alt="plant.commonNames[0]" />
        <div v-else class="placeholder" aria-hidden="true">❧</div>
      </div>
      <div>
        <h1>{{ plant.commonNames[0] }}</h1>
        <div class="sci">{{ plant.scientificName }}</div>
        <div class="alt-names" v-if="plant.commonNames.length > 1">
          Also known as: {{ plant.commonNames.slice(1).join(', ') }}
        </div>
      </div>
    </div>
    <p class="notes" v-if="plant.notes">{{ plant.notes }}</p>
    <dl class="facts">
      <div><dt>Family</dt><dd>{{ plant.family }}</dd></div>
      <div><dt>Type</dt><dd class="cap">{{ plant.generalAppearance }}</dd></div>
      <div><dt>Lifespan</dt><dd class="cap">{{ plant.lifespan }}</dd></div>
      <div><dt>Height</dt><dd>{{ fmtRange(plant.heightFeet, 'ft') }}</dd></div>
      <div><dt>Spread</dt><dd>{{ fmtRange(plant.spreadFeet, 'ft') }}</dd></div>
      <div><dt>Light</dt><dd class="cap">{{ fmtList(plant.lightRequirement) }}</dd></div>
      <div><dt>Soil moisture</dt><dd class="cap">{{ fmtList(plant.soilMoisture) }}</dd></div>
      <div><dt>Soil type</dt><dd class="cap">{{ fmtList(plant.soilType) }}</dd></div>
      <div><dt>Bloom months</dt><dd>{{ fmtMonths(plant.bloomMonths) }}</dd></div>
      <div><dt>Bloom colors</dt><dd class="cap">{{ fmtList(plant.bloomColors) }}</dd></div>
      <div><dt>Leaf arrangement</dt><dd class="cap">{{ plant.leafArrangement }}</dd></div>
      <div><dt>Leaf retention</dt><dd class="cap">{{ plant.leafRetention }}</dd></div>
      <div><dt>Native to states</dt><dd>{{ fmtList(plant.nativeStates) }}</dd></div>
      <div><dt>Wildlife value</dt><dd class="cap">{{ fmtList(plant.wildlifeValue) }}</dd></div>
      <div><dt>Deer-resistant</dt><dd>{{ plant.deerResistant ? 'Yes' : 'No' }}</dd></div>
    </dl>
    <p class="wiki-link" v-if="wikiUrl">
      <a :href="wikiUrl" target="_blank" rel="noopener">Read more on Wikipedia ↗</a>
    </p>
  </div>
  <div v-else class="detail">
    <RouterLink to="/" class="back">← Back to results</RouterLink>
    <p>Plant not found.</p>
  </div>
</template>

<style scoped>
.detail {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 24px;
  max-width: 860px;
  margin: 0 auto;
}
.back { font-size: 13px; }
.header {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 20px;
  align-items: center;
  margin: 14px 0 6px;
}
.image-wrap {
  height: 140px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--accent-soft);
}
.image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.placeholder {
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--accent);
  font-size: 64px;
}
.wiki-link { margin-top: 20px; font-size: 14px; }
h1 { margin: 0 0 4px; font-size: 26px; }
.sci { font-style: italic; color: var(--ink-soft); }
.alt-names { margin-top: 6px; font-size: 13px; color: var(--ink-soft); }
.notes {
  background: var(--accent-soft);
  border-left: 3px solid var(--accent);
  padding: 12px 14px;
  border-radius: 4px;
  margin: 18px 0;
}
.facts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px 24px;
  margin: 0;
}
.facts > div { border-bottom: 1px dotted var(--border); padding-bottom: 6px; }
dt {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-soft);
}
dd { margin: 2px 0 0; font-size: 14px; }
.cap { text-transform: capitalize; }
</style>

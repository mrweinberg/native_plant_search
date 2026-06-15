<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { allPlants, MONTH_LABELS } from '../composables/usePlantFilters.js'
import { usePlantImage } from '../composables/usePlantImage.js'
import { useInatGallery } from '../composables/useInatGallery.js'
import FavoriteButton from '../components/FavoriteButton.vue'
import PlantCard from '../components/PlantCard.vue'

const route = useRoute()
const plant = computed(() => allPlants.find((p) => p.id === route.params.id))

function overlap(a, b) {
  if (!a?.length || !b?.length) return 0
  const set = new Set(a)
  let n = 0
  for (const v of b) if (set.has(v)) n++
  return n
}

function bloomSuccessionBonus(a, b) {
  if (!a?.length || !b?.length) return 0
  const set = new Set(a)
  const distinct = b.filter((m) => !set.has(m)).length
  return distinct >= 2 ? 2 : distinct === 1 ? 1 : 0
}

const companions = computed(() => {
  const target = plant.value
  if (!target) return []
  const scored = []
  for (const p of allPlants) {
    if (p.id === target.id) continue
    const conditions =
      3 * overlap(p.lightRequirement, target.lightRequirement) +
      2 * overlap(p.soilMoisture, target.soilMoisture) +
      1 * overlap(p.soilType, target.soilType) +
      1 * overlap(p.soilPh, target.soilPh)
    if (conditions === 0) continue
    const score = conditions + bloomSuccessionBonus(target.bloomMonths, p.bloomMonths)
    scored.push({ plant: p, score })
  }
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.plant.commonNames[0].localeCompare(b.plant.commonNames[0])
  })
  return scored.slice(0, 6).map((s) => s.plant)
})
const sciName = computed(() => plant.value?.scientificName || '')
const imageFile = computed(() => plant.value?.imageFile || null)
const { src: imageSrc } = usePlantImage(sciName, imageFile)
const { photos: inatPhotos } = useInatGallery(sciName)
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
        <a
          v-if="plant.imageFile && plant.imageSource"
          :href="plant.imageSource"
          target="_blank"
          rel="noopener"
          class="img-credit"
          :title="`Image via ${plant.imageCredit || 'Wikimedia'}`"
        >via {{ plant.imageCredit || 'Wikimedia' }}</a>
      </div>
      <div>
        <div class="title-row">
          <h1>{{ plant.commonNames[0] }}</h1>
          <FavoriteButton :plant-id="plant.id" size="md" />
        </div>
        <div class="sci">{{ plant.scientificName }}</div>
        <div class="alt-names" v-if="plant.commonNames.length > 1">
          Also known as: {{ plant.commonNames.slice(1).join(', ') }}
        </div>
        <p class="wiki-link" v-if="wikiUrl">
          <a :href="wikiUrl" target="_blank" rel="noopener">Read more on Wikipedia ↗</a>
        </p>
      </div>
    </div>
    <p class="notes" v-if="plant.notes">{{ plant.notes }}</p>

    <div class="traits-row" v-if="plant.cutFlower || plant.culinaryUse || plant.deerResistant || plant.springEphemeral">
      <span v-if="plant.cutFlower" class="trait trait-cut">✂ Cut flower</span>
      <span v-if="plant.culinaryUse" class="trait trait-edible">🍴 Edible</span>
      <span v-if="plant.deerResistant" class="trait trait-deer">🦌 Deer-resistant</span>
      <span v-if="plant.springEphemeral" class="trait trait-ephemeral">🌱 Spring ephemeral</span>
    </div>

    <section class="group" v-if="inatPhotos.length">
      <h2>Photos</h2>
      <div class="gallery">
        <a
          v-for="(photo, i) in inatPhotos"
          :key="i"
          :href="photo.full"
          target="_blank"
          rel="noopener"
          class="gallery-item"
          :title="photo.attribution"
        >
          <img :src="photo.thumb" :alt="`${plant.commonNames[0]} photo ${i + 1}`" loading="lazy" />
        </a>
      </div>
      <div class="gallery-credit">Photos via iNaturalist</div>
    </section>

    <section class="group">
      <h2>Identification</h2>
      <dl class="facts">
        <div><dt>Family</dt><dd>{{ plant.family }}</dd></div>
        <div><dt>Type</dt><dd class="cap">{{ plant.generalAppearance }}</dd></div>
        <div><dt>Lifespan</dt><dd class="cap">{{ plant.lifespan }}</dd></div>
        <div v-if="plant.usdaSymbol"><dt>USDA symbol</dt><dd>{{ plant.usdaSymbol }}</dd></div>
      </dl>
    </section>

    <section class="group">
      <h2>Size</h2>
      <dl class="facts">
        <div><dt>Height</dt><dd>{{ fmtRange(plant.heightFeet, 'ft') }}</dd></div>
        <div><dt>Spread</dt><dd>{{ fmtRange(plant.spreadFeet, 'ft') }}</dd></div>
      </dl>
    </section>

    <section class="group">
      <h2>Growing conditions</h2>
      <dl class="facts">
        <div><dt>Light</dt><dd class="cap">{{ fmtList(plant.lightRequirement) }}</dd></div>
        <div><dt>Soil moisture</dt><dd class="cap">{{ fmtList(plant.soilMoisture) }}</dd></div>
        <div><dt>Soil type</dt><dd class="cap">{{ fmtList(plant.soilType) }}</dd></div>
        <div><dt>Soil pH</dt><dd class="cap">{{ fmtList(plant.soilPh) }}</dd></div>
        <div><dt>Spread habit</dt><dd class="cap">{{ plant.spreadHabit || '—' }}</dd></div>
      </dl>
    </section>

    <section class="group">
      <h2>Bloom</h2>
      <dl class="facts">
        <div><dt>Bloom months</dt><dd>{{ fmtMonths(plant.bloomMonths) }}</dd></div>
        <div><dt>Bloom colors</dt><dd class="cap">{{ fmtList(plant.bloomColors) }}</dd></div>
      </dl>
    </section>

    <section class="group">
      <h2>Foliage</h2>
      <dl class="facts">
        <div><dt>Leaf arrangement</dt><dd class="cap">{{ plant.leafArrangement }}</dd></div>
        <div><dt>Leaf retention</dt><dd class="cap">{{ plant.leafRetention }}</dd></div>
      </dl>
    </section>

    <section class="group">
      <h2>Native range</h2>
      <dl class="facts">
        <div v-if="plant.nativeRegions?.length">
          <dt>USDA regions</dt><dd>{{ fmtList(plant.nativeRegions) }}</dd>
        </div>
        <div class="wide"><dt>States</dt><dd>{{ fmtList(plant.nativeStates) }}</dd></div>
      </dl>
    </section>

    <section class="group">
      <h2>Wildlife &amp; uses</h2>
      <dl class="facts">
        <div><dt>Wildlife value</dt><dd class="cap">{{ fmtList(plant.wildlifeValue) }}</dd></div>
        <div><dt>Deer-resistant</dt><dd>{{ plant.deerResistant ? 'Yes' : 'No' }}</dd></div>
        <div><dt>Cut flower</dt><dd>{{ plant.cutFlower ? 'Yes' : 'No' }}</dd></div>
        <div><dt>Edible / culinary</dt><dd>{{ plant.culinaryUse ? 'Yes' : 'No' }}</dd></div>
      </dl>
    </section>

    <section class="group companions" v-if="companions.length">
      <h2>Companion plants</h2>
      <div class="companions-sub">Thrives in similar conditions</div>
      <div class="companions-row">
        <PlantCard v-for="c in companions" :key="c.id" :plant="c" />
      </div>
    </section>
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
  position: relative;
}
.img-credit {
  position: absolute;
  right: 4px;
  bottom: 4px;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  text-decoration: none;
}
.img-credit:hover { background: rgba(0, 0, 0, 0.75); }
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
.wiki-link { margin: 8px 0 0; font-size: 13px; }
h1 { margin: 0 0 4px; font-size: 26px; }
.title-row { display: flex; align-items: center; gap: 12px; }
.sci { font-style: italic; color: var(--ink-soft); }
.alt-names { margin-top: 6px; font-size: 13px; color: var(--ink-soft); }
.notes {
  background: var(--accent-soft);
  border-left: 3px solid var(--accent);
  padding: 12px 14px;
  border-radius: 4px;
  margin: 18px 0;
}
.group { margin-top: 22px; }
.group h2 {
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--accent);
  margin: 0 0 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
}
.facts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px 24px;
  margin: 0;
}
.facts > div { padding-bottom: 4px; }
.facts > div.wide { grid-column: 1 / -1; }
dt {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-soft);
}
dd { margin: 2px 0 0; font-size: 14px; }
.cap { text-transform: capitalize; }
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}
.gallery-item {
  display: block;
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
  background: var(--accent-soft);
}
.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.2s ease;
}
.gallery-item:hover img { transform: scale(1.05); }
.gallery-credit { font-size: 11px; color: var(--ink-soft); margin-top: 8px; }
.traits-row { display: flex; flex-wrap: wrap; gap: 6px; margin: 14px 0 4px; }
.trait {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid;
}
.trait-cut { color: #8a4a8a; border-color: #d4b3d4; background: #f4e8f4; }
.trait-edible { color: #8a5a2a; border-color: #d9c2a3; background: #f6ecdc; }
.trait-deer { color: #4a6a4a; border-color: #b3d4b3; background: #e8f4e8; }
.trait-ephemeral { color: #3d6e7a; border-color: #b3d4d9; background: #e3f0f3; }
.companions-sub {
  font-size: 13px;
  color: var(--ink-soft);
  margin: -4px 0 12px;
}
.companions-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}
@media (max-width: 800px) {
  .companions-row {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    gap: 12px;
    padding-bottom: 8px;
    -webkit-overflow-scrolling: touch;
  }
  .companions-row > * {
    flex: 0 0 70%;
    scroll-snap-align: start;
  }
}
</style>

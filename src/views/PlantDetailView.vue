<script setup>
import { computed, ref, watch, watchEffect, onUnmounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { allPlants, plantsLoaded, MONTH_LABELS } from '../composables/usePlantFilters.js'
import { setHead } from '../composables/useHead.js'
import { usePlantImage } from '../composables/usePlantImage.js'
import { useInatGallery } from '../composables/useInatGallery.js'
import FavoriteButton from '../components/FavoriteButton.vue'
import PlantCard from '../components/PlantCard.vue'
import TraitPills from '../components/TraitPills.vue'
import BloomStrip from '../components/BloomStrip.vue'
import HeightBar from '../components/HeightBar.vue'
import RangeMap from '../components/RangeMap.vue'

const route = useRoute()
const router = useRouter()
const plant = computed(() => allPlants.value.find((p) => p.id === route.params.id))

function goBack() {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'list', query: backQuery.value })
}

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
  // Companions must share part of the target's native range, so they actually
  // grow in the same region (the catalog is national — a California plant should
  // not be paired with an Eastern bog plant just because their soils match).
  const targetStates = new Set(target.nativeStates || [])
  const scored = []
  for (const p of allPlants.value) {
    if (p.id === target.id) continue
    if (targetStates.size && !(p.nativeStates || []).some((s) => targetStates.has(s))) continue
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
    // Among equally compatible plants, surface higher ecological (caterpillar) value.
    const ae = a.plant.caterpillarHosts || 0
    const be = b.plant.caterpillarHosts || 0
    if (be !== ae) return be - ae
    return a.plant.commonNames[0].localeCompare(b.plant.commonNames[0])
  })
  return scored.slice(0, 6).map((s) => s.plant)
})
// Plant-specific page metadata for SEO and link sharing.
watchEffect(() => {
  const p = plant.value
  if (!p) return
  setHead({
    title: `${p.commonNames[0]} (${p.scientificName})`,
    description:
      p.notes ||
      `${p.commonNames[0]} (${p.scientificName}), a native ${p.generalAppearance || 'plant'} for ${(p.lightRequirement || []).join('/') || 'the garden'}.`,
    path: `/plant/${p.id}`,
    image: p.imageFile ? `https://bedfellow.org/${p.imageFile}` : undefined,
    type: 'article',
  })
})

const sciName = computed(() => plant.value?.scientificName || '')
const genus = computed(() => sciName.value.split(' ')[0] || '')
const imageFile = computed(() => plant.value?.imageFile || null)
const { src: imageSrc } = usePlantImage(sciName, imageFile)
const { photos: inatPhotos, loading: inatLoading } = useInatGallery(sciName)

// Lightbox for the iNaturalist gallery. A plain click opens the modal; holding a
// modifier (cmd/ctrl/shift/alt) or middle-clicking falls through to the anchor's
// target="_blank", so "open in new tab/window" still works as expected per OS.
const lightboxIndex = ref(null)
const lightboxPhoto = computed(() =>
  lightboxIndex.value != null ? inatPhotos.value[lightboxIndex.value] : null,
)
function openLightbox(i, e) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  e.preventDefault()
  lightboxIndex.value = i
}
function closeLightbox() {
  lightboxIndex.value = null
}
function stepPhoto(delta) {
  const n = inatPhotos.value.length
  if (lightboxIndex.value == null || !n) return
  lightboxIndex.value = (lightboxIndex.value + delta + n) % n
}
function onLightboxKey(e) {
  if (e.key === 'Escape') closeLightbox()
  else if (e.key === 'ArrowLeft') stepPhoto(-1)
  else if (e.key === 'ArrowRight') stepPhoto(1)
}
watch(lightboxIndex, (v) => {
  if (v != null) {
    window.addEventListener('keydown', onLightboxKey)
    document.body.style.overflow = 'hidden'
  } else {
    window.removeEventListener('keydown', onLightboxKey)
    document.body.style.overflow = ''
  }
})
onUnmounted(() => {
  window.removeEventListener('keydown', onLightboxKey)
  document.body.style.overflow = ''
})
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
    <a href="#" class="back" @click.prevent="goBack">← Back to search</a>
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

    <TraitPills :plant="plant" />

    <div class="visuals">
      <div class="viz">
        <h2>Bloom time</h2>
        <BloomStrip :plant="plant" />
      </div>
      <div class="viz">
        <h2>Mature height</h2>
        <HeightBar :plant="plant" />
      </div>
    </div>

    <section class="group" v-if="inatLoading || inatPhotos.length">
      <h2>Photos</h2>
      <div v-if="inatLoading" class="gallery" aria-busy="true" aria-label="Loading photos">
        <div v-for="n in 8" :key="n" class="gallery-item skeleton" aria-hidden="true"></div>
      </div>
      <template v-else>
        <div class="gallery">
          <a
            v-for="(photo, i) in inatPhotos"
            :key="i"
            :href="photo.full"
            target="_blank"
            rel="noopener"
            class="gallery-item"
            :title="photo.attribution"
            @click="openLightbox(i, $event)"
          >
            <img :src="photo.thumb" :alt="`${plant.commonNames[0]} photo ${i + 1}`" loading="lazy" />
          </a>
        </div>
        <div class="gallery-credit">Photos via iNaturalist</div>
      </template>
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
        <div v-if="plant.spreadFeet"><dt>Spacing</dt><dd>{{ fmtRange(plant.spreadFeet, 'ft') }} apart</dd></div>
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
      <RangeMap v-if="plant.nativeStates?.length" :plant="plant" />
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
        <div v-if="plant.caterpillarHosts"><dt>Caterpillar hosts</dt><dd>~{{ plant.caterpillarHosts }} species</dd></div>
        <div><dt>Deer-resistant</dt><dd>{{ plant.deerResistant ? 'Yes' : 'No' }}</dd></div>
        <div><dt>Cut flower</dt><dd>{{ plant.cutFlower ? 'Yes' : 'No' }}</dd></div>
        <div><dt>Edible / culinary</dt><dd>{{ plant.culinaryUse ? 'Yes' : 'No' }}</dd></div>
        <div class="wide" v-if="plant.landscapeUses?.length">
          <dt>Landscape uses</dt>
          <dd class="use-tags">
            <span v-for="u in plant.landscapeUses" :key="u" class="use-tag">{{ u }}</span>
          </dd>
        </div>
      </dl>
      <p v-if="plant.caterpillarHosts" class="host-note">
        Genus-level estimate ({{ genus }}) of native butterfly &amp; moth species hosted as caterpillars, per Tallamy / NWF — the food base for songbirds, and the basis of "keystone" plants.
      </p>
      <p v-if="plant.deerResistant" class="deer-caveat">
        Deer resistance is a guide, not a guarantee — no plant is deer-proof, and hungry deer will sample almost anything.
      </p>
    </section>

    <section class="group companions" v-if="companions.length">
      <h2>Plants that could thrive together</h2>
      <div class="companions-sub">Thrives in similar conditions</div>
      <div class="companions-row">
        <PlantCard v-for="c in companions" :key="c.id" :plant="c" />
      </div>
    </section>
  </div>
  <div v-else-if="!plantsLoaded" class="detail">
    <p>Loading…</p>
  </div>
  <div v-else class="detail">
    <RouterLink to="/" class="back">← Back to search</RouterLink>
    <p>Plant not found.</p>
  </div>

  <Teleport to="body">
    <div
      v-if="lightboxPhoto"
      class="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      @click="closeLightbox"
    >
      <button class="lb-close" type="button" aria-label="Close" @click="closeLightbox">✕</button>
      <button
        v-if="inatPhotos.length > 1"
        class="lb-nav lb-prev"
        type="button"
        aria-label="Previous photo"
        @click.stop="stepPhoto(-1)"
      >‹</button>
      <figure class="lb-figure" @click.stop>
        <img :src="lightboxPhoto.full" :alt="plant && plant.commonNames[0]" />
        <figcaption class="lb-caption">
          <span v-if="lightboxPhoto.attribution">{{ lightboxPhoto.attribution }} · </span>
          <a :href="lightboxPhoto.full" target="_blank" rel="noopener">Open original ↗</a>
        </figcaption>
      </figure>
      <button
        v-if="inatPhotos.length > 1"
        class="lb-nav lb-next"
        type="button"
        aria-label="Next photo"
        @click.stop="stepPhoto(1)"
      >›</button>
    </div>
  </Teleport>
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
.back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-soft);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 7px 14px;
  text-decoration: none;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}
.back:hover {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
  text-decoration: none;
}
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
.use-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
.use-tag {
  background: var(--accent-soft);
  color: var(--accent);
  border-radius: 4px;
  padding: 1px 8px;
  font-size: 12px;
}
.use-tag::first-letter { text-transform: uppercase; }
.deer-caveat { font-size: 12px; color: var(--ink-soft); font-style: italic; margin: 10px 0 0; }
.host-note { font-size: 12px; color: var(--ink-soft); font-style: italic; margin: 10px 0 0; }
.visuals {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px 28px;
  margin-top: 20px;
}
.viz h2 {
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--accent);
  margin: 0 0 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
}
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
.skeleton {
  background: #d6d6d6;
  animation: skeleton-pulse 1.4s ease-in-out infinite;
}
@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
@media (prefers-reduced-motion: reduce) {
  .skeleton { animation: none; opacity: 0.7; }
}
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.lb-figure {
  margin: 0;
  max-width: 92vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.lb-figure img {
  max-width: 92vw;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 6px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
}
.lb-caption {
  color: rgba(255, 255, 255, 0.85);
  font-size: 12px;
  text-align: center;
  max-width: 92vw;
}
.lb-caption a { color: #fff; text-decoration: underline; }
.lb-close,
.lb-nav {
  position: absolute;
  background: rgba(255, 255, 255, 0.12);
  border: none;
  color: #fff;
  cursor: pointer;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s;
}
.lb-close:hover,
.lb-nav:hover { background: rgba(255, 255, 255, 0.28); }
.lb-close {
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  font-size: 18px;
}
.lb-nav {
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  font-size: 30px;
  line-height: 1;
}
.lb-prev { left: 16px; }
.lb-next { right: 16px; }
@media (max-width: 800px) {
  .lb-nav { width: 40px; height: 40px; font-size: 24px; }
  .lb-prev { left: 8px; }
  .lb-next { right: 8px; }
}
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

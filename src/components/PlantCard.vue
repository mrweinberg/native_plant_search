<script setup>
import { toRef } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { usePlantImage } from '../composables/usePlantImage.js'
const props = defineProps({ plant: { type: Object, required: true } })
const route = useRoute()
const sciName = toRef(() => props.plant.scientificName)
const { src: imageSrc } = usePlantImage(sciName)

const colorMap = {
  white: '#ffffff', red: '#c44d4d', pink: '#f0a0b8', orange: '#e08b3a',
  yellow: '#e9c84a', green: '#7ea36b', blue: '#5a7fb8', purple: '#8a5a9a',
  violet: '#9b6aa1', brown: '#8a6a4a', black: '#222',
}
</script>

<template>
  <RouterLink
    :to="{ name: 'detail', params: { id: plant.id }, query: route.query }"
    class="card"
  >
    <div class="image-wrap">
      <img
        v-if="imageSrc"
        :src="imageSrc"
        :alt="plant.commonNames[0]"
        loading="lazy"
      />
      <div v-else class="placeholder" aria-hidden="true">
        <span>❧</span>
      </div>
    </div>
    <div class="body">
      <div class="names">
        <div class="common">{{ plant.commonNames[0] }}</div>
        <div class="sci">{{ plant.scientificName }}</div>
      </div>
      <div class="meta">
        <span class="badge">{{ plant.generalAppearance }}</span>
        <span class="badge">{{ plant.heightFeet.min }}–{{ plant.heightFeet.max }} ft</span>
      </div>
      <div class="traits" v-if="plant.cutFlower || plant.culinaryUse">
        <span v-if="plant.cutFlower" class="trait trait-cut" title="Good for cut-flower arrangements">✂ Cut flower</span>
        <span v-if="plant.culinaryUse" class="trait trait-edible" title="Has edible parts">🍴 Edible</span>
      </div>
      <div class="colors" v-if="plant.bloomColors?.length">
        <span
          v-for="c in plant.bloomColors"
          :key="c"
          class="dot"
          :title="c"
          :style="{ background: colorMap[c] || '#ccc', borderColor: c === 'white' ? '#bbb' : 'transparent' }"
        ></span>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  color: inherit;
  text-decoration: none;
  transition: transform 0.08s, box-shadow 0.08s;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  text-decoration: none;
}
.image-wrap {
  height: 160px;
  background: var(--accent-soft);
  overflow: hidden;
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
  font-size: 42px;
}
.body { padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }
.common { font-weight: 600; font-size: 15px; }
.sci { font-style: italic; color: var(--ink-soft); font-size: 13px; }
.meta { display: flex; gap: 6px; flex-wrap: wrap; }
.badge {
  background: var(--accent-soft);
  color: var(--accent);
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  text-transform: capitalize;
}
.traits { display: flex; flex-wrap: wrap; gap: 4px; }
.trait {
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 4px;
  border: 1px solid;
}
.trait-cut { color: #8a4a8a; border-color: #d4b3d4; background: #f4e8f4; }
.trait-edible { color: #8a5a2a; border-color: #d9c2a3; background: #f6ecdc; }
.colors { display: flex; gap: 4px; }
.dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid transparent;
  display: inline-block;
}
</style>

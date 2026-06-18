<script setup>
import { RouterLink } from 'vue-router'
import { allPlants } from '../composables/usePlantFilters.js'

const sources = [
  {
    title: 'Native range & distribution',
    items: [
      {
        name: 'USDA PLANTS Database',
        url: 'https://plants.usda.gov',
        note: 'Authoritative scientific names, USDA symbols, and native/introduced status by region (e.g. lower 48, Canada).',
      },
      {
        name: 'GBIF — Global Biodiversity Information Facility',
        url: 'https://www.gbif.org',
        note: 'Per-state occurrence records, used as a presence proxy to estimate which states a species is native to. Because it counts observations, very widely cultivated species can appear in more states than their true native range.',
      },
    ],
  },
  {
    title: 'Photographs',
    items: [
      {
        name: 'Wikimedia Commons',
        url: 'https://commons.wikimedia.org',
        note: 'Source of most plant thumbnails, retrieved via the Wikipedia REST API. Each photo carries its own license and is credited on the individual plant page.',
      },
      {
        name: 'iNaturalist',
        url: 'https://www.inaturalist.org',
        note: 'Photo galleries and a fallback source for thumbnails. Photos are licensed by their individual contributors and credited on the plant page.',
      },
    ],
  },
  {
    title: 'Species selection & horticulture',
    items: [
      {
        name: 'ODNR Division of Wildlife',
        url: 'https://ohiodnr.gov',
        note: "Native plant fact sheets that seeded the original Ohio collection and its candidate ranking.",
      },
      {
        name: 'Lady Bird Johnson Wildflower Center',
        url: 'https://www.wildflower.org',
        note: 'Native plant database and regional recommended-species lists used to choose garden-worthy species region by region.',
      },
      {
        name: 'Xerces Society',
        url: 'https://www.xerces.org',
        note: 'Regional pollinator-plant lists informing wildlife value and species selection.',
      },
      {
        name: 'Regional native plant societies & nurseries',
        url: null,
        note: 'State native plant societies and specialist prairie/woodland nurseries, consulted for regional species lists and growing conditions.',
      },
    ],
  },
]
</script>

<template>
  <div class="sources">
    <RouterLink to="/" class="back">← Back to plants</RouterLink>
    <h1>Sources &amp; data</h1>
    <p class="intro">
      Bedfellow's catalog of {{ allPlants.length || 'native' }} plants is built in two layers.
      Native range, scientific names, and photographs are pulled from the public
      databases below; growing conditions, bloom times, and descriptions are then
      hand-curated from horticultural references. Treat the data as a planning
      aid — always confirm hardiness and behavior for your own site.
    </p>

    <section v-for="group in sources" :key="group.title" class="group">
      <h2>{{ group.title }}</h2>
      <ul>
        <li v-for="item in group.items" :key="item.name">
          <span class="name">
            <a v-if="item.url" :href="item.url" target="_blank" rel="noopener">{{ item.name }} ↗</a>
            <template v-else>{{ item.name }}</template>
          </span>
          <span class="note">{{ item.note }}</span>
        </li>
      </ul>
    </section>

    <p class="footnote">
      Photographs remain the property of their respective creators and are used
      under their individual licenses, with attribution shown on each plant's page.
      Spotted an error in the data? It's curated by hand and corrections are welcome.
    </p>
  </div>
</template>

<style scoped>
.sources { max-width: 760px; margin: 0 auto; }
.back { font-size: 13px; display: inline-block; margin-bottom: 12px; }
h1 { margin: 0 0 12px; font-size: 24px; }
.intro { color: var(--ink-soft); line-height: 1.6; margin: 0 0 24px; }
.group {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px 20px;
  margin-bottom: 16px;
}
.group h2 { margin: 0 0 12px; font-size: 16px; }
.group ul { list-style: none; margin: 0; padding: 0; }
.group li {
  padding: 10px 0;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.group li:first-child { border-top: none; }
.name { font-weight: 600; font-size: 14px; }
.name a { color: var(--accent); }
.note { color: var(--ink-soft); font-size: 13px; line-height: 1.5; }
.footnote {
  color: var(--ink-soft);
  font-size: 13px;
  line-height: 1.6;
  margin-top: 8px;
}
</style>

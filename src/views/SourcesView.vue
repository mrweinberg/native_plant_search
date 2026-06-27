<script setup>
import { RouterLink } from 'vue-router'
import { allPlants } from '../composables/usePlantFilters.js'

const sources = [
  {
    title: 'Native range & distribution',
    items: [
      {
        name: 'World Checklist of Vascular Plants (WCVP) — Royal Botanic Gardens, Kew',
        url: 'https://powo.science.kew.org',
        note: "Kew's authoritative record of native vs. introduced status by region (≈ US state), accessed via GBIF. The primary source for which states a species is truly native to. A small share of species WCVP doesn't cover fall back to an occurrence-based estimate.",
      },
      {
        name: 'USDA PLANTS Database',
        url: 'https://plants.usda.gov',
        note: 'Scientific names, USDA symbols, regional native/introduced status, and county-level distribution — the county data drives the county range maps and the county filter.',
      },
      {
        name: 'GBIF — Global Biodiversity Information Facility',
        url: 'https://www.gbif.org',
        note: 'Global occurrence and distribution data. Provides access to the WCVP distribution records above, plus a per-state occurrence fallback for species WCVP does not cover (which can over- or under-state range for cultivated or sparsely-recorded plants).',
      },
    ],
  },
  {
    title: 'Biomes & ecoregions',
    items: [
      {
        name: 'EPA / CEC North America Level I Ecoregions',
        url: 'https://www.epa.gov/eco-research/ecoregions-north-america',
        note: "The Commission for Environmental Cooperation's ecoregion framework. Each plant's native biomes are derived by overlaying its USDA county distribution on these Level I ecoregions (county boundaries from the US Census Bureau).",
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
        name: 'Doug Tallamy / NWF Native Plant Finder',
        url: 'https://nativeplantfinder.nwf.org',
        note: 'Caterpillar host-plant counts by genus — how many native butterfly and moth species each genus supports — used for the caterpillar-host figures and the "keystone plant" designation. Genus-level national estimates.',
      },
      {
        name: 'Calscape — California Native Plant Society',
        url: 'https://calscape.org',
        note: 'The authoritative California native-plant database, guiding the California floristic-province selections and their growing conditions.',
      },
      {
        name: 'Oregon Flora',
        url: 'https://www.oregonflora.org',
        note: 'Distribution and species information for the Pacific Northwest.',
      },
      {
        name: 'Arizona-Sonora Desert Museum',
        url: 'https://www.desertmuseum.org',
        note: 'Reference for the Sonoran, Mojave, and Chihuahuan desert species and their cultivation.',
      },
      {
        name: 'State native plant societies & specialist nurseries',
        url: null,
        note: 'Native plant societies (California, Washington, Colorado, and others) and specialist regional nurseries, consulted for species lists and growing conditions across each region.',
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
      databases below. Growing conditions, bloom times, wildlife value, deer
      resistance, and plant descriptions are then editorially written with AI
      assistance, drawing on the horticultural references below, and checked for
      completeness — but they can contain errors. Deer resistance especially is a
      rough guide: no plant is deer-proof. Treat the data as a planning aid, and
      always confirm a plant's range, hardiness, and behavior for your own site
      before planting.
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

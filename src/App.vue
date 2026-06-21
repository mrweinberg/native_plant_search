<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useFavorites } from './composables/useFavorites.js'
import { useLocation } from './composables/useLocation.js'
import { setHead } from './composables/useHead.js'
import LocationPicker from './components/LocationPicker.vue'
const { count: favCount } = useFavorites()
const { locationName } = useLocation()

// Keep document head in sync per route. Plant detail pages set their own
// (plant-specific) head; the others use these static defaults.
const router = useRouter()
const ROUTE_HEAD = {
  favorites: {
    title: 'Favorites',
    description: 'Your saved native plants, with a bloom-coverage timeline and companion planting beds.',
    path: '/favorites',
  },
  sources: {
    title: 'Sources & data',
    description: 'The data sources behind Bedfellow: USDA PLANTS, GBIF, Wikimedia, iNaturalist, and regional native-plant authorities.',
    path: '/sources',
  },
}
router.afterEach((to) => {
  if (to.name === 'detail') return
  setHead(ROUTE_HEAD[to.name] || { path: '/' })
})

const tagline = computed(() =>
  locationName.value
    ? `Plan a ${locationName.value} native garden that blooms all season`
    : 'Plan a native garden that blooms all season',
)
</script>

<template>
  <div class="app">
    <header class="app-header">
      <RouterLink to="/" class="brand">
        <span class="brand-mark">❧</span>
        Bedfellow
      </RouterLink>
      <span class="tagline">{{ tagline }}</span>
      <LocationPicker />
      <span class="spacer"></span>
      <RouterLink :to="{ name: 'favorites' }" class="nav-link" active-class="nav-link-active">
        <span aria-hidden="true">★</span> Favorites
        <span v-if="favCount" class="count">{{ favCount }}</span>
      </RouterLink>
      <a
        class="support"
        href="https://ko-fi.com/maxweinberg"
        target="_blank"
        rel="noopener"
        title="Support Bedfellow on Ko-fi"
      >☕ Tip Jar</a>
    </header>
    <main>
      <RouterView />
    </main>
    <footer class="app-footer">
      <span>❧ Bedfellow</span>
      <span class="dot">·</span>
      <RouterLink :to="{ name: 'sources' }">Sources &amp; data</RouterLink>
    </footer>
  </div>
</template>

<style scoped>
.app-header {
  background: var(--ink);
  color: #f1ebd9;
  padding: 14px 24px;
  display: flex;
  align-items: baseline;
  gap: 16px;
  box-shadow: var(--shadow);
}
.brand {
  color: #f1ebd9;
  font-weight: 600;
  font-size: 18px;
  text-decoration: none;
}
.brand-mark { color: #a7d6a7; margin-right: 6px; }
.tagline { color: #c9c0a4; font-size: 13px; }
.spacer { flex: 1; }
.support {
  align-self: center;
  color: #2a1f0a;
  background: #e8c34a;
  font-size: 14px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 999px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: background 0.12s, transform 0.08s;
}
.support:hover { background: #f0cf5e; transform: translateY(-1px); text-decoration: none; }
.nav-link {
  color: #f1ebd9;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.06);
}
.nav-link:hover { background: rgba(255, 255, 255, 0.14); text-decoration: none; }
.nav-link-active { background: var(--accent); color: #fff; }
.nav-link .count {
  background: #e0a512;
  color: #2a1f0a;
  font-size: 11px;
  font-weight: 700;
  border-radius: 999px;
  padding: 1px 7px;
  line-height: 1.4;
}
.nav-link-active .count { background: rgba(255, 255, 255, 0.85); color: var(--accent); }
main { padding: 24px; max-width: 1280px; margin: 0 auto; }
.app-footer {
  max-width: 1280px;
  margin: 0 auto;
  padding: 20px 24px 32px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ink-soft);
  font-size: 13px;
}
.app-footer a { color: var(--ink-soft); }
.app-footer a:hover { color: var(--accent); }
.app-footer .dot { opacity: 0.5; }
@media (max-width: 800px) {
  .app-header { padding: 10px 14px; flex-wrap: wrap; gap: 8px; }
  .brand { font-size: 16px; }
  .tagline { font-size: 12px; }
  main { padding: 14px; }
}
</style>

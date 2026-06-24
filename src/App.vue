<script setup>
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useFavorites } from './composables/useFavorites.js'
import { setHead } from './composables/useHead.js'
import LocationPicker from './components/LocationPicker.vue'
const { count: favCount } = useFavorites()
const year = new Date().getFullYear()

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
  about: {
    title: 'About',
    description: 'About Bedfellow, a free tool for searching North American native plants and planning a garden that blooms all season.',
    path: '/about',
  },
  terms: {
    title: 'Terms of Service',
    description: 'The terms governing use of Bedfellow.',
    path: '/terms',
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'How Bedfellow handles information when you use the site.',
    path: '/privacy',
  },
}
router.afterEach((to) => {
  if (to.name === 'detail') return
  setHead(ROUTE_HEAD[to.name] || { path: '/' })
})

</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="title-block">
        <RouterLink to="/" class="brand">
          <svg class="brand-mark" viewBox="0 0 64 64" aria-hidden="true">
            <g transform="translate(32 32)">
              <g fill="#e0a512">
                <path transform="rotate(0)" d="M0 -8 C 6 -10 6 -24 0 -28 C -6 -24 -6 -10 0 -8 Z" />
                <path transform="rotate(40)" d="M0 -8 C 6 -10 6 -24 0 -28 C -6 -24 -6 -10 0 -8 Z" />
                <path transform="rotate(80)" d="M0 -8 C 6 -10 6 -24 0 -28 C -6 -24 -6 -10 0 -8 Z" />
                <path transform="rotate(120)" d="M0 -8 C 6 -10 6 -24 0 -28 C -6 -24 -6 -10 0 -8 Z" />
                <path transform="rotate(160)" d="M0 -8 C 6 -10 6 -24 0 -28 C -6 -24 -6 -10 0 -8 Z" />
                <path transform="rotate(200)" d="M0 -8 C 6 -10 6 -24 0 -28 C -6 -24 -6 -10 0 -8 Z" />
                <path transform="rotate(240)" d="M0 -8 C 6 -10 6 -24 0 -28 C -6 -24 -6 -10 0 -8 Z" />
                <path transform="rotate(280)" d="M0 -8 C 6 -10 6 -24 0 -28 C -6 -24 -6 -10 0 -8 Z" />
                <path transform="rotate(320)" d="M0 -8 C 6 -10 6 -24 0 -28 C -6 -24 -6 -10 0 -8 Z" />
              </g>
              <circle r="9.5" fill="#2c1d12" />
              <circle r="9.5" fill="none" stroke="#e0a512" stroke-width="1.2" />
            </g>
          </svg>
          Bedfellow<sup class="tm" aria-hidden="true">™</sup>
        </RouterLink>
        <span class="tagline">Plan your native garden</span>
      </div>
      <div class="top-actions">
        <RouterLink :to="{ name: 'favorites' }" class="nav-link" active-class="nav-link-active">
          <span aria-hidden="true">★</span> Favorites
          <span v-if="favCount" class="count">{{ favCount }}</span>
        </RouterLink>
        <LocationPicker />
      </div>
      <nav class="top-links">
        <a
          href="https://ko-fi.com/maxweinberg"
          target="_blank"
          rel="noopener"
          title="Support Bedfellow on Ko-fi"
        >Tip jar</a>
        <RouterLink :to="{ name: 'about' }">About</RouterLink>
        <RouterLink :to="{ name: 'sources' }">Sources</RouterLink>
      </nav>
    </header>
    <main>
      <RouterView />
    </main>
    <footer class="app-footer">
      <span>© {{ year }} Bedfellow™</span>
      <span class="dot">·</span>
      <RouterLink :to="{ name: 'about' }">About</RouterLink>
      <span class="dot">·</span>
      <RouterLink :to="{ name: 'sources' }">Sources &amp; data</RouterLink>
      <span class="dot">·</span>
      <RouterLink :to="{ name: 'terms' }">Terms</RouterLink>
      <span class="dot">·</span>
      <RouterLink :to="{ name: 'privacy' }">Privacy</RouterLink>
      <span class="dot">·</span>
      <a href="mailto:features@bedfellow.org">Request a feature or report a bug</a>
    </footer>
  </div>
</template>

<style scoped>
.app-header {
  background: var(--ink);
  color: #f1ebd9;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 18px;
  box-shadow: var(--shadow);
}
.title-block {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-right: auto;
}
.brand {
  color: #f1ebd9;
  font-weight: 600;
  font-size: 18px;
  text-decoration: none;
}
.brand-mark {
  height: 1.5em;
  width: 1.5em;
  margin-right: 6px;
  vertical-align: -0.32em;
}
.tm { font-size: 9px; vertical-align: super; margin-left: 1px; opacity: 0.8; }
.tagline { color: #c9c0a4; font-size: 13px; }
.top-links {
  display: flex;
  align-items: center;
  font-size: 14px;
}
.top-links a {
  color: #d7cfb6;
  text-decoration: none;
}
.top-links a:hover { color: #fff; text-decoration: underline; }
.top-links a + a::before {
  content: '|';
  display: inline-block;
  margin: 0 12px;
  color: rgba(241, 235, 217, 0.3);
}
.top-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
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
  .app-header { padding: 10px 14px; gap: 8px 14px; }
  .brand { font-size: 16px; }
  /* Two rows: brand + links on top, Favorites + state picker on their own row.
     The tagline is hidden here so the top row fits on one line. The links sit
     after the actions in the DOM (for desktop), so re-order them on top here. */
  .tagline { display: none; }
  .top-links { order: 1; }
  .top-actions {
    order: 2;
    flex-basis: 100%;
    justify-content: flex-start;
    gap: 10px;
  }
  main { padding: 14px; }
}
</style>

<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useFavorites } from './composables/useFavorites.js'
import { useLocation, US_STATES } from './composables/useLocation.js'
const { count: favCount } = useFavorites()
const { location, locationName, setLocation } = useLocation()

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
      <label class="loc" :class="{ set: location }">
        <span class="loc-pin" aria-hidden="true">📍</span>
        <select
          class="loc-select"
          :value="location || ''"
          aria-label="Set your state"
          @change="setLocation($event.target.value || null)"
        >
          <option value="">All states</option>
          <option v-for="[code, name] in US_STATES" :key="code" :value="code">{{ name }}</option>
        </select>
      </label>
      <span class="spacer"></span>
      <RouterLink :to="{ name: 'favorites' }" class="nav-link" active-class="nav-link-active">
        <span aria-hidden="true">★</span> Favorites
        <span v-if="favCount" class="count">{{ favCount }}</span>
      </RouterLink>
    </header>
    <main>
      <RouterView />
    </main>
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
.loc {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 999px;
  padding: 3px 10px 3px 8px;
  align-self: center;
}
.loc.set { background: var(--accent); }
.loc-pin { font-size: 12px; }
.loc-select {
  background: transparent;
  border: none;
  color: #f1ebd9;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding-right: 2px;
}
.loc-select:focus { outline: none; }
.loc-select option { color: #1a1a1a; }
.spacer { flex: 1; }
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
@media (max-width: 800px) {
  .app-header { padding: 10px 14px; flex-wrap: wrap; gap: 8px; }
  .brand { font-size: 16px; }
  .tagline { font-size: 12px; }
  main { padding: 14px; }
}
</style>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app">
    <header class="app-header">
      <RouterLink to="/" class="brand">
        <span class="brand-mark">❧</span>
        Native Plant Search
      </RouterLink>
      <span class="tagline">Find natives by name, region, and growing conditions</span>
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
main { padding: 24px; max-width: 1280px; margin: 0 auto; }
</style>

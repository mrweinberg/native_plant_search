<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="about">
    <RouterLink to="/" class="back">← Back to plants</RouterLink>
    <h1>About</h1>
    <p class="intro">
      <!-- Placeholder — to be written by hand. -->
      About Bedfellow.
    </p>
  </div>
</template>

<style scoped>
.about { max-width: 760px; margin: 0 auto; }
.back { font-size: 13px; display: inline-block; margin-bottom: 12px; }
h1 { margin: 0 0 12px; font-size: 24px; }
.intro { color: var(--ink-soft); line-height: 1.6; margin: 0 0 24px; }
</style>

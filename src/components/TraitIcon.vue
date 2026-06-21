<script setup>
// A small inline SVG icon, selected by `name`, drawn in currentColor so the
// surrounding pill controls its color. Decorative — the pill carries the label,
// so the svg is aria-hidden.
defineProps({ name: { type: String, required: true }, size: { type: Number, default: 16 } })
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    class="trait-icon"
  >
    <!-- Light -->
    <template v-if="name === 'sun'">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </template>
    <template v-else-if="name === 'part-sun'">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M2 12h2M4.9 4.9l1.4 1.4M19.1 4.9l-1.4 1.4" />
      <path d="M5 20h14" stroke-opacity="0.5" />
    </template>
    <template v-else-if="name === 'shade'">
      <path d="M17 18a5 5 0 0 0-9.6-2A3.5 3.5 0 0 0 8 23h9a3 3 0 0 0 0-5z" />
      <path d="M12 3v3M5 7l1.5 1.5M19 7l-1.5 1.5" stroke-opacity="0.5" />
    </template>
    <!-- Soil moisture (water drops) -->
    <template v-else-if="name === 'drop-dry'">
      <path d="M12 3s5 5.5 5 9a5 5 0 0 1-10 0c0-3.5 5-9 5-9z" stroke-dasharray="2 2" />
    </template>
    <template v-else-if="name === 'drop-moist'">
      <path d="M12 3s5 5.5 5 9a5 5 0 0 1-10 0c0-3.5 5-9 5-9z" />
    </template>
    <template v-else-if="name === 'drop-wet'">
      <path d="M12 3s5 5.5 5 9a5 5 0 0 1-10 0c0-3.5 5-9 5-9z" />
      <path d="M9.5 13a2.5 2.5 0 0 0 2.5 2.5" stroke-opacity="0.6" />
    </template>
    <!-- Leaf retention -->
    <template v-else-if="name === 'leaf-evergreen'">
      <path d="M12 2 7 9h3l-4 6h4l-3 5h12l-3-5h4l-4-6h3z" />
    </template>
    <template v-else-if="name === 'leaf-deciduous'">
      <path d="M5 19c8 1 14-4 14-13 0 0-12-2-14 6-1 4 0 7 0 7z" />
      <path d="M5 19l6-6" />
    </template>
    <template v-else-if="name === 'leaf-semi'">
      <path d="M5 19c8 1 14-4 14-13 0 0-12-2-14 6-1 4 0 7 0 7z" />
      <path d="M12 12.5l7-6.5" stroke-opacity="0.4" />
    </template>
    <!-- Lifespan -->
    <template v-else-if="name === 'perennial'">
      <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8" />
      <path d="M20 4v4h-4" />
      <path d="M20 12a8 8 0 0 1-13.7 5.6L4 16" />
      <path d="M4 20v-4h4" />
    </template>
    <template v-else-if="name === 'annual'">
      <path d="M12 21V9" />
      <path d="M12 9c0-3-2-5-5-5 0 3 2 5 5 5z" />
      <path d="M12 11c0-3 2-5 5-5 0 3-2 5-5 5z" />
    </template>
    <template v-else-if="name === 'biennial'">
      <path d="M12 21V8" />
      <path d="M12 12c0-3-2-5-5-5 0 3 2 5 5 5z" />
      <circle cx="12" cy="5" r="2" />
    </template>
    <!-- Boolean badges -->
    <template v-else-if="name === 'keystone'">
      <path d="M12 5v13" />
      <ellipse cx="8.5" cy="9.5" rx="3" ry="2.4" />
      <ellipse cx="15.5" cy="9.5" rx="3" ry="2.4" />
      <ellipse cx="9" cy="15" rx="2.6" ry="2.2" />
      <ellipse cx="15" cy="15" rx="2.6" ry="2.2" />
      <path d="M12 5 10.5 3M12 5l1.5-2" />
    </template>
    <template v-else-if="name === 'deer'">
      <path d="M7 4c0 3 2 4 5 4s5-1 5-4" />
      <path d="M7 4 5 2M7 4 4 4M17 4l2-2M17 4l3 0" />
      <path d="M12 8v3" />
      <path d="M8.5 13a3.5 3.5 0 0 0 7 0c0-1-.5-2-3.5-2s-3.5 1-3.5 2z" />
      <path d="M9 16v4M15 16v4" />
    </template>
    <template v-else-if="name === 'cut-flower'">
      <circle cx="6" cy="7" r="2.2" />
      <circle cx="6" cy="16" r="2.2" />
      <path d="M8 8.5 20 16M8 15.5 20 8" />
    </template>
    <template v-else-if="name === 'edible'">
      <path d="M7 2v8a3 3 0 0 0 6 0V2" />
      <path d="M10 2v20" />
      <path d="M18 2c-2 0-3 2-3 5s1 5 3 5V2z" />
      <path d="M18 12v10" />
    </template>
    <template v-else-if="name === 'ephemeral'">
      <path d="M12 21v-7" />
      <path d="M12 14c-3 0-5-2-5-5 3 0 5 2 5 5z" />
      <path d="M12 12c0-2.5 2-4.5 4.5-4.5 0 2.5-2 4.5-4.5 4.5z" />
    </template>
  </svg>
</template>

<style scoped>
.trait-icon { display: block; flex: none; }
</style>

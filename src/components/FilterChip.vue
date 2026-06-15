<script setup>
defineProps({
  label: { type: [String, Number], required: true },
  active: { type: Boolean, default: false },
})
defineEmits(['toggle'])
</script>

<template>
  <button
    class="chip"
    :class="{ active }"
    :aria-pressed="active"
    @click="$emit('toggle')"
    type="button"
  >
    {{ label }}
  </button>
</template>

<style scoped>
.chip {
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--ink-soft);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 13px;
  margin: 2px;
  transition: background 0.1s, border-color 0.1s, color 0.1s;
}
.chip:hover { border-color: var(--accent); color: var(--ink); }
.chip.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
</style>

<script setup>
const props = defineProps({ modelValue: String })
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="search-bar">
    <input
      type="search"
      :value="modelValue"
      @input="emit('update:modelValue', $event.target.value)"
      placeholder="Search by common or scientific name…"
      aria-label="Search plants"
    />
  </div>
</template>

<style scoped>
.search-bar { margin-bottom: 16px; }
input {
  width: 100%;
  padding: 12px 14px;
  font-size: 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card);
  color: var(--ink);
}
input:focus {
  outline: 2px solid var(--accent);
  outline-offset: -1px;
}
</style>

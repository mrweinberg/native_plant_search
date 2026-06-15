<script setup>
import { computed } from 'vue'
import { useFavorites } from '../composables/useFavorites.js'

const props = defineProps({
  plantId: { type: String, required: true },
  size: { type: String, default: 'sm' },
})

const { isFavorite, toggle } = useFavorites()
const active = computed(() => isFavorite(props.plantId))

function onClick(e) {
  e.preventDefault()
  e.stopPropagation()
  toggle(props.plantId)
}
</script>

<template>
  <button
    type="button"
    class="fav"
    :class="[`size-${size}`, { active }]"
    :aria-pressed="active"
    :aria-label="active ? 'Remove from favorites' : 'Add to favorites'"
    :title="active ? 'Remove from favorites' : 'Add to favorites'"
    @click="onClick"
  >
    <span aria-hidden="true">{{ active ? '★' : '☆' }}</span>
  </button>
</template>

<style scoped>
.fav {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--border);
  border-radius: 999px;
  cursor: pointer;
  color: var(--ink-soft);
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: color 0.1s, transform 0.08s, background 0.1s;
}
.fav:hover { color: #d4a017; transform: scale(1.06); }
.fav.active { color: #e0a512; background: #fff8e1; border-color: #e8cf7a; }
.size-sm { width: 30px; height: 30px; font-size: 18px; }
.size-md { width: 38px; height: 38px; font-size: 22px; }
</style>

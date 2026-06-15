<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import PlantCard from '../components/PlantCard.vue'
import { allPlants } from '../composables/usePlantFilters.js'
import { useFavorites } from '../composables/useFavorites.js'

const { favorites, favoriteSet, clear } = useFavorites()

const plants = computed(() =>
  favorites.value
    .map((id) => allPlants.find((p) => p.id === id))
    .filter(Boolean),
)

function confirmClear() {
  if (favoriteSet.value.size === 0) return
  if (confirm(`Remove all ${favoriteSet.value.size} favorites?`)) clear()
}
</script>

<template>
  <div class="favorites">
    <div class="head">
      <div>
        <h1>Favorites</h1>
        <p class="muted">
          {{ plants.length }} saved plant{{ plants.length === 1 ? '' : 's' }}
        </p>
      </div>
      <button
        v-if="plants.length"
        type="button"
        class="clear"
        @click="confirmClear"
      >Clear all</button>
    </div>

    <div v-if="plants.length" class="grid">
      <PlantCard v-for="p in plants" :key="p.id" :plant="p" />
    </div>
    <div v-else class="empty">
      <p>You haven't saved any favorites yet.</p>
      <p>
        Tap the ☆ on a plant to save it.
        <RouterLink to="/">Browse plants →</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.favorites { max-width: 1280px; margin: 0 auto; }
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}
h1 { margin: 0 0 4px; font-size: 24px; }
.muted { color: var(--ink-soft); font-size: 14px; margin: 0; }
.clear {
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 12px;
  color: var(--ink-soft);
  font-size: 13px;
  cursor: pointer;
}
.clear:hover { color: var(--accent); border-color: var(--accent); }
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
@media (max-width: 800px) {
  .grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
}
.empty {
  background: var(--card);
  border: 1px dashed var(--border);
  border-radius: 10px;
  padding: 36px 24px;
  text-align: center;
  color: var(--ink-soft);
}
.empty p { margin: 6px 0; }
</style>

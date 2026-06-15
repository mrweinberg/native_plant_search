<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import PlantCard from '../components/PlantCard.vue'
import BloomCalendar from '../components/BloomCalendar.vue'
import { allPlants, MONTH_LABELS } from '../composables/usePlantFilters.js'
import { useFavorites } from '../composables/useFavorites.js'

const { favorites, favoriteSet, clear } = useFavorites()

const plants = computed(() =>
  favorites.value
    .map((id) => allPlants.find((p) => p.id === id))
    .filter(Boolean),
)

const viewMode = ref('grid')

const coverage = computed(() => {
  const counts = Array(13).fill(0)
  for (const p of plants.value) {
    for (const m of p.bloomMonths || []) counts[m]++
  }
  const months = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    return { month: m, label: MONTH_LABELS[m], count: counts[m] }
  })
  const covered = months.filter((m) => m.count > 0).length
  const gaps = months.filter((m) => m.count === 0).map((m) => m.label)
  const peak = months.reduce((a, b) => (b.count > a.count ? b : a), months[0])
  return { months, covered, gaps, peak }
})

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

    <section v-if="plants.length" class="coverage" aria-label="Bloom coverage summary">
      <div class="coverage-summary">
        <div class="stat">
          <div class="stat-num">{{ coverage.covered }}<span class="stat-denom">/12</span></div>
          <div class="stat-label">months in bloom</div>
        </div>
        <div class="coverage-strip" role="img" :aria-label="`Bloom coverage by month`">
          <div
            v-for="m in coverage.months"
            :key="m.month"
            class="cov-cell"
            :class="{ active: m.count > 0 }"
            :style="m.count > 0 ? { opacity: 0.35 + Math.min(0.65, m.count * 0.15) } : null"
            :title="`${m.label}: ${m.count} plant${m.count === 1 ? '' : 's'} in bloom`"
          >
            <span>{{ m.label[0] }}</span>
          </div>
        </div>
        <div class="gaps">
          <template v-if="coverage.gaps.length === 0">
            <strong>Year-round bloom!</strong> Your favorites cover every month.
          </template>
          <template v-else>
            <strong>Gaps:</strong> {{ coverage.gaps.join(', ') }}
          </template>
        </div>
      </div>
    </section>

    <div v-if="plants.length" class="view-row">
      <div class="view-toggle" role="tablist">
        <button
          type="button"
          :class="{ active: viewMode === 'grid' }"
          @click="viewMode = 'grid'"
        >Grid</button>
        <button
          type="button"
          :class="{ active: viewMode === 'calendar' }"
          @click="viewMode = 'calendar'"
        >Calendar</button>
      </div>
    </div>

    <template v-if="plants.length">
      <div v-if="viewMode === 'grid'" class="grid">
        <PlantCard v-for="p in plants" :key="p.id" :plant="p" />
      </div>
      <BloomCalendar v-else :plants="plants" />
    </template>
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

.coverage {
  background: var(--card);
  border-radius: 10px;
  padding: 14px 18px;
  margin-bottom: 16px;
}
.coverage-summary {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-areas:
    "stat strip"
    "stat gaps";
  gap: 6px 20px;
  align-items: center;
}
.stat { grid-area: stat; text-align: center; padding-right: 8px; }
.stat-num { font-size: 28px; font-weight: 700; color: var(--accent); line-height: 1; }
.stat-denom { font-size: 16px; font-weight: 500; color: var(--ink-soft); }
.stat-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-soft);
  margin-top: 4px;
}
.coverage-strip {
  grid-area: strip;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 3px;
}
.cov-cell {
  background: rgba(0, 0, 0, 0.05);
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: var(--ink-soft);
  text-transform: uppercase;
}
.cov-cell.active {
  background: var(--accent);
  color: #fff;
}
.gaps { grid-area: gaps; font-size: 13px; color: var(--ink-soft); }
.gaps strong { color: var(--ink); font-weight: 600; }

.view-row { margin-bottom: 12px; }
.view-toggle {
  display: inline-flex;
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
}
.view-toggle button {
  background: var(--card);
  color: var(--ink-soft);
  border: none;
  padding: 5px 12px;
  font-size: 13px;
  cursor: pointer;
}
.view-toggle button.active { background: var(--accent); color: #fff; }

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
@media (max-width: 800px) {
  .grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
  .coverage-summary {
    grid-template-columns: 1fr;
    grid-template-areas:
      "stat"
      "strip"
      "gaps";
    gap: 10px;
  }
  .stat { text-align: left; padding-right: 0; }
  .stat-num { display: inline; }
  .stat-label { display: inline; margin-left: 8px; }
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

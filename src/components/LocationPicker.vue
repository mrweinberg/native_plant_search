<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useLocation, US_STATES, stateName } from '../composables/useLocation.js'

const { location, setLocation } = useLocation()

const open = ref(false)
const search = ref('')
const rootEl = ref(null)
const inputEl = ref(null)

const visible = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return US_STATES
  return US_STATES.filter(
    ([code, name]) => name.toLowerCase().includes(q) || code.toLowerCase() === q,
  )
})

function toggle() {
  open.value = !open.value
}
function close() {
  open.value = false
}
function choose(code) {
  setLocation(code)
  close()
}
function onDocClick(e) {
  if (open.value && rootEl.value && !rootEl.value.contains(e.target)) close()
}
function onKey(e) {
  if (e.key === 'Escape' && open.value) close()
}

watch(open, async (v) => {
  if (v) {
    await nextTick()
    inputEl.value?.focus()
  } else {
    search.value = ''
  }
})

onMounted(() => {
  document.addEventListener('mousedown', onDocClick)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocClick)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="lp" ref="rootEl">
    <button
      type="button"
      class="lp-trigger"
      :class="{ set: location }"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="toggle"
    >
      <span class="lp-pin" aria-hidden="true">📍</span>
      <span class="lp-label">{{ location ? stateName(location) : 'All states' }}</span>
      <span class="lp-caret" aria-hidden="true">▾</span>
    </button>
    <div v-if="open" class="lp-panel" role="listbox" aria-label="Set your state">
      <div class="lp-search">
        <input
          ref="inputEl"
          type="search"
          v-model="search"
          placeholder="Search states…"
          aria-label="Search states"
        />
      </div>
      <ul class="lp-opts">
        <li v-if="!search.trim()">
          <button
            type="button"
            class="lp-opt"
            :class="{ active: !location }"
            @click="choose(null)"
          >All states</button>
        </li>
        <li v-for="[code, name] in visible" :key="code">
          <button
            type="button"
            class="lp-opt"
            :class="{ active: location === code }"
            @click="choose(code)"
          >{{ name }}</button>
        </li>
        <li v-if="!visible.length" class="lp-empty">No matches</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.lp { position: relative; align-self: center; }
.lp-trigger {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 4px 10px 4px 9px;
  color: #f1ebd9;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
.lp-trigger:hover { background: rgba(255, 255, 255, 0.14); }
.lp-trigger.set { background: var(--accent); }
.lp-pin { font-size: 12px; }
.lp-caret { font-size: 10px; opacity: 0.8; }

.lp-panel {
  position: absolute;
  z-index: 20;
  top: calc(100% + 6px);
  left: 0;
  min-width: 220px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.22);
  padding: 6px;
  display: flex;
  flex-direction: column;
  max-height: 320px;
}
.lp-search { padding: 2px 2px 6px; }
.lp-search input {
  width: 100%;
  font: inherit;
  font-size: 13px;
  padding: 6px 8px;
  border: 1px solid var(--border);
  border-radius: 5px;
  box-sizing: border-box;
  color: var(--ink);
  background: var(--bg);
}
.lp-opts {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
}
.lp-opt {
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  font: inherit;
  font-size: 13px;
  color: var(--ink);
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
}
.lp-opt:hover { background: var(--accent-soft); }
.lp-opt.active {
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
}
.lp-empty { padding: 8px; color: var(--ink-soft); font-size: 13px; text-align: center; }
</style>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useLocation, US_STATES, stateName } from '../composables/useLocation.js'
import { useCountyIndex } from '../composables/useCountyIndex.js'

const { location, county, locationName, setLocation, setCounty, clearCounty } = useLocation()
const { countiesForState } = useCountyIndex()

const open = ref(false)
const search = ref('')
const rootEl = ref(null)
const inputEl = ref(null)

// Two-level flow: pick a state, then optionally narrow to a county within it.
const level = ref('state') // 'state' | 'county'
const counties = ref([])
const countiesLoading = ref(false)

async function loadCounties(code) {
  countiesLoading.value = true
  counties.value = []
  const list = await countiesForState(code)
  // Guard against a stale load if the state changed while awaiting.
  if (location.value === code) counties.value = list
  countiesLoading.value = false
}
const visibleCounties = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return counties.value
  return counties.value.filter((c) => c.name.toLowerCase().includes(q))
})
const currentStateName = computed(() => (location.value ? stateName(location.value) : ''))

// First-run nudge: gently point new users at the picker (no geolocation). Shows
// only when no state is set and the user hasn't engaged with the picker before.
const NUDGE_KEY = 'nps:locNudgeSeen'
function readSeen() {
  try {
    return localStorage.getItem(NUDGE_KEY) === '1'
  } catch {
    return true
  }
}
const nudgeSeen = ref(readSeen())
function dismissNudge() {
  if (nudgeSeen.value) return
  nudgeSeen.value = true
  try {
    localStorage.setItem(NUDGE_KEY, '1')
  } catch {
    // ignore disabled storage
  }
}
const showNudge = computed(() => !location.value && !nudgeSeen.value && !open.value)

const visible = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return US_STATES
  return US_STATES.filter(
    ([code, name]) => name.toLowerCase().includes(q) || code.toLowerCase() === q,
  )
})

function toggle() {
  open.value = !open.value
  if (open.value) {
    dismissNudge()
    // Open straight to the county step if a state is already chosen.
    if (location.value) {
      level.value = 'county'
      loadCounties(location.value)
    } else {
      level.value = 'state'
    }
  }
}
function close() {
  open.value = false
}
// Pick a state. "All states" (null) clears everything and closes; a real state
// advances to the county step so the user can optionally narrow further.
function choose(code) {
  dismissNudge()
  if (!code) {
    setLocation(null)
    return close()
  }
  setLocation(code)
  level.value = 'county'
  search.value = ''
  loadCounties(code)
  nextTick(() => inputEl.value?.focus())
}
function chooseCounty(c) {
  setCounty({ fips: c.fips, name: c.name, state: location.value })
  close()
}
function chooseAllCounties() {
  clearCounty()
  close()
}
function backToStates() {
  level.value = 'state'
  search.value = ''
  nextTick(() => inputEl.value?.focus())
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
    level.value = 'state'
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
      :class="{ set: location, nudging: showNudge }"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="toggle"
    >
      <span class="lp-pin" aria-hidden="true">📍</span>
      <span class="lp-label">{{ locationName || 'All states' }}</span>
      <span class="lp-caret" aria-hidden="true">▾</span>
    </button>

    <div v-if="showNudge" class="lp-nudge" role="status">
      <button type="button" class="lp-nudge-body" @click="toggle">
        Set your state to see what's native to you
      </button>
      <button type="button" class="lp-nudge-x" aria-label="Dismiss" @click="dismissNudge">✕</button>
    </div>

    <!-- State level -->
    <div v-if="open && level === 'state'" class="lp-panel" role="listbox" aria-label="Set your state">
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
          >{{ name }}<span class="lp-chev" aria-hidden="true">›</span></button>
        </li>
        <li v-if="!visible.length" class="lp-empty">No matches</li>
      </ul>
    </div>

    <!-- County level -->
    <div v-else-if="open" class="lp-panel" role="listbox" :aria-label="`Set a county in ${currentStateName}`">
      <button type="button" class="lp-back" @click="backToStates">‹ {{ currentStateName }}</button>
      <div class="lp-search">
        <input
          ref="inputEl"
          type="search"
          v-model="search"
          placeholder="Search counties…"
          aria-label="Search counties"
        />
      </div>
      <ul class="lp-opts">
        <li v-if="!search.trim()">
          <button
            type="button"
            class="lp-opt"
            :class="{ active: !county }"
            @click="chooseAllCounties"
          >All of {{ currentStateName }}</button>
        </li>
        <li v-if="countiesLoading" class="lp-empty">Loading counties…</li>
        <li v-else-if="!counties.length" class="lp-empty">No county data for {{ currentStateName }}</li>
        <li v-for="c in visibleCounties" :key="c.fips">
          <button
            type="button"
            class="lp-opt"
            :class="{ active: county && county.fips === c.fips }"
            @click="chooseCounty(c)"
          >{{ c.name }}</button>
        </li>
        <li v-if="counties.length && !visibleCounties.length" class="lp-empty">No matches</li>
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
.lp-trigger.nudging { animation: lp-pulse 2s ease-in-out infinite; }
@keyframes lp-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(232, 195, 74, 0); }
  50% { box-shadow: 0 0 0 4px rgba(232, 195, 74, 0.4); }
}
@media (prefers-reduced-motion: reduce) {
  .lp-trigger.nudging { animation: none; }
}
.lp-pin { font-size: 12px; }
.lp-caret { font-size: 10px; opacity: 0.8; }

.lp-nudge {
  position: absolute;
  top: calc(100% + 9px);
  left: 0;
  z-index: 19;
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--card);
  color: var(--ink);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.22);
  padding: 1px 2px 1px 2px;
  white-space: nowrap;
  animation: lp-fade 0.3s ease;
}
@keyframes lp-fade {
  from { opacity: 0; transform: translateY(-3px); }
  to { opacity: 1; transform: none; }
}
.lp-nudge::before {
  content: '';
  position: absolute;
  top: -5px;
  left: 16px;
  width: 9px;
  height: 9px;
  background: var(--card);
  border-left: 1px solid var(--border);
  border-top: 1px solid var(--border);
  transform: rotate(45deg);
}
.lp-nudge-body {
  background: none;
  border: none;
  font: inherit;
  font-size: 12.5px;
  color: var(--ink);
  cursor: pointer;
  padding: 6px 6px;
  border-radius: 5px;
}
.lp-nudge-body:hover { color: var(--accent); }
.lp-nudge-x {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--ink-soft);
  font-size: 11px;
  padding: 6px 8px;
  border-radius: 5px;
  line-height: 1;
}
.lp-nudge-x:hover { color: var(--ink); background: var(--accent-soft); }
@media (max-width: 800px) {
  .lp-nudge { white-space: normal; max-width: 210px; }
}

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
.lp-back {
  background: none;
  border: none;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
  cursor: pointer;
  padding: 2px 6px 6px;
  text-align: left;
}
.lp-back:hover { text-decoration: underline; }
.lp-chev { float: right; color: var(--ink-soft); }
.lp-opt.active .lp-chev { color: var(--accent); }
</style>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  options: { type: Array, required: true },
  selected: { type: Array, required: true },
  labelFor: { type: Function, default: (v) => String(v) },
  searchThreshold: { type: Number, default: 12 },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['toggle', 'clear'])

const open = ref(false)
const search = ref('')
const rootEl = ref(null)
const inputEl = ref(null)

const selectedSet = computed(() => new Set(props.selected))
const showSearch = computed(() => props.options.length > props.searchThreshold)
const visibleOptions = computed(() => {
  if (!showSearch.value || !search.value.trim()) return props.options
  const q = search.value.trim().toLowerCase()
  return props.options.filter((v) => props.labelFor(v).toLowerCase().includes(q))
})

const summary = computed(() => {
  const n = props.selected.length
  if (n === 0) return 'Any'
  if (n === 1) return props.labelFor(props.selected[0])
  if (n <= 2) return props.selected.map(props.labelFor).join(', ')
  return `${n} selected`
})

function toggleOpen() {
  if (props.disabled) return
  open.value = !open.value
}
function close() {
  open.value = false
}
function onDocClick(e) {
  if (!open.value) return
  if (rootEl.value && !rootEl.value.contains(e.target)) close()
}
function onKey(e) {
  if (e.key === 'Escape' && open.value) close()
}

watch(open, async (v) => {
  if (v && showSearch.value) {
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
  <div class="ms" ref="rootEl">
    <button
      type="button"
      class="trigger"
      :class="{ open, has: selected.length > 0 }"
      :aria-expanded="open"
      :disabled="disabled"
      @click="toggleOpen"
    >
      <span class="summary">{{ summary }}</span>
      <span v-if="selected.length" class="count">{{ selected.length }}</span>
      <span class="caret" aria-hidden="true">▾</span>
    </button>
    <div v-if="open" class="panel" role="listbox">
      <div v-if="showSearch" class="search-row">
        <input
          ref="inputEl"
          type="search"
          v-model="search"
          :placeholder="`Search ${title.toLowerCase()}…`"
        />
      </div>
      <div class="actions" v-if="selected.length">
        <button type="button" class="link" @click="emit('clear')">Clear ({{ selected.length }})</button>
      </div>
      <ul class="opts">
        <li v-for="val in visibleOptions" :key="val">
          <label class="opt">
            <input
              type="checkbox"
              :checked="selectedSet.has(val)"
              @change="emit('toggle', val)"
            />
            <span>{{ labelFor(val) }}</span>
          </label>
        </li>
        <li v-if="!visibleOptions.length" class="empty">No matches</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.ms { position: relative; }
.trigger {
  width: 100%;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 7px 10px;
  font: inherit;
  font-size: 13px;
  color: var(--ink);
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  text-align: left;
}
.trigger:hover { border-color: var(--accent); }
.trigger:disabled { opacity: 0.5; cursor: not-allowed; background: var(--bg); }
.trigger:disabled:hover { border-color: var(--border); }
.trigger.open { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-soft); }
.trigger.has .summary { font-weight: 500; }
.summary { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.count {
  background: var(--accent);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  border-radius: 999px;
  padding: 1px 7px;
}
.caret { color: var(--ink-soft); font-size: 11px; }
.panel {
  position: absolute;
  z-index: 10;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  padding: 6px;
  max-height: 280px;
  display: flex;
  flex-direction: column;
}
.search-row { padding: 4px; }
.search-row input {
  width: 100%;
  font: inherit;
  font-size: 13px;
  padding: 5px 8px;
  border: 1px solid var(--border);
  border-radius: 5px;
  box-sizing: border-box;
}
.actions { padding: 2px 6px 4px; }
.link {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 12px;
  padding: 0;
  cursor: pointer;
}
.link:hover { text-decoration: underline; }
.opts {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
}
.opt {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}
.opt:hover { background: var(--accent-soft); }
.opt input { margin: 0; }
.empty { padding: 8px; color: var(--ink-soft); font-size: 13px; text-align: center; }
</style>

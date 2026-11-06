<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { StickyNote, Trash2, Check, Sparkles } from 'lucide-vue-next'

type NoteColor = 'amber' | 'emerald' | 'rose' | 'purple' | 'glass'

const NOTE_STORAGE_KEY = 'tabloom_sticky_note'
const COLOR_STORAGE_KEY = 'tabloom_sticky_note_color'

const noteText = ref('')
const selectedColor = ref<NoteColor>('amber')
const saveStatus = ref<'saved' | 'saving' | 'idle'>('idle')
const isConfirmingClear = ref(false)
let debounceTimeout: number | undefined

const COLOR_THEMES: Record<NoteColor, {
  card: string
  textarea: string
  dot: string
  accent: string
}> = {
  amber: {
    card: 'border-amber-400/25 bg-amber-500/[0.10] shadow-amber-950/20',
    textarea: 'text-amber-100 placeholder-amber-200/30 selection:bg-amber-400/30',
    dot: 'bg-amber-400',
    accent: 'text-amber-300',
  },
  emerald: {
    card: 'border-emerald-400/25 bg-emerald-500/[0.10] shadow-emerald-950/20',
    textarea: 'text-emerald-100 placeholder-emerald-200/30 selection:bg-emerald-400/30',
    dot: 'bg-emerald-400',
    accent: 'text-emerald-300',
  },
  rose: {
    card: 'border-rose-400/25 bg-rose-500/[0.10] shadow-rose-950/20',
    textarea: 'text-rose-100 placeholder-rose-200/30 selection:bg-rose-400/30',
    dot: 'bg-rose-400',
    accent: 'text-rose-300',
  },
  purple: {
    card: 'border-purple-400/25 bg-purple-500/[0.10] shadow-purple-950/20',
    textarea: 'text-purple-100 placeholder-purple-200/30 selection:bg-purple-400/30',
    dot: 'bg-purple-400',
    accent: 'text-purple-300',
  },
  glass: {
    card: 'border-white/10 bg-white/[0.06] shadow-black/20',
    textarea: 'text-white placeholder-white/30 selection:bg-white/20',
    dot: 'bg-white/70',
    accent: 'text-white/80',
  },
}

const currentTheme = computed(() => COLOR_THEMES[selectedColor.value])

async function loadNote() {
  if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
    try {
      const res = await new Promise<{ [k: string]: any }>((resolve) => {
        chrome.storage.sync.get([NOTE_STORAGE_KEY, COLOR_STORAGE_KEY], (items) => {
          resolve(items || {})
        })
      })
      if (res && typeof res[NOTE_STORAGE_KEY] === 'string') {
        noteText.value = res[NOTE_STORAGE_KEY]
      }
      if (res && res[COLOR_STORAGE_KEY] && COLOR_THEMES[res[COLOR_STORAGE_KEY] as NoteColor]) {
        selectedColor.value = res[COLOR_STORAGE_KEY] as NoteColor
      }
      return
    } catch {}
  }

  const localText = localStorage.getItem(NOTE_STORAGE_KEY)
  if (localText !== null) noteText.value = localText

  const localColor = localStorage.getItem(COLOR_STORAGE_KEY) as NoteColor
  if (localColor && COLOR_THEMES[localColor]) selectedColor.value = localColor
}

function saveNote() {
  saveStatus.value = 'saving'
  const text = noteText.value.slice(0, 5000)
  const color = selectedColor.value

  try {
    localStorage.setItem(NOTE_STORAGE_KEY, text)
    localStorage.setItem(COLOR_STORAGE_KEY, color)
  } catch {}

  if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
    try {
      chrome.storage.sync.set({
        [NOTE_STORAGE_KEY]: text,
        [COLOR_STORAGE_KEY]: color,
      }, () => {
        saveStatus.value = 'saved'
        setTimeout(() => {
          if (saveStatus.value === 'saved') saveStatus.value = 'idle'
        }, 1500)
      })
      return
    } catch {}
  }

  saveStatus.value = 'saved'
  setTimeout(() => {
    if (saveStatus.value === 'saved') saveStatus.value = 'idle'
  }, 1500)
}

function onInput() {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  saveStatus.value = 'saving'
  debounceTimeout = window.setTimeout(saveNote, 300)
}

function changeColor(color: NoteColor) {
  selectedColor.value = color
  saveNote()
}

function clearNote() {
  if (!isConfirmingClear.value && noteText.value.trim().length > 0) {
    isConfirmingClear.value = true
    setTimeout(() => {
      isConfirmingClear.value = false
    }, 3000)
    return
  }
  noteText.value = ''
  isConfirmingClear.value = false
  saveNote()
}

onMounted(() => {
  loadNote()

  // Real-time listener for cross-device sync
  if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' || area === 'local') {
        if (changes[NOTE_STORAGE_KEY] && typeof changes[NOTE_STORAGE_KEY].newValue === 'string') {
          noteText.value = changes[NOTE_STORAGE_KEY].newValue
        }
        if (changes[COLOR_STORAGE_KEY] && COLOR_THEMES[changes[COLOR_STORAGE_KEY].newValue as NoteColor]) {
          selectedColor.value = changes[COLOR_STORAGE_KEY].newValue as NoteColor
        }
      }
    })
  }
})

onUnmounted(() => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
})
</script>

<template>
  <div
    class="gpu-card group relative flex flex-col rounded-2xl border p-4 shadow-xl backdrop-blur-xl transition-all duration-300"
    :class="currentTheme.card"
  >
    <!-- Note Header -->
    <div class="flex items-center justify-between pb-2">
      <div class="flex items-center gap-1.5">
        <StickyNote class="h-3.5 w-3.5" :class="currentTheme.accent" />
        <span class="text-xs font-semibold tracking-wide" :class="currentTheme.accent">
          Sticky Note
        </span>
      </div>

      <!-- Action items: Color dots & Clear button -->
      <div class="flex items-center gap-1.5">
        <!-- Status indicator -->
        <span
          v-if="saveStatus === 'saved'"
          class="flex items-center gap-0.5 text-[10px] text-emerald-400 transition-opacity"
        >
          <Check class="h-3 w-3" />
        </span>
        <span
          v-else-if="saveStatus === 'saving'"
          class="text-[10px] text-white/40 animate-pulse"
        >
          saving...
        </span>

        <!-- Color pickers -->
        <div class="flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <button
            v-for="(theme, key) in COLOR_THEMES"
            :key="key"
            type="button"
            :aria-label="`Color ${key}`"
            class="h-2.5 w-2.5 rounded-full transition-transform hover:scale-125"
            :class="[
              theme.dot,
              selectedColor === key ? 'ring-1 ring-white/80 scale-110' : 'opacity-60 hover:opacity-100',
            ]"
            @click="changeColor(key)"
          />
        </div>

        <!-- Clear / Trash button -->
        <button
          v-if="noteText.length > 0"
          type="button"
          :title="isConfirmingClear ? 'Click again to confirm clear' : 'Clear note'"
          class="rounded p-1 text-white/40 transition-colors hover:bg-rose-500/20 hover:text-rose-300"
          :class="{ 'text-rose-400 bg-rose-500/20': isConfirmingClear }"
          @click="clearNote"
        >
          <Trash2 class="h-3 w-3" />
        </button>
      </div>
    </div>

    <!-- Note Textarea -->
    <textarea
      v-model="noteText"
      maxlength="5000"
      placeholder="Jot down quick thoughts, tasks, or reminders..."
      rows="6"
      class="w-full resize-none bg-transparent text-xs leading-relaxed outline-none transition-colors scrollbar-thin"
      :class="currentTheme.textarea"
      @input="onInput"
    />

    <!-- Footer: Character count / Hint -->
    <div class="flex items-center justify-between pt-1.5 text-[10px] text-white/30">
      <span v-if="isConfirmingClear" class="text-rose-400 font-medium">Click trash again to clear</span>
      <span v-else class="flex items-center gap-1">
        <Sparkles class="h-2.5 w-2.5 text-white/20" /> Auto-syncs
      </span>
      <span>{{ noteText.length }} / 5000</span>
    </div>
  </div>
</template>

<style scoped>
textarea {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}
</style>

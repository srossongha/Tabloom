<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { FileText, Trash2, Check } from 'lucide-vue-next'

type NoteColor = 'amber' | 'emerald' | 'rose' | 'purple' | 'glass'

const NOTE_STORAGE_KEY = 'tabloom_sticky_note'
const COLOR_STORAGE_KEY = 'tabloom_sticky_note_color'

const noteText = ref('')
const selectedColor = ref<NoteColor>('amber')
const saveStatus = ref<'saved' | 'saving' | 'idle'>('idle')
const isConfirmingClear = ref(false)
let debounceTimeout: number | undefined
let resetStatusTimeout: number | undefined

const COLOR_THEMES: Record<
  NoteColor,
  {
    card: string
    textarea: string
    dot: string
    accent: string
    name: string
  }
> = {
  amber: {
    card: 'border-amber-400/20 bg-amber-500/[0.05] hover:border-amber-400/35 hover:bg-amber-500/[0.08]',
    textarea: 'text-amber-100/90 placeholder-amber-200/25 selection:bg-amber-400/30',
    dot: 'bg-amber-400',
    accent: 'text-amber-300/80',
    name: 'Warm Sepia',
  },
  emerald: {
    card: 'border-emerald-400/20 bg-emerald-500/[0.05] hover:border-emerald-400/35 hover:bg-emerald-500/[0.08]',
    textarea: 'text-emerald-100/90 placeholder-emerald-200/25 selection:bg-emerald-400/30',
    dot: 'bg-emerald-400',
    accent: 'text-emerald-300/80',
    name: 'Sage Emerald',
  },
  rose: {
    card: 'border-rose-400/20 bg-rose-500/[0.05] hover:border-rose-400/35 hover:bg-rose-500/[0.08]',
    textarea: 'text-rose-100/90 placeholder-rose-200/25 selection:bg-rose-400/30',
    dot: 'bg-rose-400',
    accent: 'text-rose-300/80',
    name: 'Blush Rose',
  },
  purple: {
    card: 'border-purple-400/20 bg-purple-500/[0.05] hover:border-purple-400/35 hover:bg-purple-500/[0.08]',
    textarea: 'text-purple-100/90 placeholder-purple-200/25 selection:bg-purple-400/30',
    dot: 'bg-purple-400',
    accent: 'text-purple-300/80',
    name: 'Lavender Mist',
  },
  glass: {
    card: 'border-white/[0.08] bg-white/[0.04] hover:border-white/15 hover:bg-white/[0.07]',
    textarea: 'text-white/90 placeholder-white/25 selection:bg-white/20',
    dot: 'bg-white/70',
    accent: 'text-white/60',
    name: 'Frosted Glass',
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
      chrome.storage.sync.set(
        {
          [NOTE_STORAGE_KEY]: text,
          [COLOR_STORAGE_KEY]: color,
        },
        () => {
          saveStatus.value = 'saved'
          if (resetStatusTimeout) clearTimeout(resetStatusTimeout)
          resetStatusTimeout = window.setTimeout(() => {
            if (saveStatus.value === 'saved') saveStatus.value = 'idle'
          }, 1500)
        }
      )
      return
    } catch {}
  }

  saveStatus.value = 'saved'
  if (resetStatusTimeout) clearTimeout(resetStatusTimeout)
  resetStatusTimeout = window.setTimeout(() => {
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
        if (
          changes[COLOR_STORAGE_KEY] &&
          COLOR_THEMES[changes[COLOR_STORAGE_KEY].newValue as NoteColor]
        ) {
          selectedColor.value = changes[COLOR_STORAGE_KEY].newValue as NoteColor
        }
      }
    })
  }
})

onUnmounted(() => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  if (resetStatusTimeout) clearTimeout(resetStatusTimeout)
})
</script>

<template>
  <div
    class="gpu-card group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-4 shadow-lg shadow-black/20 backdrop-blur-xl transition-all duration-300"
    :class="currentTheme.card"
  >
    <!-- Note Header -->
    <div class="flex items-center justify-between pb-2 select-none">
      <div class="flex items-center gap-1.5">
        <FileText class="h-3.5 w-3.5 transition-colors" :class="currentTheme.accent" />
        <span class="text-[11px] font-medium tracking-wider uppercase text-white/50">
          Notes
        </span>
      </div>

      <!-- Action items: Color dots & Clear button (revealed smoothly on hover) -->
      <div class="flex items-center gap-1.5">
        <!-- Minimal status dot indicator -->
        <span
          v-if="saveStatus === 'saved'"
          class="flex items-center text-emerald-400 transition-opacity duration-300"
          title="Synced"
        >
          <Check class="h-3 w-3" />
        </span>
        <span
          v-else-if="saveStatus === 'saving'"
          class="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"
          title="Saving..."
        />

        <!-- Color pickers -->
        <div class="flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <button
            v-for="(theme, key) in COLOR_THEMES"
            :key="key"
            type="button"
            :title="theme.name"
            :aria-label="theme.name"
            class="h-2.5 w-2.5 rounded-full transition-all hover:scale-125"
            :class="[
              theme.dot,
              selectedColor === key ? 'ring-1 ring-white/90 scale-110' : 'opacity-50 hover:opacity-100',
            ]"
            @click="changeColor(key)"
          />
        </div>

        <!-- Clear / Trash button -->
        <button
          v-if="noteText.length > 0"
          type="button"
          :title="isConfirmingClear ? 'Click again to confirm clear' : 'Clear note'"
          class="rounded p-1 text-white/40 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-rose-500/20 hover:text-rose-300"
          :class="{ 'opacity-100 text-rose-400 bg-rose-500/20': isConfirmingClear }"
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
      placeholder="Write a quick thought, task, or reminder..."
      rows="5"
      class="w-full resize-none bg-transparent text-xs leading-relaxed outline-none transition-colors scrollbar-none font-normal"
      :class="currentTheme.textarea"
      @input="onInput"
    />

    <!-- Quiet Footer: Only show confirmation when clearing, or faint char count on hover -->
    <div
      v-if="isConfirmingClear"
      class="pt-1.5 text-center text-[11px] font-medium text-rose-400 animate-pulse select-none"
    >
      Click trash again to confirm clear
    </div>
    <div
      v-else-if="noteText.length > 0"
      class="flex justify-end pt-1 text-[10px] text-white/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100 select-none"
    >
      <span>{{ noteText.length }} / 5000</span>
    </div>
  </div>
</template>

<style scoped>
textarea {
  scrollbar-width: none;
}
textarea::-webkit-scrollbar {
  display: none;
}
</style>

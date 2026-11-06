<!--
  StickyNoteWidget component providing multi-note management with clean animated transitions
  and free-form drag-and-drop placement across the viewport with position persistence.
-->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  GripHorizontal,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Check,
  RotateCcw,
} from 'lucide-vue-next'

export type NoteColor = 'amber' | 'emerald' | 'rose' | 'purple' | 'glass'

export interface StickyNoteItem {
  id: string
  text: string
  color: NoteColor
  updatedAt: number
}

interface Position {
  x: number
  y: number
}

const STORAGE_NOTES_KEY = 'tabloom_sticky_notes'
const STORAGE_POS_KEY = 'tabloom_sticky_note_pos'
const LEGACY_NOTE_KEY = 'tabloom_sticky_note'
const LEGACY_COLOR_KEY = 'tabloom_sticky_note_color'

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

function createDefaultNote(color: NoteColor = 'amber'): StickyNoteItem {
  return {
    id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    text: '',
    color,
    updatedAt: Date.now(),
  }
}

// --- State ---
const notes = ref<StickyNoteItem[]>([createDefaultNote()])
const activeIndex = ref(0)
const transitionDirection = ref<'next' | 'prev'>('next')
const saveStatus = ref<'saved' | 'saving' | 'idle'>('idle')
const isConfirmingDelete = ref(false)

// Dragging position state
const customPos = ref<Position | null>(null)
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const cardRef = ref<HTMLElement | null>(null)

let debounceTimeout: number | undefined
let resetStatusTimeout: number | undefined

const activeNote = computed(() => {
  return notes.value[activeIndex.value] || notes.value[0]
})

const currentTheme = computed(() => {
  return COLOR_THEMES[activeNote.value?.color || 'amber']
})

// --- Storage & Loading ---
async function loadData() {
  let loadedNotes: StickyNoteItem[] | null = null
  let loadedPos: Position | null = null

  // 1. Try chrome.storage.sync
  if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
    try {
      const res = await new Promise<{ [k: string]: any }>((resolve) => {
        chrome.storage.sync.get(
          [STORAGE_NOTES_KEY, STORAGE_POS_KEY, LEGACY_NOTE_KEY, LEGACY_COLOR_KEY],
          (items) => resolve(items || {})
        )
      })

      if (res[STORAGE_NOTES_KEY] && Array.isArray(res[STORAGE_NOTES_KEY])) {
        loadedNotes = res[STORAGE_NOTES_KEY]
      } else if (res[LEGACY_NOTE_KEY] && typeof res[LEGACY_NOTE_KEY] === 'string') {
        // Migrate legacy single note
        loadedNotes = [
          {
            id: 'note_legacy',
            text: res[LEGACY_NOTE_KEY],
            color: (res[LEGACY_COLOR_KEY] as NoteColor) || 'amber',
            updatedAt: Date.now(),
          },
        ]
      }

      if (
        res[STORAGE_POS_KEY] &&
        typeof res[STORAGE_POS_KEY].x === 'number' &&
        typeof res[STORAGE_POS_KEY].y === 'number'
      ) {
        loadedPos = res[STORAGE_POS_KEY]
      }
    } catch {}
  }

  // 2. Fallback to localStorage
  if (!loadedNotes) {
    try {
      const localStr = localStorage.getItem(STORAGE_NOTES_KEY)
      if (localStr) {
        const parsed = JSON.parse(localStr)
        if (Array.isArray(parsed) && parsed.length > 0) loadedNotes = parsed
      }
    } catch {}

    // Legacy fallback
    if (!loadedNotes) {
      const legacyText = localStorage.getItem(LEGACY_NOTE_KEY)
      if (legacyText !== null) {
        const legacyColor =
          (localStorage.getItem(LEGACY_COLOR_KEY) as NoteColor) || 'amber'
        loadedNotes = [
          {
            id: 'note_legacy',
            text: legacyText,
            color: legacyColor,
            updatedAt: Date.now(),
          },
        ]
      }
    }
  }

  if (!loadedPos) {
    try {
      const localPosStr = localStorage.getItem(STORAGE_POS_KEY)
      if (localPosStr) loadedPos = JSON.parse(localPosStr)
    } catch {}
  }

  if (loadedNotes && loadedNotes.length > 0) {
    notes.value = loadedNotes
    activeIndex.value = 0
  }

  if (loadedPos) {
    customPos.value = clampPosition(loadedPos)
  }
}

function persistNotes() {
  saveStatus.value = 'saving'
  const payload = JSON.parse(JSON.stringify(notes.value))

  try {
    localStorage.setItem(STORAGE_NOTES_KEY, JSON.stringify(payload))
  } catch {}

  if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
    try {
      chrome.storage.sync.set({ [STORAGE_NOTES_KEY]: payload }, () => {
        saveStatus.value = 'saved'
        if (resetStatusTimeout) clearTimeout(resetStatusTimeout)
        resetStatusTimeout = window.setTimeout(() => {
          if (saveStatus.value === 'saved') saveStatus.value = 'idle'
        }, 1500)
      })
      return
    } catch {}
  }

  saveStatus.value = 'saved'
  if (resetStatusTimeout) clearTimeout(resetStatusTimeout)
  resetStatusTimeout = window.setTimeout(() => {
    if (saveStatus.value === 'saved') saveStatus.value = 'idle'
  }, 1500)
}

function persistPosition(pos: Position | null) {
  try {
    if (pos) localStorage.setItem(STORAGE_POS_KEY, JSON.stringify(pos))
    else localStorage.removeItem(STORAGE_POS_KEY)
  } catch {}

  if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
    try {
      if (pos) chrome.storage.sync.set({ [STORAGE_POS_KEY]: pos })
      else chrome.storage.sync.remove(STORAGE_POS_KEY)
    } catch {}
  }
}

function onInput() {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  saveStatus.value = 'saving'
  if (activeNote.value) {
    activeNote.value.updatedAt = Date.now()
  }
  debounceTimeout = window.setTimeout(persistNotes, 300)
}

function changeColor(color: NoteColor) {
  if (!activeNote.value) return
  activeNote.value.color = color
  activeNote.value.updatedAt = Date.now()
  persistNotes()
}

// --- Navigation & Note Management ---
function addNote() {
  transitionDirection.value = 'next'
  const newNote = createDefaultNote(activeNote.value?.color || 'amber')
  notes.value.push(newNote)
  activeIndex.value = notes.value.length - 1
  persistNotes()
}

function prevNote() {
  if (activeIndex.value > 0) {
    transitionDirection.value = 'prev'
    activeIndex.value--
    isConfirmingDelete.value = false
  }
}

function nextNote() {
  if (activeIndex.value < notes.value.length - 1) {
    transitionDirection.value = 'next'
    activeIndex.value++
    isConfirmingDelete.value = false
  }
}

function deleteCurrentNote() {
  if (!isConfirmingDelete.value) {
    isConfirmingDelete.value = true
    setTimeout(() => {
      isConfirmingDelete.value = false
    }, 3000)
    return
  }

  isConfirmingDelete.value = false

  if (notes.value.length > 1) {
    transitionDirection.value = 'prev'
    notes.value.splice(activeIndex.value, 1)
    if (activeIndex.value >= notes.value.length) {
      activeIndex.value = notes.value.length - 1
    }
  } else {
    // Single note: clear text
    notes.value[0].text = ''
    notes.value[0].updatedAt = Date.now()
  }
  persistNotes()
}

// --- Free Drag & Drop Placement ---
function clampPosition(pos: Position): Position {
  const cardWidth = cardRef.value?.offsetWidth || 230
  const cardHeight = cardRef.value?.offsetHeight || 190
  const pad = 12

  const maxX = Math.max(pad, window.innerWidth - cardWidth - pad)
  const maxY = Math.max(pad, window.innerHeight - cardHeight - pad)

  return {
    x: Math.min(maxX, Math.max(pad, pos.x)),
    y: Math.min(maxY, Math.max(pad, pos.y)),
  }
}

function onHeaderPointerDown(e: PointerEvent) {
  // Prevent drag if clicking on interactive buttons/inputs
  const target = e.target as HTMLElement
  if (target.closest('button') || target.closest('input') || target.closest('textarea')) {
    return
  }

  const rect = cardRef.value?.getBoundingClientRect()
  if (!rect) return

  isDragging.value = true
  dragOffset.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  }

  // If not previously custom-positioned, initialize with current rendered screen position
  if (!customPos.value) {
    customPos.value = {
      x: rect.left,
      y: rect.top,
    }
  }

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  e.preventDefault()
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value) return
  const rawX = e.clientX - dragOffset.value.x
  const rawY = e.clientY - dragOffset.value.y
  customPos.value = clampPosition({ x: rawX, y: rawY })
}

function onPointerUp() {
  if (!isDragging.value) return
  isDragging.value = false
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)

  if (customPos.value) {
    persistPosition(customPos.value)
  }
}

function resetPosition() {
  customPos.value = null
  persistPosition(null)
}

function onWindowResize() {
  if (customPos.value) {
    customPos.value = clampPosition(customPos.value)
  }
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', onWindowResize, { passive: true })

  // Cross-device sync listener
  if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' || area === 'local') {
        if (changes[STORAGE_NOTES_KEY]?.newValue) {
          notes.value = changes[STORAGE_NOTES_KEY].newValue as StickyNoteItem[]
          if (activeIndex.value >= notes.value.length) {
            activeIndex.value = Math.max(0, notes.value.length - 1)
          }
        }
        if (changes[STORAGE_POS_KEY]) {
          customPos.value = (changes[STORAGE_POS_KEY].newValue as Position) || null
        }
      }
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  if (debounceTimeout) clearTimeout(debounceTimeout)
  if (resetStatusTimeout) clearTimeout(resetStatusTimeout)
})
</script>

<template>
  <div
    ref="cardRef"
    class="gpu-card group flex flex-col justify-between overflow-hidden rounded-2xl border p-4 shadow-lg shadow-black/20 backdrop-blur-xl transition-[border-color,background-color,box-shadow] duration-300 select-none"
    :class="[
      currentTheme.card,
      customPos ? 'fixed z-30 w-56 xl:w-60' : 'relative z-20 w-full',
      isDragging ? 'shadow-2xl ring-1 ring-white/20 scale-[1.02] cursor-grabbing' : '',
    ]"
    :style="
      customPos
        ? {
            left: `${customPos.x}px`,
            top: `${customPos.y}px`,
            margin: 0,
          }
        : undefined
    "
  >
    <!-- Note Header (Draggable Handle) -->
    <div
      class="flex items-center justify-between pb-2 cursor-grab active:cursor-grabbing border-b border-white/[0.05]"
      title="Click & hold to drag and place anywhere on screen"
      @pointerdown="onHeaderPointerDown"
    >
      <!-- Left: Grip & Pagination Controls -->
      <div class="flex items-center gap-1.5">
        <GripHorizontal
          class="h-3.5 w-3.5 text-white/30 transition-colors group-hover:text-white/60"
        />

        <span class="text-[11px] font-medium tracking-wider uppercase text-white/50">
          Notes
        </span>

        <!-- Note Counter & Navigation -->
        <div class="flex items-center gap-0.5 rounded-full bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/60">
          <button
            type="button"
            :disabled="activeIndex === 0"
            title="Previous note"
            aria-label="Previous note"
            class="rounded p-0.5 transition-colors hover:text-white disabled:opacity-25 disabled:hover:text-white/60"
            @click.stop="prevNote"
          >
            <ChevronLeft class="h-3 w-3" />
          </button>

          <span class="px-0.5 font-mono text-[10px] font-medium text-white/80">
            {{ activeIndex + 1 }}/{{ notes.length }}
          </span>

          <button
            type="button"
            :disabled="activeIndex === notes.length - 1"
            title="Next note"
            aria-label="Next note"
            class="rounded p-0.5 transition-colors hover:text-white disabled:opacity-25 disabled:hover:text-white/60"
            @click.stop="nextNote"
          >
            <ChevronRight class="h-3 w-3" />
          </button>
        </div>

        <!-- Add New Note Button (+) -->
        <button
          type="button"
          title="Add new sticker note"
          aria-label="Add new note"
          class="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.06] text-white/60 transition-all hover:scale-105 hover:bg-emerald-500/20 hover:text-emerald-300"
          @click.stop="addNote"
        >
          <Plus class="h-3 w-3" />
        </button>
      </div>

      <!-- Right: Status, Color Palette & Actions (reveal smoothly on hover) -->
      <div class="flex items-center gap-1.5">
        <!-- Status indicator -->
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

        <!-- Reset position button (visible if dragged away from default) -->
        <button
          v-if="customPos"
          type="button"
          title="Snap back to default dock position"
          class="rounded p-1 text-white/40 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-white/10 hover:text-white"
          @click.stop="resetPosition"
        >
          <RotateCcw class="h-3 w-3" />
        </button>

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
              activeNote.color === key
                ? 'ring-1 ring-white/90 scale-110'
                : 'opacity-50 hover:opacity-100',
            ]"
            @click.stop="changeColor(key)"
          />
        </div>

        <!-- Clear / Delete note button -->
        <button
          type="button"
          :title="
            isConfirmingDelete
              ? 'Click again to confirm delete'
              : notes.length > 1
              ? 'Delete this sticker note'
              : 'Clear note'
          "
          class="rounded p-1 text-white/40 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-rose-500/20 hover:text-rose-300"
          :class="{ 'opacity-100 text-rose-400 bg-rose-500/20': isConfirmingDelete }"
          @click.stop="deleteCurrentNote"
        >
          <Trash2 class="h-3 w-3" />
        </button>
      </div>
    </div>

    <!-- Note Textarea with Clean Slide/Fade Motion on Note Change -->
    <div class="relative overflow-hidden pt-2.5">
      <Transition :name="`note-slide-${transitionDirection}`" mode="out-in">
        <textarea
          :key="activeNote.id"
          v-model="activeNote.text"
          maxlength="5000"
          placeholder="Write a quick thought, task, or reminder..."
          rows="5"
          class="w-full resize-none bg-transparent text-xs leading-relaxed outline-none transition-colors scrollbar-none font-normal"
          :class="currentTheme.textarea"
          @input="onInput"
        />
      </Transition>
    </div>

    <!-- Quiet Footer -->
    <div
      v-if="isConfirmingDelete"
      class="pt-1 text-center text-[11px] font-medium text-rose-400 animate-pulse select-none"
    >
      {{ notes.length > 1 ? 'Click trash again to delete note' : 'Click trash again to clear text' }}
    </div>
    <div
      v-else-if="activeNote.text.length > 0"
      class="flex justify-end pt-1 text-[10px] text-white/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100 select-none"
    >
      <span>{{ activeNote.text.length }} / 5000</span>
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

/* Clean Motion: Slide & Fade when changing to new/previous sticker note */
.note-slide-next-enter-active,
.note-slide-next-leave-active,
.note-slide-prev-enter-active,
.note-slide-prev-leave-active {
  transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.note-slide-next-enter-from {
  opacity: 0;
  transform: translateX(14px);
}
.note-slide-next-leave-to {
  opacity: 0;
  transform: translateX(-14px);
}

.note-slide-prev-enter-from {
  opacity: 0;
  transform: translateX(-14px);
}
.note-slide-prev-leave-to {
  opacity: 0;
  transform: translateX(14px);
}
</style>

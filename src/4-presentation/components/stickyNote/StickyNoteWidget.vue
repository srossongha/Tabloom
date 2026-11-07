<!--
  StickyNoteWidget: Authentic physical sticky notes (Post-it notes)
  - Features a Main Sticker Pad in the side dock with stacked paper sheets.
  - Notes can be peeled directly from the main pad and stuck ANYWHERE across the desktop.
  - Zero rounded corners: all sticky notes have crisp, sharp 90-degree corners (rounded-none).
  - Robust auto-recovery ensures previous and legacy notes are never lost.
-->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import {
  GripHorizontal,
  Plus,
  Trash2,
  Check,
  PinOff,
  Copy,
  Layers,
  Sparkles,
} from 'lucide-vue-next'

export type NoteColor = 'amber' | 'emerald' | 'rose' | 'purple' | 'sky' | 'glass'

export interface StickyNoteItem {
  id: string
  text: string
  color: NoteColor
  isPeeled: boolean
  x?: number
  y?: number
  rotation?: number
  zIndex?: number
  updatedAt: number
}

const STORAGE_NOTES_KEY = 'tabloom_sticky_notes'
const STORAGE_POS_KEY = 'tabloom_sticky_note_pos'
const LEGACY_NOTE_KEY = 'tabloom_sticky_note'
const LEGACY_COLOR_KEY = 'tabloom_sticky_note_color'

const COLOR_THEMES: Record<
  NoteColor,
  {
    name: string
    card: string
    tape: string
    textarea: string
    dot: string
    accent: string
  }
> = {
  amber: {
    name: 'Canary Yellow',
    card: 'border-amber-400/30 bg-amber-500/[0.08]',
    tape: 'bg-amber-400/25 border-b border-amber-400/25 text-amber-200',
    textarea: 'text-amber-100 placeholder-amber-200/30 selection:bg-amber-400/30',
    dot: 'bg-amber-400',
    accent: 'text-amber-400',
  },
  emerald: {
    name: 'Mint Green',
    card: 'border-emerald-400/30 bg-emerald-500/[0.08]',
    tape: 'bg-emerald-400/25 border-b border-emerald-400/25 text-emerald-200',
    textarea: 'text-emerald-100 placeholder-emerald-200/30 selection:bg-emerald-400/30',
    dot: 'bg-emerald-400',
    accent: 'text-emerald-400',
  },
  rose: {
    name: 'Blush Pink',
    card: 'border-rose-400/30 bg-rose-500/[0.08]',
    tape: 'bg-rose-400/25 border-b border-rose-400/25 text-rose-200',
    textarea: 'text-rose-100 placeholder-rose-200/30 selection:bg-rose-400/30',
    dot: 'bg-rose-400',
    accent: 'text-rose-400',
  },
  purple: {
    name: 'Lavender Mist',
    card: 'border-purple-400/30 bg-purple-500/[0.08]',
    tape: 'bg-purple-400/25 border-b border-purple-400/25 text-purple-200',
    textarea: 'text-purple-100 placeholder-purple-200/30 selection:bg-purple-400/30',
    dot: 'bg-purple-400',
    accent: 'text-purple-400',
  },
  sky: {
    name: 'Pastel Sky',
    card: 'border-sky-400/30 bg-sky-500/[0.08]',
    tape: 'bg-sky-400/25 border-b border-sky-400/25 text-sky-200',
    textarea: 'text-sky-100 placeholder-sky-200/30 selection:bg-sky-400/30',
    dot: 'bg-sky-400',
    accent: 'text-sky-400',
  },
  glass: {
    name: 'Clean White',
    card: 'border-white/[0.14] bg-white/[0.06]',
    tape: 'bg-white/[0.10] border-b border-white/[0.10] text-white/80',
    textarea: 'text-white/90 placeholder-white/30 selection:bg-white/20',
    dot: 'bg-white/80',
    accent: 'text-white/80',
  },
}

function createDefaultNote(color: NoteColor = 'amber', isPeeled = false): StickyNoteItem {
  return {
    id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    text: '',
    color,
    isPeeled,
    rotation: isPeeled ? Number((Math.random() * 2.4 - 1.2).toFixed(1)) : 0,
    zIndex: 35,
    updatedAt: Date.now(),
  }
}

// --- Component State ---
const notes = ref<StickyNoteItem[]>([])
const padRef = ref<HTMLElement | null>(null)
const padTextareaRef = ref<HTMLTextAreaElement | null>(null)
const saveStatus = ref<'saved' | 'saving' | 'idle'>('idle')
const isConfirmingDeleteId = ref<string | null>(null)
const maxZIndex = ref(40)
let hasLoaded = false
let debounceTimeout: number | undefined
let resetStatusTimeout: number | undefined

// Dragging State for Peeled Notes & Peel-from-corner
const draggingNoteId = ref<string | null>(null)
const dragOffset = ref({ x: 0, y: 0 })
let dragRaf = 0

// The note currently docked on the main pad
const padNote = computed(() => {
  return notes.value.find((n) => !n.isPeeled) || null
})

// All notes that have been peeled off and stuck around the desktop
const peeledNotes = computed(() => {
  return notes.value.filter((n) => n.isPeeled)
})

// --- Storage & Data Recovery ---
async function loadData() {
  let loadedNotes: StickyNoteItem[] | null = null
  let legacyText: string | null = null
  let legacyColor: NoteColor = 'amber'
  let loadedPos: { x: number; y: number } | null = null

  // 1. Check Chrome storage sync & local
  if (typeof chrome !== 'undefined' && chrome.storage) {
    try {
      const items = await new Promise<{ [k: string]: any }>((resolve) => {
        chrome.storage.sync?.get(
          [STORAGE_NOTES_KEY, STORAGE_POS_KEY, LEGACY_NOTE_KEY, LEGACY_COLOR_KEY],
          (res) => resolve(res || {})
        ) ?? resolve({})
      })

      if (Array.isArray(items[STORAGE_NOTES_KEY])) {
        loadedNotes = items[STORAGE_NOTES_KEY]
      }
      if (typeof items[LEGACY_NOTE_KEY] === 'string' && items[LEGACY_NOTE_KEY].trim()) {
        legacyText = items[LEGACY_NOTE_KEY]
        if (items[LEGACY_COLOR_KEY]) legacyColor = items[LEGACY_COLOR_KEY]
      }
      if (items[STORAGE_POS_KEY] && typeof items[STORAGE_POS_KEY].x === 'number') {
        loadedPos = items[STORAGE_POS_KEY]
      }
    } catch {}

    if (!loadedNotes) {
      try {
        const localItems = await new Promise<{ [k: string]: any }>((resolve) => {
          chrome.storage.local?.get(
            [STORAGE_NOTES_KEY, STORAGE_POS_KEY, LEGACY_NOTE_KEY, LEGACY_COLOR_KEY],
            (res) => resolve(res || {})
          ) ?? resolve({})
        })
        if (Array.isArray(localItems[STORAGE_NOTES_KEY])) {
          loadedNotes = localItems[STORAGE_NOTES_KEY]
        }
        if (!legacyText && typeof localItems[LEGACY_NOTE_KEY] === 'string' && localItems[LEGACY_NOTE_KEY].trim()) {
          legacyText = localItems[LEGACY_NOTE_KEY]
          if (localItems[LEGACY_COLOR_KEY]) legacyColor = localItems[LEGACY_COLOR_KEY]
        }
      } catch {}
    }
  }

  // 2. Check localStorage fallback
  if (!loadedNotes) {
    try {
      const raw = localStorage.getItem(STORAGE_NOTES_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) loadedNotes = parsed
      }
    } catch {}
  }

  if (!legacyText) {
    try {
      const rawLegacy = localStorage.getItem(LEGACY_NOTE_KEY)
      if (rawLegacy && rawLegacy.trim()) {
        legacyText = rawLegacy
        const rawColor = localStorage.getItem(LEGACY_COLOR_KEY) as NoteColor
        if (rawColor) legacyColor = rawColor
      }
    } catch {}
  }

  if (!loadedPos) {
    try {
      const rawPos = localStorage.getItem(STORAGE_POS_KEY)
      if (rawPos) loadedPos = JSON.parse(rawPos)
    } catch {}
  }

  // 3. Normalize loaded notes
  let finalNotes: StickyNoteItem[] = []
  if (loadedNotes && loadedNotes.length > 0) {
    finalNotes = loadedNotes.map((n, idx) => ({
      id: n.id || `note_${Date.now()}_${idx}`,
      text: typeof n.text === 'string' ? n.text : '',
      color: n.color && COLOR_THEMES[n.color] ? n.color : 'amber',
      isPeeled: typeof n.isPeeled === 'boolean' ? n.isPeeled : idx > 0 || !!n.x,
      x: typeof n.x === 'number' ? n.x : loadedPos && idx === 0 ? loadedPos.x : undefined,
      y: typeof n.y === 'number' ? n.y : loadedPos && idx === 0 ? loadedPos.y : undefined,
      rotation: typeof n.rotation === 'number' ? n.rotation : 0,
      zIndex: typeof n.zIndex === 'number' ? n.zIndex : 35 + idx,
      updatedAt: typeof n.updatedAt === 'number' ? n.updatedAt : Date.now(),
    }))
  }

  // 4. Data Recovery: Ensure legacy text is never lost
  if (legacyText && legacyText.trim()) {
    const alreadyExists = finalNotes.some((n) => n.text.trim() === legacyText!.trim())
    if (!alreadyExists) {
      if (finalNotes.length === 0) {
        finalNotes.push({
          id: 'note_recovered_legacy',
          text: legacyText,
          color: legacyColor,
          isPeeled: false,
          rotation: 0,
          zIndex: 35,
          updatedAt: Date.now(),
        })
      } else if (!finalNotes[0].text.trim()) {
        finalNotes[0].text = legacyText
        finalNotes[0].color = legacyColor
      } else {
        finalNotes.unshift({
          id: 'note_recovered_legacy',
          text: legacyText,
          color: legacyColor,
          isPeeled: false,
          rotation: 0,
          zIndex: 35,
          updatedAt: Date.now(),
        })
      }
    }
  }

  // Ensure at least one note exists for the pad
  if (!finalNotes.some((n) => !n.isPeeled)) {
    finalNotes.unshift(createDefaultNote('amber', false))
  }

  // Clamp any peeled positions to screen bounds
  finalNotes = finalNotes.map((n) => {
    if (n.isPeeled && typeof n.x === 'number' && typeof n.y === 'number') {
      const clamped = clampPosition({ x: n.x, y: n.y })
      return { ...n, x: clamped.x, y: clamped.y }
    }
    return n
  })

  // Calculate highest z-index
  for (const n of finalNotes) {
    if (n.zIndex && n.zIndex > maxZIndex.value) {
      maxZIndex.value = n.zIndex
    }
  }

  notes.value = finalNotes
  hasLoaded = true
}

function persistNotesNow() {
  if (!hasLoaded) return
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
        }, 1200)
      })
      return
    } catch {}
  }

  saveStatus.value = 'saved'
  if (resetStatusTimeout) clearTimeout(resetStatusTimeout)
  resetStatusTimeout = window.setTimeout(() => {
    if (saveStatus.value === 'saved') saveStatus.value = 'idle'
  }, 1200)
}

function schedulePersist() {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  saveStatus.value = 'saving'
  debounceTimeout = window.setTimeout(persistNotesNow, 250)
}

// --- Note Actions ---
function onNoteInput(note: StickyNoteItem) {
  note.updatedAt = Date.now()
  schedulePersist()
}

function changeNoteColor(note: StickyNoteItem, color: NoteColor) {
  note.color = color
  note.updatedAt = Date.now()
  persistNotesNow()

  nextTick(() => {
    padTextareaRef.value?.focus()
  })
}

function bringToFront(note: StickyNoteItem) {
  note.zIndex = ++maxZIndex.value
}

// Peel note from main pad onto desktop
function peelNoteFromPad() {
  const current = padNote.value
  if (!current) return

  const padEl = padRef.value
  const padRect = padEl?.getBoundingClientRect()

  // Calculate placement position for the newly peeled note
  const offsetCount = peeledNotes.value.length % 5
  const defaultX = padRect
    ? Math.min(window.innerWidth - 260, padRect.right + 24 + offsetCount * 14)
    : 300 + offsetCount * 14
  const defaultY = padRect
    ? Math.min(window.innerHeight - 240, Math.max(90, padRect.top + offsetCount * 22))
    : 160 + offsetCount * 22

  const clamped = clampPosition({ x: defaultX, y: defaultY })

  // Peel the current note
  current.isPeeled = true
  current.x = clamped.x
  current.y = clamped.y
  current.rotation = Number((Math.random() * 2.4 - 1.2).toFixed(1))
  current.zIndex = ++maxZIndex.value
  current.updatedAt = Date.now()

  // Place a fresh blank sheet on the main pad stack
  const newPadSheet = createDefaultNote(current.color, false)
  notes.value.unshift(newPadSheet)

  persistNotesNow()

  nextTick(() => {
    // Focus the peeled note or pad
    const peeledTextarea = document.getElementById(`textarea-${current.id}`)
    peeledTextarea?.focus()
  })
}

// Return a peeled note back to the pad
function returnNoteToPad(note: StickyNoteItem) {
  note.isPeeled = false
  note.x = undefined
  note.y = undefined
  note.rotation = 0
  note.updatedAt = Date.now()

  // If pad already has an empty sheet, replace it with this returning note
  const emptyPadIndex = notes.value.findIndex((n) => !n.isPeeled && !n.text.trim())
  if (emptyPadIndex !== -1 && note.text.trim()) {
    notes.value.splice(emptyPadIndex, 1)
  }

  persistNotesNow()

  nextTick(() => {
    padTextareaRef.value?.focus()
  })
}

// Gather all peeled notes back to pad
function gatherAllNotesToPad() {
  for (const n of notes.value) {
    if (n.isPeeled) {
      n.isPeeled = false
      n.x = undefined
      n.y = undefined
      n.rotation = 0
      n.updatedAt = Date.now()
    }
  }
  // Remove redundant empty notes
  const nonPeeled = notes.value.filter((n) => !n.isPeeled)
  if (nonPeeled.length > 1) {
    const kept = nonPeeled.filter((n, idx) => idx === 0 || n.text.trim().length > 0)
    notes.value = kept.length > 0 ? kept : [createDefaultNote('amber', false)]
  }
  persistNotesNow()

  nextTick(() => {
    padTextareaRef.value?.focus()
  })
}

// Delete note with confirmation
function deleteNote(note: StickyNoteItem) {
  if (isConfirmingDeleteId.value !== note.id) {
    isConfirmingDeleteId.value = note.id
    window.setTimeout(() => {
      if (isConfirmingDeleteId.value === note.id) isConfirmingDeleteId.value = null
    }, 3000)
    return
  }

  isConfirmingDeleteId.value = null

  if (note.isPeeled) {
    // Remove peeled note
    const idx = notes.value.findIndex((n) => n.id === note.id)
    if (idx !== -1) notes.value.splice(idx, 1)
  } else {
    // Note is on pad: if text exists, clear it; if other pad notes exist, discard
    const padNotesCount = notes.value.filter((n) => !n.isPeeled).length
    if (padNotesCount > 1) {
      const idx = notes.value.findIndex((n) => n.id === note.id)
      if (idx !== -1) notes.value.splice(idx, 1)
    } else {
      note.text = ''
      note.updatedAt = Date.now()
    }
  }

  persistNotesNow()

  nextTick(() => {
    padTextareaRef.value?.focus()
  })
}

// --- Drag & Drop Placement for Peeled Notes ---
function clampPosition(pos: { x: number; y: number }): { x: number; y: number } {
  const cardWidth = 240
  const cardHeight = 200
  const pad = 8

  const maxX = Math.max(pad, window.innerWidth - cardWidth - pad)
  const maxY = Math.max(pad, window.innerHeight - cardHeight - pad)

  return {
    x: Math.min(maxX, Math.max(pad, pos.x)),
    y: Math.min(maxY, Math.max(pad, pos.y)),
  }
}

function onTapePointerDown(e: PointerEvent, note: StickyNoteItem) {
  const target = e.target as HTMLElement
  if (target.closest('button') || target.closest('textarea') || target.closest('input')) {
    return
  }

  bringToFront(note)
  draggingNoteId.value = note.id

  const currentX = note.x ?? 100
  const currentY = note.y ?? 100

  dragOffset.value = {
    x: e.clientX - currentX,
    y: e.clientY - currentY,
  }

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  e.preventDefault()
}

function onPointerMove(e: PointerEvent) {
  if (!draggingNoteId.value) return
  if (dragRaf) cancelAnimationFrame(dragRaf)

  const clientX = e.clientX
  const clientY = e.clientY

  dragRaf = requestAnimationFrame(() => {
    const note = notes.value.find((n) => n.id === draggingNoteId.value)
    if (!note) return

    const rawX = clientX - dragOffset.value.x
    const rawY = clientY - dragOffset.value.y
    const clamped = clampPosition({ x: rawX, y: rawY })
    note.x = clamped.x
    note.y = clamped.y
  })
}

function onPointerUp() {
  if (!draggingNoteId.value) return
  if (dragRaf) {
    cancelAnimationFrame(dragRaf)
    dragRaf = 0
  }
  draggingNoteId.value = null
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  persistNotesNow()

  nextTick(() => {
    padTextareaRef.value?.focus()
  })
}

// Interactive Dog-Ear Peel Corner drag handler on the pad
function onPeelCornerPointerDown(e: PointerEvent) {
  e.preventDefault()
  e.stopPropagation()

  const current = padNote.value
  if (!current) return

  // Peel immediately and attach to dragging pointer
  const padEl = padRef.value
  const padRect = padEl?.getBoundingClientRect()
  const initialX = padRect ? padRect.left + 20 : e.clientX - 100
  const initialY = padRect ? padRect.top + 20 : e.clientY - 30

  current.isPeeled = true
  current.x = initialX
  current.y = initialY
  current.rotation = Number((Math.random() * 2.4 - 1.2).toFixed(1))
  current.zIndex = ++maxZIndex.value
  current.updatedAt = Date.now()

  // Put a new sheet on pad
  const newPadSheet = createDefaultNote(current.color, false)
  notes.value.unshift(newPadSheet)

  // Start dragging this newly peeled note right away
  draggingNoteId.value = current.id
  dragOffset.value = {
    x: e.clientX - initialX,
    y: e.clientY - initialY,
  }

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

function onWindowResize() {
  let changed = false
  for (const n of notes.value) {
    if (n.isPeeled && typeof n.x === 'number' && typeof n.y === 'number') {
      const clamped = clampPosition({ x: n.x, y: n.y })
      if (clamped.x !== n.x || clamped.y !== n.y) {
        n.x = clamped.x
        n.y = clamped.y
        changed = true
      }
    }
  }
  if (changed) persistNotesNow()
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', onWindowResize, { passive: true })
  window.addEventListener('beforeunload', persistNotesNow)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') persistNotesNow()
  })

  // Real-time listener for cross-device sync
  if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if ((area === 'sync' || area === 'local') && changes[STORAGE_NOTES_KEY]?.newValue) {
        const remote = changes[STORAGE_NOTES_KEY].newValue as StickyNoteItem[]
        if (Array.isArray(remote) && remote.length > 0 && !draggingNoteId.value) {
          notes.value = remote
        }
      }
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('beforeunload', persistNotesNow)
  if (dragRaf) cancelAnimationFrame(dragRaf)
  if (debounceTimeout) clearTimeout(debounceTimeout)
  if (resetStatusTimeout) clearTimeout(resetStatusTimeout)
})
</script>

<template>
  <!-- ========================================================================= -->
  <!-- 1. MAIN STICKER PAD (Docked in the Left Side Panel under Clock)           -->
  <!-- ========================================================================= -->
  <div
    ref="padRef"
    class="relative w-full select-none"
    aria-label="Main Sticky Note Pad"
  >
    <!-- Realistic 3D Stack Effect: Paper Layers Behind Pad (Sharp Corners) -->
    <div
      class="sticky-note-layer pointer-events-none absolute -bottom-1.5 -right-1.5 left-1.5 top-1.5 rounded-none border border-current/15 bg-current/[0.03] opacity-40 shadow-sm"
    />
    <div
      class="sticky-note-layer pointer-events-none absolute -bottom-0.5 -right-0.5 left-0.5 top-0.5 rounded-none border border-current/15 bg-current/[0.05] opacity-60 shadow-sm"
    />

    <!-- Main Pad Top Sheet (Strictly Sharp Corners: rounded-none) -->
    <div
      v-if="padNote"
      :key="padNote.id"
      class="sticky-note-card sticky-note-pad group relative flex flex-col justify-between overflow-hidden rounded-none border p-0 shadow-lg shadow-black/20 backdrop-blur-xl transition-[border-color,background-color,box-shadow] duration-200"
      :data-color="padNote.color"
      :class="COLOR_THEMES[padNote.color].card"
    >
      <!-- Top Adhesive Tape Strip / Header Bar -->
      <div
        class="flex items-center justify-between px-3 py-1.5 select-none transition-colors"
        :class="COLOR_THEMES[padNote.color].tape"
      >
        <!-- Left: Pad Identity & Stack Count -->
        <div class="flex items-center gap-1.5">
          <Layers class="h-3.5 w-3.5 opacity-80" />
          <span class="text-[11px] font-semibold tracking-wider uppercase opacity-90">
            Note Pad
          </span>
          <span
            v-if="peeledNotes.length > 0"
            class="rounded-none bg-black/15 px-1 py-0.2 text-[9px] font-mono opacity-80 dark:bg-white/15"
            :title="`${peeledNotes.length} note(s) currently peeled on desk`"
          >
            {{ peeledNotes.length }} on desk
          </span>
        </div>

        <!-- Right: Actions, Palette & Status -->
        <div class="flex items-center gap-1.5">
          <!-- Sync Status -->
          <span
            v-if="saveStatus === 'saved'"
            class="flex items-center text-emerald-400 transition-opacity"
            title="Saved & Synced"
          >
            <Check class="h-3 w-3" />
          </span>
          <span
            v-else-if="saveStatus === 'saving'"
            class="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"
            title="Saving..."
          />

          <!-- Gather all notes back to pad -->
          <button
            v-if="peeledNotes.length > 0"
            type="button"
            title="Gather all peeled notes back to this pad"
            class="rounded-none p-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:bg-black/15 dark:hover:bg-white/15 hover:text-white"
            @click.stop="gatherAllNotesToPad"
          >
            <Copy class="h-3 w-3" />
          </button>

          <!-- Color Palette Dots -->
          <div class="flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            <button
              v-for="(th, colKey) in COLOR_THEMES"
              :key="colKey"
              type="button"
              :title="th.name"
              class="h-2.5 w-2.5 rounded-none transition-all hover:scale-125"
              :class="[
                th.dot,
                padNote.color === colKey ? 'ring-1 ring-white/90 scale-110' : 'opacity-50 hover:opacity-100',
              ]"
              @click.stop="changeNoteColor(padNote, colKey)"
            />
          </div>

          <!-- Clear / Delete Pad Note -->
          <button
            type="button"
            :title="
              isConfirmingDeleteId === padNote.id
                ? 'Click again to clear text'
                : 'Clear pad note'
            "
            class="rounded-none p-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:bg-rose-500/20 hover:text-rose-300"
            :class="{ 'opacity-100 text-rose-400 bg-rose-500/20': isConfirmingDeleteId === padNote.id }"
            @click.stop="deleteNote(padNote)"
          >
            <Trash2 class="h-3 w-3" />
          </button>
        </div>
      </div>

      <!-- Note Textarea (Pad) -->
      <div class="relative px-3.5 pt-2.5 pb-7">
        <textarea
          :id="`textarea-${padNote.id}`"
          ref="padTextareaRef"
          v-model="padNote.text"
          maxlength="5000"
          placeholder="Write on pad or peel to stick anywhere..."
          rows="5"
          class="w-full resize-none bg-transparent text-xs leading-relaxed outline-none transition-colors scrollbar-none font-normal"
          :class="COLOR_THEMES[padNote.color].textarea"
          @input="onNoteInput(padNote)"
        />
      </div>

      <!-- Bottom Bar: "Peel Note" Button & Interactive Curled Dog-Ear Corner -->
      <div
        class="relative flex items-center justify-between border-t border-black/[0.06] bg-black/[0.03] px-3 py-1.5 text-[10px] dark:border-white/[0.06] dark:bg-white/[0.03]"
      >
        <!-- Primary Action: Peel Note Button -->
        <button
          type="button"
          class="group/btn inline-flex items-center gap-1.5 rounded-none border border-current/15 bg-current/[0.06] px-2 py-0.5 font-medium transition-all hover:bg-current/15 hover:scale-105 active:scale-95"
          title="Peel this note off the pad and stick it anywhere on your desktop"
          @click.stop="peelNoteFromPad"
        >
          <Sparkles class="h-3 w-3 text-amber-300 transition-transform group-hover/btn:rotate-45" />
          <span>Peel Note</span>
          <Plus class="h-3 w-3 opacity-60" />
        </button>

        <span class="text-[9px] opacity-40 font-mono pr-6">
          {{ padNote.text.length }}/5000
        </span>

        <!-- Authentic Curled Paper Dog-Ear Corner (Interactive Drag/Click Peel) -->
        <div
          class="peel-corner-hitbox absolute -bottom-0.5 -right-0.5 h-7 w-7 cursor-pointer select-none"
          title="Click or drag this corner to peel off a sticky note"
          @click.stop="peelNoteFromPad"
          @pointerdown.stop="onPeelCornerPointerDown"
        >
          <div class="peel-triangle" />
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- 2. PEELED STICKY NOTES (Stuck Anywhere on Desktop via Teleport)           -->
  <!-- ========================================================================= -->
  <Teleport to="body">
    <div
      v-for="note in peeledNotes"
      :key="note.id"
      :style="{
        left: `${note.x ?? 120}px`,
        top: `${note.y ?? 120}px`,
        transform: `rotate(${note.rotation ?? 0}deg)`,
        zIndex: note.zIndex ?? 35,
      }"
      class="sticky-note-card sticky-note-peeled group fixed w-56 xl:w-60 select-none overflow-hidden rounded-none border shadow-2xl backdrop-blur-xl transition-[border-color,background-color,box-shadow] duration-200"
      :data-color="note.color"
      :class="[
        COLOR_THEMES[note.color].card,
        draggingNoteId === note.id ? 'cursor-grabbing shadow-2xl ring-1 ring-white/30 scale-[1.02]' : '',
      ]"
      @pointerdown="bringToFront(note)"
    >
      <!-- Top Adhesive Tape Bar (Physical Grab Handle with Sharp Corners) -->
      <div
        class="flex cursor-grab items-center justify-between px-3 py-1.5 active:cursor-grabbing select-none"
        :class="COLOR_THEMES[note.color].tape"
        title="Click & hold to drag and stick anywhere on screen"
        @pointerdown="onTapePointerDown($event, note)"
      >
        <!-- Left: Grip Handle & Pin Indicator -->
        <div class="flex items-center gap-1.5">
          <GripHorizontal class="h-3.5 w-3.5 opacity-60 transition-opacity group-hover:opacity-100" />
          <span class="text-[10px] font-semibold tracking-wider uppercase opacity-80">
            Stuck Note
          </span>
        </div>

        <!-- Right: Return to Pad, Palette & Delete -->
        <div class="flex items-center gap-1">
          <!-- Return to Pad Button -->
          <button
            type="button"
            title="Stick back to the main pad"
            class="rounded-none p-1 opacity-60 transition-all hover:opacity-100 hover:bg-black/15 dark:hover:bg-white/15 hover:text-white"
            @click.stop="returnNoteToPad(note)"
          >
            <PinOff class="h-3 w-3" />
          </button>

          <!-- Color Palette Dots -->
          <div class="flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            <button
              v-for="(th, colKey) in COLOR_THEMES"
              :key="colKey"
              type="button"
              :title="th.name"
              class="h-2.5 w-2.5 rounded-none transition-all hover:scale-125"
              :class="[
                th.dot,
                note.color === colKey ? 'ring-1 ring-white/90 scale-110' : 'opacity-50 hover:opacity-100',
              ]"
              @click.stop="changeNoteColor(note, colKey)"
            />
          </div>

          <!-- Delete Peeled Note -->
          <button
            type="button"
            :title="
              isConfirmingDeleteId === note.id
                ? 'Click again to confirm delete'
                : 'Delete this sticky note'
            "
            class="rounded-none p-1 opacity-60 transition-all hover:opacity-100 hover:bg-rose-500/20 hover:text-rose-300"
            :class="{ 'opacity-100 text-rose-400 bg-rose-500/20': isConfirmingDeleteId === note.id }"
            @click.stop="deleteNote(note)"
          >
            <Trash2 class="h-3 w-3" />
          </button>
        </div>
      </div>

      <!-- Peeled Note Textarea -->
      <div class="relative px-3.5 pt-2.5 pb-2">
        <textarea
          :id="`textarea-${note.id}`"
          v-model="note.text"
          maxlength="5000"
          placeholder="Stuck note reminder..."
          rows="5"
          class="w-full resize-none bg-transparent text-xs leading-relaxed outline-none transition-colors scrollbar-none font-normal"
          :class="COLOR_THEMES[note.color].textarea"
          @input="onNoteInput(note)"
        />
      </div>

      <!-- Bottom Status Bar -->
      <div
        v-if="isConfirmingDeleteId === note.id"
        class="border-t border-rose-500/20 bg-rose-500/10 py-1 text-center text-[10px] font-medium text-rose-400 animate-pulse select-none"
      >
        Click trash again to delete note
      </div>
      <div
        v-else-if="note.text.length > 0"
        class="flex justify-end px-3 pb-1 text-[9px] opacity-0 transition-opacity duration-150 group-hover:opacity-40 select-none font-mono"
      >
        {{ note.text.length }}/5000
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Ensure all sticky note elements have strictly sharp corners */
.sticky-note-card,
.sticky-note-pad,
.sticky-note-peeled,
.sticky-note-layer {
  border-radius: 0px !important;
}

textarea {
  scrollbar-width: none;
}
textarea::-webkit-scrollbar {
  display: none;
}

/* Authentic Paper Peel Dog-Ear Corner at bottom-right of pad */
.peel-corner-hitbox {
  transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}
.peel-corner-hitbox:hover {
  transform: scale(1.15);
}

.peel-triangle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 0 16px 16px;
  border-color: transparent transparent rgba(0, 0, 0, 0.28) transparent;
  transition: all 180ms ease-out;
  filter: drop-shadow(-1px -1px 2px rgba(0, 0, 0, 0.25));
}

.peel-corner-hitbox:hover .peel-triangle {
  border-width: 0 0 22px 22px;
  border-color: transparent transparent var(--accent, #10b981) transparent;
  filter: drop-shadow(-2px -2px 4px rgba(0, 0, 0, 0.4));
}
</style>

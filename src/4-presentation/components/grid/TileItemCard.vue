<!--
  TileItemCard component rendering an individual tile card.
  Supports 2D Minecraft, Retro Pixel, Glassmorphic, and Minimal Flat styles.
  Features Hold-to-Preview popover with full cover details, quick actions,
  drag-and-drop reordering, and tactile feedback.
-->
<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import {
  Pencil,
  Trash2,
  X,
  Pin,
  ExternalLink,
  Eye,
  Globe,
} from 'lucide-vue-next'
import type { Tile } from '../../../1-domain/entities/Tile'
import type { NavigationTab } from '../../../1-domain/entities/BrowserItem'
import {
  resolveFaviconUrl,
  generateMonogram,
} from '../../../3-infrastructure/favicon/faviconService'

interface Props {
  tile: Tile
  index: number
  activeView: NavigationTab
  showLabels?: boolean
  isDropTarget?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showLabels: true,
  isDropTarget: false,
})

const emit = defineEmits<{
  (e: 'click', tile: Tile): void
  (e: 'edit', tile: Tile): void
  (e: 'delete', tile: Tile): void
  (e: 'closeTab', tabId: number): void
  (e: 'dragStart', index: number): void
  (e: 'dragOver', event: DragEvent, index: number): void
  (e: 'drop', from: number, to: number): void
  (e: 'updateSize', payload: { id: string; colSpan: number; rowSpan: number }): void
}>()

const TILE_SIZE_PRESETS = [
  { id: '1x1', label: '1×1 Standard', col: 1, row: 1 },
  { id: '2x1', label: '2×1 Wide', col: 2, row: 1 },
  { id: '1x2', label: '1×2 Tall', col: 1, row: 2 },
  { id: '2x2', label: '2×2 Hero', col: 2, row: 2 },
]

function onSetSize(colSpan: number, rowSpan: number) {
  emit('updateSize', { id: props.tile.id, colSpan, rowSpan })
}

const tileRootStyle = computed(() => {
  const colSpan = Math.min(props.tile.colSpan || 1, 6)
  const rowSpan = Math.min(props.tile.rowSpan || 1, 4)
  return {
    gridColumn: colSpan > 1 ? `span ${colSpan} / span ${colSpan}` : undefined,
    gridRow: rowSpan > 1 ? `span ${rowSpan} / span ${rowSpan}` : undefined,
  }
})

const cardHeightStyle = computed(() => {
  const rowSpan = Math.min(props.tile.rowSpan || 1, 4)
  if (rowSpan > 1) {
    return `calc(var(--card-height, 120px) * ${rowSpan} + var(--tile-gap, 20px) * ${rowSpan - 1} + ${props.showLabels ? 24 * (rowSpan - 1) : 0}px)`
  }
  return 'var(--card-height, 120px)'
})

const imgError = ref(false)
const faviconUrl = computed(() =>
  resolveFaviconUrl(props.tile.url, props.tile.customIcon, props.tile.iconMode)
)
const monogram = computed(() =>
  generateMonogram(props.tile.title, props.tile.url)
)

const domain = computed(() => {
  try {
    return new URL(props.tile.url).hostname.replace(/^www\./, '')
  } catch {
    return props.tile.url
  }
})

// --- Hold-to-Preview State Machine ---
const isHeld = ref(false)
const previewPlacement = ref<'top' | 'bottom'>('top')
const holdCardRef = ref<HTMLElement | null>(null)
let holdTimer: ReturnType<typeof setTimeout> | null = null
let pointerStartX = 0
let pointerStartY = 0
let didHoldTrigger = false

function onPointerDown(e: PointerEvent | MouseEvent) {
  // Only handle primary button (left click / touch)
  if (e.button !== 0) return
  if (holdTimer) return
  pointerStartX = e.clientX
  pointerStartY = e.clientY
  didHoldTrigger = false

  holdTimer = setTimeout(() => {
    if (holdCardRef.value) {
      const rect = holdCardRef.value.getBoundingClientRect()
      previewPlacement.value = rect.top < 260 ? 'bottom' : 'top'
    }
    isHeld.value = true
    didHoldTrigger = true
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(20)
      } catch {}
    }
  }, 420)
}

function onPointerMove(e: PointerEvent | MouseEvent) {
  if (!holdTimer) return
  const dist = Math.hypot(e.clientX - pointerStartX, e.clientY - pointerStartY)
  if (dist > 18) {
    clearHoldTimer()
  }
}

function onPointerUp() {
  clearHoldTimer()
}

function clearHoldTimer() {
  if (holdTimer) {
    clearTimeout(holdTimer)
    holdTimer = null
  }
}

function onCardClick(e: MouseEvent) {
  // If hold preview triggered, don't trigger regular navigation click
  if (didHoldTrigger) {
    didHoldTrigger = false
    e.preventDefault()
    e.stopPropagation()
    return
  }
  emit('click', props.tile)
}

function dismissPreview(e?: Event) {
  if (e) {
    e.stopPropagation()
  }
  isHeld.value = false
}

function handleGlobalKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isHeld.value) {
    isHeld.value = false
  }
}

function handleGlobalClick(e: MouseEvent) {
  if (isHeld.value && holdCardRef.value && !holdCardRef.value.contains(e.target as Node)) {
    isHeld.value = false
  }
}

function addHoldListeners() {
  window.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('click', handleGlobalClick)
}

function removeHoldListeners() {
  window.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('click', handleGlobalClick)
}

watch(isHeld, (held) => {
  if (held) {
    addHoldListeners()
  } else {
    removeHoldListeners()
  }
})

onUnmounted(() => {
  clearHoldTimer()
  removeHoldListeners()
})

// --- Drag & Drop ---
function onDragStart(event: DragEvent) {
  clearHoldTimer()
  isHeld.value = false
  event.dataTransfer?.setData('text/plain', String(props.index))
  emit('dragStart', props.index)
}

function onDrop(event: DragEvent) {
  const fromIdx = Number(event.dataTransfer?.getData('text/plain'))
  if (!isNaN(fromIdx)) emit('drop', fromIdx, props.index)
}
</script>

<template>
  <div
    ref="holdCardRef"
    class="relative group flex flex-col items-center justify-start gap-2 select-none"
    :style="tileRootStyle"
    draggable="true"
    @dragstart="onDragStart"
    @dragover.prevent="emit('dragOver', $event, props.index)"
    @drop.prevent="onDrop"
  >
    <!-- Card Container with hardware-accelerated zero-jank hover & hold elevation -->
    <div
      class="gpu-card relative flex w-full cursor-pointer flex-col items-center justify-center border border-white/[0.08] bg-white/[0.05] shadow-md shadow-black/20 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:scale-[1.02] hover:border-white/20 hover:bg-white/[0.10] hover:shadow-xl hover:shadow-black/35 active:scale-[0.98] overflow-hidden"
      :class="[
        isHeld
          ? 'scale-105 -translate-y-2 ring-2 ring-offset-2 ring-offset-black/50 shadow-2xl z-30'
          : '',
        props.isDropTarget
          ? 'ring-2 ring-dashed scale-95 shadow-inner'
          : '',
      ]"
      :style="{
        height: cardHeightStyle,
        borderRadius: 'var(--tile-radius, 16px)',
        padding: props.tile.displayMode === 'full-cover' ? '0px' : 'var(--tile-padding, 16px)',
        backgroundColor: props.isDropTarget
          ? 'var(--accent-20)'
          : (props.tile.tintColor ? props.tile.tintColor : undefined),
        borderColor: isHeld || props.isDropTarget ? 'var(--accent)' : undefined,
        '--tw-ring-color': isHeld || props.isDropTarget ? 'var(--accent)' : undefined,
      }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @click="onCardClick"
    >
      <!-- FULL TILE IMAGE COVER -->
      <template v-if="props.tile.displayMode === 'full-cover' && (props.tile.customIcon || faviconUrl)">
        <img
          :src="props.tile.customIcon || faviconUrl"
          :alt="props.tile.title"
          class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        <!-- Discreet bottom gradient overlay for readability -->
        <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" />
      </template>

      <!-- STANDARD ICON BADGE -->
      <template v-else>
        <!-- Wide Layout for Bento tiles (colSpan >= 2) -->
        <div
          v-if="(props.tile.colSpan || 1) >= 2"
          class="flex items-center gap-3.5 w-full px-4 justify-start z-10"
        >
          <div class="tile-icon-box flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.08] shadow-inner">
            <img
              v-if="!imgError && props.tile.iconMode !== 'monogram'"
              :src="faviconUrl"
              :alt="props.tile.title"
              class="h-7 w-7 rounded-md object-contain"
              loading="lazy"
              decoding="async"
              @error="imgError = true"
            />
            <div
              v-else
              class="flex h-full w-full items-center justify-center text-sm font-bold text-white shadow-sm"
              :style="{ backgroundColor: monogram.color }"
            >
              {{ monogram.letter }}
            </div>
          </div>
          <div class="flex flex-col min-w-0 text-left">
            <span class="text-sm font-semibold text-white/95 truncate drop-shadow-sm">{{ props.tile.title }}</span>
            <span class="text-xs text-white/50 truncate font-mono mt-0.5">{{ domain }}</span>
          </div>
        </div>

        <!-- Standard Centered 1x1 Icon Badge -->
        <div
          v-else
          class="tile-icon-box flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.08] shadow-inner"
        >
          <img
            v-if="!imgError && props.tile.iconMode !== 'monogram'"
            :src="faviconUrl"
            :alt="props.tile.title"
            class="h-7 w-7 rounded-md object-contain"
            loading="lazy"
            decoding="async"
            @error="imgError = true"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center text-sm font-bold text-white shadow-sm"
            :style="{ backgroundColor: monogram.color }"
          >
            {{ monogram.letter }}
          </div>
        </div>
      </template>

      <!-- Discreet Top-Right Quick Actions -->
      <div
        class="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        @click.stop
        @pointerdown.stop
      >
        <button
          v-if="props.activeView === 'openTabs' && props.tile.tabId"
          type="button"
          aria-label="Close tab"
          class="rounded-full bg-black/80 p-1 text-white/80 hover:bg-rose-500 hover:text-white shadow-sm cursor-pointer"
          @click.stop.prevent="emit('closeTab', props.tile.tabId!)"
          @pointerdown.stop
        >
          <X class="h-3 w-3" />
        </button>
        <template v-else>
          <button
            type="button"
            aria-label="Edit tile"
            class="rounded-full bg-black/80 p-1 text-white/80 hover:bg-white/25 hover:text-white shadow-sm cursor-pointer"
            @click.stop.prevent="emit('edit', props.tile)"
            @pointerdown.stop
          >
            <Pencil class="h-3 w-3" />
          </button>
          <button
            type="button"
            aria-label="Delete tile"
            class="rounded-full bg-black/80 p-1 text-white/80 hover:bg-rose-500/90 hover:text-white shadow-sm cursor-pointer"
            @click.stop.prevent="emit('delete', props.tile)"
            @pointerdown.stop
          >
            <Trash2 class="h-3 w-3" />
          </button>
        </template>
      </div>

      <!-- Pinned indicator -->
      <div v-if="props.tile.pinned" class="absolute top-2 left-2 z-10" :style="{ color: 'var(--accent)' }">
        <Pin class="h-3 w-3 rotate-45" />
      </div>

      <!-- If full cover mode and labels enabled: show overlay label -->
      <div
        v-if="props.tile.displayMode === 'full-cover' && props.showLabels"
        class="absolute bottom-1.5 left-2 right-2 z-10 truncate text-center text-[11px] font-semibold text-white drop-shadow-md"
      >
        {{ props.tile.title }}
      </div>
    </div>

    <!-- Fixed Height Stable Label Container to Prevent Layout Shifts (for standard icon mode) -->
    <div v-if="props.showLabels && props.tile.displayMode !== 'full-cover'" class="flex h-5 w-full items-center justify-center px-1">
      <span class="tile-label w-full truncate text-center text-xs font-medium text-white/75 transition-colors group-hover:text-white" :title="props.tile.title">
        {{ props.tile.title }}
      </span>
    </div>

    <!-- HOLD-TO-PREVIEW FLOATING CARD POPOVER -->
    <Transition name="modal">
      <div
        v-if="isHeld"
        class="absolute left-1/2 -translate-x-1/2 z-50 w-72 sm:w-80 rounded-2xl border border-white/20 bg-[#0e0720]/98 p-4 shadow-2xl shadow-black/90 text-white select-none animate-in fade-in zoom-in-95 duration-200"
        :class="[
          previewPlacement === 'bottom'
            ? 'top-[calc(100%+14px)]'
            : 'bottom-[calc(100%+14px)]',
        ]"
        @click.stop
        @pointerdown.stop
      >
        <!-- Popover Header with Dismiss Button -->
        <div class="flex items-center justify-between pb-2.5 border-b border-white/10">
          <div class="flex items-center gap-1.5">
            <Eye class="h-3.5 w-3.5" :style="{ color: 'var(--accent)' }" />
            <span class="text-xs font-semibold uppercase tracking-wider text-white/90">
              Tile Preview
            </span>
          </div>
          <button
            type="button"
            class="rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            title="Close Preview"
            @click="dismissPreview"
          >
            <X class="h-3.5 w-3.5" />
          </button>
        </div>

        <!-- Big Visual Preview -->
        <div class="mt-3 relative h-32 w-full overflow-hidden rounded-xl border border-white/15 bg-black/40 flex items-center justify-center shadow-inner">
          <template v-if="props.tile.displayMode === 'full-cover' && (props.tile.customIcon || faviconUrl)">
            <img
              :src="props.tile.customIcon || faviconUrl"
              :alt="props.tile.title"
              class="h-full w-full object-cover"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
            <div class="absolute bottom-2 left-2 right-2 truncate text-xs font-semibold text-white drop-shadow">
              {{ props.tile.title }}
            </div>
          </template>
          <template v-else>
            <div class="flex flex-col items-center gap-2">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] shadow-md">
                <img
                  v-if="!imgError && props.tile.iconMode !== 'monogram'"
                  :src="faviconUrl"
                  :alt="props.tile.title"
                  class="h-7 w-7 rounded-md object-contain"
                />
                <div
                  v-else
                  class="flex h-full w-full items-center justify-center text-sm font-bold text-white"
                  :style="{ backgroundColor: monogram.color }"
                >
                  {{ monogram.letter }}
                </div>
              </div>
              <span class="text-xs font-semibold text-white truncate max-w-[200px]">
                {{ props.tile.title }}
              </span>
            </div>
          </template>

          <!-- Style Badge Pill -->
          <span
            class="absolute top-2 left-2 rounded-full border border-white/20 bg-black/80 px-2 py-0.5 text-[9px] font-mono shadow-sm"
            :style="{ color: 'var(--accent)' }"
          >
            {{ props.tile.displayMode === 'full-cover' ? 'Full Tile Cover' : 'Icon Badge' }}
          </span>
        </div>

        <!-- Details Info -->
        <div class="mt-3 space-y-1">
          <div class="flex items-center gap-1.5 text-xs text-white/90 font-medium truncate">
            <Globe class="h-3.5 w-3.5 shrink-0" :style="{ color: 'var(--accent)' }" />
            <span class="truncate" :title="props.tile.url">{{ domain }}</span>
          </div>
          <div class="text-[11px] text-white/50 truncate font-mono" :title="props.tile.url">
            {{ props.tile.url }}
          </div>
        </div>

        <!-- Bento Tile Grid Size Switcher -->
        <div class="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
          <span class="text-white/60 text-[11px] font-medium">Bento Size:</span>
          <div class="flex items-center gap-1">
            <button
              v-for="sz in TILE_SIZE_PRESETS"
              :key="sz.id"
              type="button"
              class="px-2 py-0.5 rounded text-[10px] font-mono border transition-all cursor-pointer"
              :class="[
                (props.tile.colSpan || 1) === sz.col && (props.tile.rowSpan || 1) === sz.row
                  ? 'font-bold shadow-sm'
                  : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/15'
              ]"
              :style="(props.tile.colSpan || 1) === sz.col && (props.tile.rowSpan || 1) === sz.row ? {
                borderColor: 'var(--accent)',
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-contrast)'
              } : undefined"
              @click.stop="onSetSize(sz.col, sz.row)"
            >
              {{ sz.label }}
            </button>
          </div>
        </div>

        <!-- Quick Actions Row inside Preview -->
        <div class="mt-3 flex items-center gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            class="flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium shadow-sm transition-transform active:scale-95 cursor-pointer"
            :style="{
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-contrast)',
            }"
            @click="emit('click', props.tile); dismissPreview()"
          >
            <ExternalLink class="h-3 w-3" />
            <span>Open</span>
          </button>

          <button
            type="button"
            class="flex items-center justify-center gap-1 rounded-lg border border-white/15 bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-medium text-white transition-colors cursor-pointer"
            title="Edit Shortcut"
            @click="emit('edit', props.tile); dismissPreview()"
          >
            <Pencil class="h-3 w-3" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            class="flex items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/20 hover:bg-rose-500/30 p-1.5 text-rose-300 transition-colors cursor-pointer"
            title="Delete Shortcut"
            @click="emit('delete', props.tile); dismissPreview()"
          >
            <Trash2 class="h-3.5 w-3.5" />
          </button>
        </div>

        <!-- Arrow pointer connecting to held tile -->
        <div
          v-if="previewPlacement === 'top'"
          class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 border-r border-b border-white/20 bg-[#0e0720]/95"
        />
        <div
          v-else
          class="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 border-l border-t border-white/20 bg-[#0e0720]/95"
        />
      </div>
    </Transition>
  </div>
</template>

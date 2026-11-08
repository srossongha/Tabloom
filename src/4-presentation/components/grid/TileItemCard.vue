<!--
  TileItemCard component rendering an individual tile card.
  Supports 2D Minecraft, Retro Pixel, Glassmorphic, and Minimal Flat styles.
  Features Hold-to-Preview popover with full cover details, quick actions,
  drag-and-drop reordering, and tactile feedback.
-->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Pencil,
  Trash2,
  X,
  Pin,
} from 'lucide-vue-next'
import type { Tile } from '../../../1-domain/entities/Tile'
import type { NavigationTab } from '../../../1-domain/entities/BrowserItem'
import {
  resolveFaviconUrl,
  generateMonogram,
} from '../../../3-infrastructure/favicon/faviconService'
import { mediaStorageService } from '../../../3-infrastructure/storage/mediaStorageService'

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

const resolvedMediaUrl = ref<string>('')
const resolvedMediaMime = ref<string>('')

async function updateResolvedMedia() {
  const icon = props.tile.customIcon
  if (!icon) {
    resolvedMediaUrl.value = ''
    resolvedMediaMime.value = ''
    return
  }
  if (icon.startsWith('media:') || icon.startsWith('indexeddb:')) {
    const id = icon.replace(/^(media:|indexeddb:)/, '')
    const res = await mediaStorageService.getMedia(id)
    resolvedMediaUrl.value = res?.url || ''
    resolvedMediaMime.value = res?.record?.mimeType || ''
    return
  }
  resolvedMediaUrl.value = icon
  resolvedMediaMime.value = ''
}

watch(() => props.tile.customIcon, updateResolvedMedia, { immediate: true })

const displayMediaUrl = computed(() => {
  return resolvedMediaUrl.value || props.tile.customIcon || faviconUrl.value
})

const isVideo = computed(() => {
  if (resolvedMediaMime.value.startsWith('video/')) return true
  const src = (displayMediaUrl.value || '').toLowerCase()
  if (!src) return false
  if (src.startsWith('data:video/')) return true
  return /\.(mp4|webm|mov)(\?.*)?$/i.test(src)
})

const domain = computed(() => {
  try {
    return new URL(props.tile.url).hostname.replace(/^www\./, '')
  } catch {
    return props.tile.url
  }
})

function onCardClick() {
  emit('click', props.tile)
}

// --- Drag & Drop ---
function onDragStart(event: DragEvent) {
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
    class="tile-root relative group flex flex-col items-center justify-start gap-2 select-none"
    :style="tileRootStyle"
    draggable="true"
    @dragstart="onDragStart"
    @dragover.prevent="emit('dragOver', $event, props.index)"
    @drop.prevent="onDrop"
  >
    <!-- Card Container with hardware-accelerated zero-jank hover -->
    <div
      class="gpu-card relative flex w-full cursor-pointer flex-col items-center justify-center border border-white/[0.08] bg-white/[0.05] shadow-md shadow-black/20 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:scale-[1.02] hover:border-white/20 hover:bg-white/[0.10] hover:shadow-xl hover:shadow-black/35 active:scale-[0.98] overflow-hidden"
      :class="[
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
        borderColor: props.isDropTarget ? 'var(--accent)' : undefined,
        '--tw-ring-color': props.isDropTarget ? 'var(--accent)' : undefined,
      }"
      @click="onCardClick"
    >
      <!-- FULL TILE IMAGE / GIF / VIDEO COVER -->
      <template v-if="props.tile.displayMode === 'full-cover' && displayMediaUrl">
        <video
          v-if="isVideo"
          :src="displayMediaUrl"
          autoplay
          loop
          muted
          playsinline
          class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <img
          v-else
          :src="displayMediaUrl"
          :alt="props.tile.title"
          class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
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
            <video
              v-if="isVideo"
              :src="displayMediaUrl"
              autoplay
              loop
              muted
              playsinline
              class="h-full w-full object-cover"
            />
            <img
              v-else-if="!imgError && props.tile.iconMode !== 'monogram'"
              :src="displayMediaUrl"
              :alt="props.tile.title"
              class="h-7 w-7 rounded-md object-contain"
              loading="lazy"
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
          <video
            v-if="isVideo"
            :src="displayMediaUrl"
            autoplay
            loop
            muted
            playsinline
            class="h-full w-full object-cover"
          />
          <img
            v-else-if="!imgError && props.tile.iconMode !== 'monogram'"
            :src="displayMediaUrl"
            :alt="props.tile.title"
            class="h-7 w-7 rounded-md object-contain"
            loading="lazy"
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
  </div>
</template>

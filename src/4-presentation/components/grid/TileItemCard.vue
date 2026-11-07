<!--
  TileItemCard component rendering an individual glassmorphic tile and its title label.
  Supports drag-and-drop, quick action hover controls, tab closing, and click telemetry.
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { Pencil, Trash2, X, Pin } from 'lucide-vue-next'
import type { Tile } from '../../../1-domain/entities/Tile'
import type { NavigationTab } from '../../../1-domain/entities/BrowserItem'
import { resolveFaviconUrl, generateMonogram } from '../../../3-infrastructure/favicon/faviconService'

interface Props {
  tile: Tile
  index: number
  activeView: NavigationTab
  showLabels?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showLabels: true,
})

const emit = defineEmits<{
  (e: 'click', tile: Tile): void
  (e: 'edit', tile: Tile): void
  (e: 'delete', tile: Tile): void
  (e: 'closeTab', tabId: number): void
  (e: 'dragStart', index: number): void
  (e: 'dragOver', event: DragEvent, index: number): void
  (e: 'drop', from: number, to: number): void
}>()

const imgError = ref(false)
const faviconUrl = computed(() => resolveFaviconUrl(props.tile.url, props.tile.customIcon, props.tile.iconMode))
const monogram = computed(() => generateMonogram(props.tile.title, props.tile.url))

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
    class="group flex flex-col items-center justify-start gap-2 select-none"
    draggable="true"
    @dragstart="onDragStart"
    @dragover.prevent="emit('dragOver', $event, props.index)"
    @drop.prevent="onDrop"
  >
    <!-- Card Container with hardware-accelerated zero-jank hover -->
    <div
      class="gpu-card relative flex w-full cursor-pointer flex-col items-center justify-center border border-white/[0.08] bg-white/[0.05] shadow-md shadow-black/20 backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:scale-[1.02] hover:border-white/20 hover:bg-white/[0.10] hover:shadow-xl hover:shadow-black/35 active:scale-[0.98] overflow-hidden"
      :style="{
        height: 'var(--card-height, 120px)',
        borderRadius: 'var(--tile-radius, 16px)',
        padding: props.tile.displayMode === 'full-cover' ? '0px' : 'var(--tile-padding, 16px)',
        backgroundColor: props.tile.tintColor ? props.tile.tintColor : undefined,
      }"
      @click="emit('click', props.tile)"
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
        <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
      </template>

      <!-- STANDARD ICON BADGE -->
      <template v-else>
        <!-- Centered 48x48 Favicon Icon Badge -->
        <div class="tile-icon-box flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.08] shadow-inner">
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
      <div class="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100" @click.stop @pointerdown.stop>
        <button
          v-if="props.activeView === 'openTabs' && props.tile.tabId"
          type="button"
          aria-label="Close tab"
          class="rounded-full bg-black/50 p-1 text-white/70 backdrop-blur-md hover:bg-rose-500 hover:text-white cursor-pointer"
          @click.stop.prevent="emit('closeTab', props.tile.tabId!)"
          @pointerdown.stop
        >
          <X class="h-3 w-3" />
        </button>
        <template v-else>
          <button
            type="button"
            aria-label="Edit tile"
            class="rounded-full bg-black/50 p-1 text-white/70 backdrop-blur-md hover:bg-white/20 hover:text-white cursor-pointer"
            @click.stop.prevent="emit('edit', props.tile)"
            @pointerdown.stop
          >
            <Pencil class="h-3 w-3" />
          </button>
          <button
            type="button"
            aria-label="Delete tile"
            class="rounded-full bg-black/50 p-1 text-white/70 backdrop-blur-md hover:bg-rose-500/80 hover:text-white cursor-pointer"
            @click.stop.prevent="emit('delete', props.tile)"
            @pointerdown.stop
          >
            <Trash2 class="h-3 w-3" />
          </button>
        </template>
      </div>

      <!-- Pinned indicator -->
      <div v-if="props.tile.pinned" class="absolute top-2 left-2 z-10 text-emerald-400">
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

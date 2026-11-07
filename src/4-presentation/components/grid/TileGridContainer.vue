<!--
  TileGridContainer component orchestrating the responsive CSS grid layout of tiles.
  Dynamically sets column counts, gap spacing, and manages drag-and-drop event bubbling.
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Tile } from '../../../1-domain/entities/Tile'
import type { NavigationTab } from '../../../1-domain/entities/BrowserItem'
import TileItemCard from './TileItemCard.vue'
import AddNewTileCard from './AddNewTileCard.vue'

interface Props {
  tiles: Tile[]
  activeView: NavigationTab
  gridCols?: number
  showAddCard?: boolean
  showLabels?: boolean
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  gridCols: 6,
  showAddCard: true,
  showLabels: true,
  isLoading: false,
})

const emit = defineEmits<{
  (e: 'clickTile', tile: Tile): void
  (e: 'editTile', tile: Tile): void
  (e: 'deleteTile', tile: Tile): void
  (e: 'closeTab', tabId: number): void
  (e: 'reorder', from: number, to: number): void
  (e: 'openAddModal'): void
}>()

const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

const containerMaxWidth = computed(() => {
  if (props.gridCols <= 3) return 'max-w-3xl'
  if (props.gridCols === 4) return 'max-w-4xl'
  if (props.gridCols === 5) return 'max-w-5xl'
  if (props.gridCols === 6) return 'max-w-6xl'
  return 'max-w-7xl'
})

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.gridCols}, minmax(0, 1fr))`,
  gap: 'var(--tile-gap, 20px)',
}))

function handleDragStart(idx: number) {
  draggedIndex.value = idx
}

function handleDragOver(_e: DragEvent, idx: number) {
  dragOverIndex.value = idx
}

function handleDrop(fromIdx: number, toIdx: number) {
  draggedIndex.value = null
  dragOverIndex.value = null
  emit('reorder', fromIdx, toIdx)
}

function handleDragEnd() {
  draggedIndex.value = null
  dragOverIndex.value = null
}
</script>

<template>
  <main
    class="relative z-10 mx-auto w-full min-h-[440px] px-6 pb-20 transition-all duration-300"
    :class="containerMaxWidth"
    :style="{
      paddingLeft: 'var(--grid-padding, 24px)',
      paddingRight: 'var(--grid-padding, 24px)',
    }"
  >
    <!-- Non-shifting subtle top loading bar -->
    <div
      class="absolute top-0 left-6 right-6 h-0.5 overflow-hidden rounded-full bg-white/5 transition-opacity duration-300"
      :class="[props.isLoading ? 'opacity-100' : 'opacity-0']"
    >
      <div class="h-full w-1/3 animate-pulse rounded-full" :style="{ backgroundColor: 'var(--accent, #10b981)' }" />
    </div>

    <!-- View Switcher Transition with fluid curved mask cross-fade -->
    <Transition name="grid-mask-swap" mode="out-in">
      <div :key="props.activeView" class="w-full">
        <!-- Empty state without layout jumping -->
        <div
          v-if="!props.isLoading && props.tiles.length === 0 && (props.activeView !== 'bookmarks' || !props.showAddCard)"
          class="flex h-64 flex-col items-center justify-center text-center text-white/40"
        >
          <p class="text-sm">No shortcuts or history items in this view</p>
        </div>

        <!-- Main Tile Grid with stable dimensions -->
        <div v-else class="grid pt-2" :style="gridStyle">
          <TileItemCard
            v-for="(tile, idx) in props.tiles"
            :key="tile.id"
            :tile="tile"
            :index="idx"
            :active-view="props.activeView"
            :show-labels="props.showLabels"
            :is-drop-target="dragOverIndex === idx && draggedIndex !== idx"
            @click="emit('clickTile', $event)"
            @edit="emit('editTile', $event)"
            @delete="emit('deleteTile', $event)"
            @close-tab="emit('closeTab', $event)"
            @drag-start="handleDragStart"
            @drag-over="handleDragOver"
            @drop="handleDrop"
            @dragend="handleDragEnd"
          />

          <AddNewTileCard
            v-if="props.activeView === 'bookmarks' && props.showAddCard"
            :show-labels="props.showLabels"
            @add="emit('openAddModal')"
          />
        </div>
      </div>
    </Transition>
  </main>
</template>

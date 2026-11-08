<!--
  SideDockContainer: Tactile hold-to-reorder and cross-dock container for side widgets.
  - Supports Left Dock and Right Dock placements simultaneously.
  - Hold-to-drag interaction matching tile cards with luminous border, scale-up elevation, and dashed drop targets.
  - Seamless drag-and-drop between Left and Right docks.
  - Micro-controls for one-click reordering and side toggling.
  - Zero idle CPU overhead with hardware-accelerated transforms.
-->
<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import {
  GripVertical,
  ArrowLeftRight,
  PanelLeft,
  PanelRight,
  X,
  Minimize2,
  Maximize2,
} from 'lucide-vue-next'
import type {
  SideWidgetId,
  ClockTheme,
} from '../../../1-domain/entities/AppSettings'
import SideClockWidget from '../clock/SideClockWidget.vue'
import CalendarWidget from '../calendar/CalendarWidget.vue'
import StickyNoteWidget from '../stickyNote/StickyNoteWidget.vue'

interface Props {
  side: 'left' | 'right'
  widgetIds: SideWidgetId[]
  collapsedWidgetIds?: SideWidgetId[]
  showClock: boolean
  showCalendar: boolean
  showStickyNote: boolean
  clockTheme?: ClockTheme
  use24h?: boolean
  showYearProgress?: boolean
  showDate?: boolean
  timeOnly?: boolean
  isLight?: boolean
  accentColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  collapsedWidgetIds: () => [],
  clockTheme: 'digital-lcd',
  use24h: true,
  showYearProgress: true,
  showDate: true,
  timeOnly: false,
  isLight: false,
  accentColor: '#10b981',
})

const emit = defineEmits<{
  (e: 'moveWidget', widgetId: SideWidgetId, direction: 'up' | 'down'): void
  (e: 'moveWidgetToSide', widgetId: SideWidgetId, targetSide: 'left' | 'right', targetIndex?: number): void
  (e: 'reorder', fromIndex: number, toIndex: number): void
  (e: 'toggleCollapse', widgetId: SideWidgetId): void
  (e: 'toggleFormat'): void
  (e: 'updateTheme', theme: ClockTheme): void
  (e: 'hideWidget', widgetId: SideWidgetId): void
}>()

function isWidgetCollapsed(widgetId: SideWidgetId): boolean {
  return props.collapsedWidgetIds?.includes(widgetId) ?? false
}

// Active widgets that should be rendered (based on user visibility switches)
const activeWidgets = computed(() => {
  return props.widgetIds.filter((id) => {
    if (id === 'clock') return props.showClock
    if (id === 'calendar') return props.showCalendar
    if (id === 'notes') return props.showStickyNote
    return false
  })
})

// Hold & Drag-and-Drop Reactive State
const heldWidgetId = ref<SideWidgetId | null>(null)
const dropTargetWidgetId = ref<SideWidgetId | null>(null)
const isDockDropTarget = ref<boolean>(false)
const isDraggingActive = ref<boolean>(false)

// Hold timer tracking (mimicking TileItemCard hold feel)
let holdTimer: ReturnType<typeof setTimeout> | null = null
let pointerStartX = 0
let pointerStartY = 0
let activePointerId: number | null = null

function clearHoldTimer() {
  if (holdTimer) {
    clearTimeout(holdTimer)
    holdTimer = null
  }
}

function onPointerDown(widgetId: SideWidgetId, e: PointerEvent) {
  if (e.button !== 0) return
  // Don't trigger hold if user clicked an interactive input or button
  const target = e.target as HTMLElement
  if (
    target.closest('button') ||
    target.closest('input') ||
    target.closest('textarea') ||
    target.closest('select') ||
    target.closest('[data-no-drag]')
  ) {
    return
  }

  clearHoldTimer()
  pointerStartX = e.clientX
  pointerStartY = e.clientY
  activePointerId = e.pointerId

  holdTimer = setTimeout(() => {
    heldWidgetId.value = widgetId
  }, 220)
}

function onPointerMove(e: PointerEvent) {
  if (activePointerId === null) return
  const dx = Math.abs(e.clientX - pointerStartX)
  const dy = Math.abs(e.clientY - pointerStartY)
  if (dx > 8 || dy > 8) {
    clearHoldTimer()
  }
}

function onPointerUp() {
  clearHoldTimer()
  activePointerId = null
}

function cancelHeld() {
  clearHoldTimer()
  heldWidgetId.value = null
  dropTargetWidgetId.value = null
  isDockDropTarget.value = false
}

// Global dismiss listeners when held
function onGlobalKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') cancelHeld()
}

function onGlobalPointerUp() {
  cancelHeld()
}

watch(heldWidgetId, (val) => {
  if (val) {
    window.addEventListener('keydown', onGlobalKeydown)
    window.addEventListener('pointerup', onGlobalPointerUp)
  } else {
    window.removeEventListener('keydown', onGlobalKeydown)
    window.removeEventListener('pointerup', onGlobalPointerUp)
  }
})

onUnmounted(() => {
  clearHoldTimer()
  window.removeEventListener('keydown', onGlobalKeydown)
  window.removeEventListener('pointerup', onGlobalPointerUp)
})

// Native HTML5 Drag and Drop handlers
function onDragStart(widgetId: SideWidgetId, index: number, event: DragEvent) {
  clearHoldTimer()
  heldWidgetId.value = widgetId
  isDraggingActive.value = true

  const payload = {
    widgetId,
    sourceSide: props.side,
    sourceIndex: index,
  }

  event.dataTransfer?.setData('application/json', JSON.stringify(payload))
  event.dataTransfer?.setData('text/plain', widgetId)
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function onDragEnd() {
  isDraggingActive.value = false
  cancelHeld()
}

function onDragOverItem(widgetId: SideWidgetId, event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  if (dropTargetWidgetId.value !== widgetId) {
    dropTargetWidgetId.value = widgetId
  }
}

function onDragLeaveItem(widgetId: SideWidgetId, event: DragEvent) {
  // Prevent flickering when dragging over child elements
  const current = event.currentTarget as HTMLElement
  const related = event.relatedTarget as Node | null
  if (current && related && current.contains(related)) return
  if (dropTargetWidgetId.value === widgetId) {
    dropTargetWidgetId.value = null
  }
}

function onDropItem(_targetWidgetId: SideWidgetId, targetIndex: number, event: DragEvent) {
  event.preventDefault()
  dropTargetWidgetId.value = null
  isDockDropTarget.value = false
  isDraggingActive.value = false

  try {
    const raw = event.dataTransfer?.getData('application/json')
    if (raw) {
      const data = JSON.parse(raw) as {
        widgetId: SideWidgetId
        sourceSide: 'left' | 'right'
        sourceIndex: number
      }

      if (data.sourceSide === props.side) {
        // Reorder within the same dock
        if (data.sourceIndex !== targetIndex) {
          emit('reorder', data.sourceIndex, targetIndex)
        }
      } else {
        // Move across from the other dock into target index
        emit('moveWidgetToSide', data.widgetId, props.side, targetIndex)
      }
      return
    }

    const plainId = event.dataTransfer?.getData('text/plain') as SideWidgetId
    if (plainId) {
      emit('moveWidgetToSide', plainId, props.side, targetIndex)
    }
  } catch {}
}

function onDragOverDock(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  isDockDropTarget.value = true
}

function onDragLeaveDock(event: DragEvent) {
  const current = event.currentTarget as HTMLElement
  const related = event.relatedTarget as Node | null
  if (current && related && current.contains(related)) return
  isDockDropTarget.value = false
}

function onDropDock(event: DragEvent) {
  event.preventDefault()
  isDockDropTarget.value = false
  dropTargetWidgetId.value = null
  isDraggingActive.value = false

  try {
    const raw = event.dataTransfer?.getData('application/json')
    if (raw) {
      const data = JSON.parse(raw) as {
        widgetId: SideWidgetId
        sourceSide: 'left' | 'right'
        sourceIndex: number
      }
      if (data.sourceSide !== props.side) {
        emit('moveWidgetToSide', data.widgetId, props.side)
      }
      return
    }

    const plainId = event.dataTransfer?.getData('text/plain') as SideWidgetId
    if (plainId) {
      emit('moveWidgetToSide', plainId, props.side)
    }
  } catch {}
}

function toggleSide(widgetId: SideWidgetId) {
  const targetSide = props.side === 'left' ? 'right' : 'left'
  emit('moveWidgetToSide', widgetId, targetSide)
}
</script>

<template>
  <aside
    class="group/aside pointer-events-auto fixed top-24 z-20 hidden w-52 flex-col gap-3 select-none min-[860px]:flex xl:w-56 2xl:w-60 transition-all duration-300"
    :class="[
      props.side === 'right'
        ? 'right-5 xl:right-8 2xl:right-10'
        : 'left-5 xl:left-8 2xl:left-10',
    ]"
    :aria-label="`${props.side === 'left' ? 'Left' : 'Right'} Side Dock`"
    @dragover="onDragOverDock"
    @dragleave="onDragLeaveDock"
    @drop="onDropDock"
  >
    <!-- Render each active widget in this dock -->
    <template v-for="(widgetId, idx) in activeWidgets" :key="widgetId">
      <div
        class="widget-wrapper group/dock relative transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        :data-widget-id="widgetId"
        :class="[
          heldWidgetId === widgetId
            ? 'scale-105 -translate-y-2 ring-2 ring-offset-2 ring-offset-black/50 shadow-2xl z-30'
            : '',
          dropTargetWidgetId === widgetId
            ? 'ring-2 ring-dashed scale-95 shadow-inner'
            : '',
        ]"
        :style="{
          borderColor:
            heldWidgetId === widgetId || dropTargetWidgetId === widgetId
              ? props.accentColor
              : undefined,
          '--tw-ring-color':
            heldWidgetId === widgetId || dropTargetWidgetId === widgetId
              ? props.accentColor
              : undefined,
          backgroundColor:
            dropTargetWidgetId === widgetId
              ? 'var(--accent-15)'
              : undefined,
        }"
        draggable="true"
        @pointerdown="onPointerDown(widgetId, $event)"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @dragstart="onDragStart(widgetId, idx, $event)"
        @dragend="onDragEnd"
        @dragover="onDragOverItem(widgetId, $event)"
        @dragleave="onDragLeaveItem(widgetId, $event)"
        @drop.stop="onDropItem(widgetId, idx, $event)"
      >
        <!-- Floating Subtle Header Drag/Side Action Bar on Hover/Hold -->
        <div
          class="pointer-events-none absolute -top-2.5 inset-x-2 z-40 flex items-center justify-between opacity-0 transition-opacity duration-200 group-hover/dock:opacity-100 group-hover/dock:pointer-events-auto"
          :class="{ 'opacity-100 pointer-events-auto': heldWidgetId === widgetId }"
        >
          <!-- Grip / Hold Indicator Pill -->
          <div
            class="flex items-center gap-1 rounded-full border border-white/15 bg-black/80 px-2 py-0.5 text-[9.5px] font-medium text-white/80 shadow-md backdrop-blur-md cursor-grab active:cursor-grabbing"
            title="Hold or drag to change place"
          >
            <GripVertical class="h-3 w-3 text-white/50" />
            <span>Hold to move</span>
          </div>

          <div class="flex items-center gap-1">
            <!-- Minimize / Expand Button ("make it turn into something small" / restore) -->
            <button
              type="button"
              :title="isWidgetCollapsed(widgetId) ? 'Expand widget (full size)' : 'Make small (compact view)'"
              class="flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-black/80 text-white/70 hover:bg-white/20 hover:text-white shadow-md backdrop-blur-md transition-all active:scale-90 cursor-pointer"
              @click.stop="emit('toggleCollapse', widgetId)"
            >
              <component :is="isWidgetCollapsed(widgetId) ? Maximize2 : Minimize2" class="h-2.5 w-2.5" />
            </button>

            <!-- Quick Move to Other Dock -->
            <button
              type="button"
              :title="props.side === 'left' ? 'Move to Right Dock' : 'Move to Left Dock'"
              class="flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-black/80 text-white/70 shadow-md backdrop-blur-md transition-transform hover:scale-110 hover:text-[var(--accent)] active:scale-90 cursor-pointer"
              @click.stop="toggleSide(widgetId)"
            >
              <ArrowLeftRight class="h-3 w-3" />
            </button>

            <!-- Close / Hide Widget (0% CPU) -->
            <button
              type="button"
              title="Close widget (0% usage)"
              class="flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-black/80 text-white/70 hover:bg-rose-500/80 hover:text-white shadow-md backdrop-blur-md transition-all active:scale-90 cursor-pointer"
              @click.stop="emit('hideWidget', widgetId)"
            >
              <X class="h-3 w-3" />
            </button>
          </div>
        </div>

        <!-- Clock Widget Component -->
        <SideClockWidget
          v-if="widgetId === 'clock'"
          :clock-theme="props.clockTheme"
          :use-24h="props.use24h"
          :show-year-progress="props.showYearProgress"
          :show-date="props.showDate"
          :time-only="props.timeOnly"
          :is-light="props.isLight"
          :accent-color="props.accentColor"
          :is-small="isWidgetCollapsed(widgetId)"
          @toggle-small="emit('toggleCollapse', widgetId)"
          @toggle-format="emit('toggleFormat')"
          @update-theme="emit('updateTheme', $event)"
        />

        <!-- Calendar Widget Component -->
        <CalendarWidget
          v-else-if="widgetId === 'calendar'"
          :accent-color="props.accentColor"
          :is-light="props.isLight"
          :is-small="isWidgetCollapsed(widgetId)"
          @toggle-small="emit('toggleCollapse', widgetId)"
        />

        <!-- Sticky Note Widget Component -->
        <StickyNoteWidget
          v-else-if="widgetId === 'notes'"
          :is-small="isWidgetCollapsed(widgetId)"
          @toggle-small="emit('toggleCollapse', widgetId)"
        />
      </div>
    </template>

    <!-- Drop Target Zone (ONLY visible during active drag over this dock) -->
    <div
      v-if="isDockDropTarget"
      class="flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed p-5 text-center transition-all duration-300 select-none cursor-pointer border-[var(--accent)] bg-[var(--accent-15)] text-white scale-102 shadow-lg shadow-black/20"
      @dragover="onDragOverDock"
      @dragleave="onDragLeaveDock"
      @drop.stop="onDropDock"
    >
      <component
        :is="props.side === 'left' ? PanelLeft : PanelRight"
        class="h-5 w-5 opacity-80"
        :style="{ color: props.accentColor }"
      />
      <span class="text-xs font-semibold">
        {{ props.side === 'left' ? 'Left Dock' : 'Right Dock' }}
      </span>
      <span class="text-[10px] text-white/70">
        Release to drop widget here
      </span>
    </div>
  </aside>
</template>

<style scoped>
.widget-wrapper {
  will-change: transform, opacity;
  border-radius: 16px;
}
</style>

<!--
  SettingsLayoutSection component configuring grid metrics, visibility toggles, and performance.
  Includes particles management, Zod-validated JSON configuration import/export, and defaults reset.
-->
<script setup lang="ts">
import {
  Download,
  Upload,
  RotateCcw,
  Clock,
  Calendar,
  StickyNote,
  Monitor,
  Landmark,
  Sparkles,
  Box,
  Gamepad2,
  LayoutGrid,
  ArrowUp,
  ArrowDown,
  PanelLeft,
  PanelRight,
} from 'lucide-vue-next'
import type {
  AppSettings,
  ParticleMode,
  ClockTheme,
  TileStyle,
  SideWidgetId,
  SidePanelPosition,
} from '../../../1-domain/entities/AppSettings'
import { isColorBright } from '../../../2-application/services/colorUtils'

interface Props {
  settings: AppSettings
}
const props = defineProps<Props>()

const COLUMN_PRESETS = [2, 3, 4, 5, 6, 8, 10]

const TILE_STYLES: Array<{
  id: TileStyle
  label: string
  desc: string
  icon: any
}> = [
  {
    id: 'glassmorphic',
    label: 'Glassmorphic',
    desc: 'Translucent frosted glass with soft glow',
    icon: Sparkles,
  },
  {
    id: 'minecraft-2d',
    label: '2D Minecraft',
    desc: 'Pixelated blocks & inventory slot bevels',
    icon: Box,
  },
  {
    id: 'retro-pixel',
    label: 'Retro Pixel',
    desc: '8-bit arcade borders & hard shadows',
    icon: Gamepad2,
  },
  {
    id: 'minimal-flat',
    label: 'Minimal Flat',
    desc: 'Clean borderless subtle cards',
    icon: LayoutGrid,
  },
]

const CLOCK_THEMES: Array<{
  id: ClockTheme
  label: string
  desc: string
  icon: any
}> = [
  {
    id: 'digital-lcd',
    label: 'Digital LCD',
    desc: '7-segment with ghost lines',
    icon: Monitor,
  },
  {
    id: 'digital-clean',
    label: 'Digital Clean',
    desc: 'Active 7-segment lines only',
    icon: Sparkles,
  },
  {
    id: 'clock-tower',
    label: 'Clock Tower',
    desc: 'Roman numeral tower dial',
    icon: Landmark,
  },
  {
    id: 'minimal',
    label: 'Minimal Clean',
    desc: 'Modern typography display',
    icon: Clock,
  },
]

const emit = defineEmits<{
  (e: 'update', partial: Partial<AppSettings>): void
  (e: 'export'): void
  (e: 'import', text: string): void
  (e: 'reset'): void
}>()

const SIDE_WIDGET_CONFIG: Record<
  SideWidgetId,
  { label: string; desc: string; icon: any }
> = {
  clock: {
    label: 'Side Clock',
    desc: 'Time, date & year progress display',
    icon: Clock,
  },
  calendar: {
    label: 'Calendar',
    desc: 'Interactive monthly calendar',
    icon: Calendar,
  },
  notes: {
    label: 'Sticky Note',
    desc: 'Peelable desktop notes & pad',
    icon: StickyNote,
  },
}

function moveWidget(id: SideWidgetId, direction: 'up' | 'down') {
  const current = [...(props.settings.sideWidgetsOrder || ['clock', 'calendar', 'notes'])]
  const idx = current.indexOf(id)
  if (idx === -1) return
  const targetIdx = direction === 'up' ? idx - 1 : idx + 1
  if (targetIdx < 0 || targetIdx >= current.length) return
  const temp = current[idx]
  current[idx] = current[targetIdx]
  current[targetIdx] = temp
  emit('update', { sideWidgetsOrder: current })
}

function setSidePosition(pos: SidePanelPosition) {
  emit('update', { sidePanelPosition: pos })
}

function onImportFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => emit('import', reader.result as string)
  reader.readAsText(file)
}
</script>

<template>
  <div class="space-y-4 text-xs text-white/80">
    <!-- Tile Style Design Picker (2D Minecraft, Retro Pixel, Glassmorphic, Minimal) -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <span class="font-medium text-white/90">Tile Design Style</span>
        <span class="text-[10px] text-white/40">2D Minecraft, Retro, Glass</span>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="ts in TILE_STYLES"
          :key="ts.id"
          type="button"
          class="flex flex-col items-start gap-1 p-2.5 rounded-lg border text-left transition-all duration-200 cursor-pointer"
          :class="[
            props.settings.tileStyle === ts.id
              ? 'text-white shadow-sm'
              : 'border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20 hover:bg-white/[0.08] hover:text-white',
          ]"
          :style="props.settings.tileStyle === ts.id ? {
            borderColor: props.settings.accentColor,
            backgroundColor: `${props.settings.accentColor}20`,
            boxShadow: `0 0 10px 0 ${props.settings.accentColor}30`,
          } : undefined"
          @click="emit('update', { tileStyle: ts.id })"
        >
          <div class="flex items-center gap-1.5 w-full">
            <component
              :is="ts.icon"
              class="h-3.5 w-3.5 shrink-0"
              :style="{ color: props.settings.tileStyle === ts.id ? props.settings.accentColor : undefined }"
            />
            <span class="font-medium text-[11px] truncate">{{ ts.label }}</span>
          </div>
          <span class="text-[9px] text-white/40 leading-tight">{{ ts.desc }}</span>
        </button>
      </div>
    </div>

    <!-- Grid Dimensions & Spacing Sliders -->
    <div class="border-t border-white/10 pt-3 space-y-3">
      <div class="flex items-center justify-between">
        <span class="font-medium text-white/90">Grid Layout & Spacing</span>
        <span class="text-[10px] text-white/40">Margins, gaps, paddings</span>
      </div>

      <!-- Grid Columns with Quick Presets -->
      <div class="space-y-1.5">
        <div class="flex justify-between items-center">
          <span>Grid Columns</span>
          <span class="font-mono font-semibold" :style="{ color: props.settings.accentColor }">
            {{ props.settings.gridCols }} cols {{ props.settings.gridCols === 4 ? '(Bento 1 1 2 2)' : '' }}
          </span>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="cols in COLUMN_PRESETS"
            :key="cols"
            type="button"
            class="flex-1 min-w-[32px] rounded-lg border py-1 text-center text-xs font-mono font-medium transition-all cursor-pointer"
            :class="[
              props.settings.gridCols === cols
                ? 'shadow-sm font-bold'
                : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.1] text-white/70',
            ]"
            :style="props.settings.gridCols === cols ? {
              borderColor: props.settings.accentColor,
              backgroundColor: props.settings.accentColor,
              color: isColorBright(props.settings.accentColor) ? '#0f172a' : '#ffffff',
            } : undefined"
            @click="emit('update', { gridCols: cols })"
          >
            {{ cols }}
          </button>
        </div>
        <input
          type="range"
          min="2"
          max="10"
          :value="props.settings.gridCols"
          class="mt-1 w-full cursor-pointer"
          :style="{ accentColor: props.settings.accentColor }"
          @input="
            emit('update', {
              gridCols: Number(($event.target as HTMLInputElement).value),
            })
          "
        />
      </div>

      <!-- Card Height -->
      <div>
        <div class="flex justify-between">
          <span>Card Height</span>
          <span class="font-mono" :style="{ color: props.settings.accentColor }">{{ props.settings.cardHeight }}px</span>
        </div>
        <input
          type="range"
          min="70"
          max="220"
          :value="props.settings.cardHeight"
          class="mt-1 w-full cursor-pointer"
          :style="{ accentColor: props.settings.accentColor }"
          @input="
            emit('update', {
              cardHeight: Number(($event.target as HTMLInputElement).value),
            })
          "
        />
      </div>

      <!-- Tile Spacing / Gap (Margin between tiles) -->
      <div>
        <div class="flex justify-between">
          <span>Tile Spacing (Margin / Gap)</span>
          <span class="font-mono" :style="{ color: props.settings.accentColor }">{{ props.settings.tileGap }}px</span>
        </div>
        <input
          type="range"
          min="4"
          max="48"
          :value="props.settings.tileGap"
          class="mt-1 w-full cursor-pointer"
          :style="{ accentColor: props.settings.accentColor }"
          @input="
            emit('update', {
              tileGap: Number(($event.target as HTMLInputElement).value),
            })
          "
        />
      </div>

      <!-- Outer Grid Margin / Padding -->
      <div>
        <div class="flex justify-between">
          <span>Grid Outer Padding</span>
          <span class="font-mono" :style="{ color: props.settings.accentColor }">{{ props.settings.gridPadding ?? 24 }}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="64"
          :value="props.settings.gridPadding ?? 24"
          class="mt-1 w-full cursor-pointer"
          :style="{ accentColor: props.settings.accentColor }"
          @input="
            emit('update', {
              gridPadding: Number(($event.target as HTMLInputElement).value),
            })
          "
        />
      </div>

      <!-- Card Inner Padding -->
      <div>
        <div class="flex justify-between">
          <span>Tile Inner Padding</span>
          <span class="font-mono" :style="{ color: props.settings.accentColor }">{{ props.settings.tilePadding ?? 16 }}px</span>
        </div>
        <input
          type="range"
          min="4"
          max="32"
          :value="props.settings.tilePadding ?? 16"
          class="mt-1 w-full cursor-pointer"
          :style="{ accentColor: props.settings.accentColor }"
          @input="
            emit('update', {
              tilePadding: Number(($event.target as HTMLInputElement).value),
            })
          "
        />
      </div>

      <!-- Corner Radius -->
      <div>
        <div class="flex justify-between">
          <span>Corner Radius</span>
          <span class="font-mono" :style="{ color: props.settings.accentColor }">
            {{ props.settings.tileStyle === 'minecraft-2d' || props.settings.tileStyle === 'retro-pixel' ? '0px (Blocky)' : `${props.settings.tileRadius}px` }}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="32"
          :disabled="props.settings.tileStyle === 'minecraft-2d' || props.settings.tileStyle === 'retro-pixel'"
          :value="props.settings.tileRadius"
          class="mt-1 w-full cursor-pointer disabled:opacity-40"
          :style="{ accentColor: props.settings.accentColor }"
          @input="
            emit('update', {
              tileRadius: Number(($event.target as HTMLInputElement).value),
            })
          "
        />
      </div>
    </div>

    <!-- Feature & Visibility Toggles (Every feature has a toggle to turn it off) -->
    <div class="border-t border-white/10 pt-3 space-y-3 select-none">
      <div class="flex items-center justify-between">
        <span class="font-medium text-white/70">Feature Toggles</span>
        <span class="text-[10px] text-white/40">Turn any element on / off</span>
      </div>

      <!-- Widgets & Screen Elements -->
      <div class="space-y-1.5">
        <span class="text-[10px] font-semibold tracking-wider uppercase" :style="{ color: props.settings.accentColor }">
          Widgets & Display
        </span>
        <div class="grid grid-cols-2 gap-2">
          <label
            class="flex items-center gap-2 cursor-pointer rounded-lg border border-white/5 bg-white/[0.03] p-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:border-white/15 hover:bg-white/[0.08] active:scale-[0.98]"
          >
            <input
              type="checkbox"
              :checked="props.settings.showGreeting"
              class="rounded cursor-pointer transition-transform hover:scale-110"
              :style="{ accentColor: props.settings.accentColor }"
              @change="
                emit('update', {
                  showGreeting: ($event.target as HTMLInputElement).checked,
                })
              "
            />
            <span>Greeting</span>
          </label>

          <label
            class="flex items-center gap-2 cursor-pointer rounded-lg border border-white/5 bg-white/[0.03] p-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:border-white/15 hover:bg-white/[0.08] active:scale-[0.98]"
          >
            <input
              type="checkbox"
              :checked="props.settings.showSearch"
              class="rounded cursor-pointer transition-transform hover:scale-110"
              :style="{ accentColor: props.settings.accentColor }"
              @change="
                emit('update', {
                  showSearch: ($event.target as HTMLInputElement).checked,
                })
              "
            />
            <span>Search Bar</span>
          </label>

          <label
            class="flex items-center gap-2 cursor-pointer rounded-lg border border-white/5 bg-white/[0.03] p-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:border-white/15 hover:bg-white/[0.08] active:scale-[0.98]"
          >
            <input
              type="checkbox"
              :checked="props.settings.showSideClock"
              class="rounded cursor-pointer transition-transform hover:scale-110"
              :style="{ accentColor: props.settings.accentColor }"
              @change="
                emit('update', {
                  showSideClock: ($event.target as HTMLInputElement).checked,
                })
              "
            />
            <span>Side Clock</span>
          </label>

          <label
            class="flex items-center gap-2 cursor-pointer rounded-lg border border-white/5 bg-white/[0.03] p-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:border-white/15 hover:bg-white/[0.08] active:scale-[0.98]"
          >
            <input
              type="checkbox"
              :checked="props.settings.showCalendar"
              class="rounded cursor-pointer transition-transform hover:scale-110"
              :style="{ accentColor: props.settings.accentColor }"
              @change="
                emit('update', {
                  showCalendar: ($event.target as HTMLInputElement).checked,
                })
              "
            />
            <span>Calendar</span>
          </label>

          <label
            class="flex items-center gap-2 cursor-pointer rounded-lg border border-white/5 bg-white/[0.03] p-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:border-white/15 hover:bg-white/[0.08] active:scale-[0.98]"
          >
            <input
              type="checkbox"
              :checked="props.settings.showStickyNote"
              class="rounded cursor-pointer transition-transform hover:scale-110"
              :style="{ accentColor: props.settings.accentColor }"
              @change="
                emit('update', {
                  showStickyNote: ($event.target as HTMLInputElement).checked,
                })
              "
            />
            <span>Sticky Note</span>
          </label>

          <label
            class="flex items-center gap-2 cursor-pointer rounded-lg border border-white/5 bg-white/[0.03] p-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:border-white/15 hover:bg-white/[0.08] active:scale-[0.98]"
          >
            <input
              type="checkbox"
              :checked="props.settings.showYearProgress"
              class="rounded cursor-pointer transition-transform hover:scale-110"
              :style="{ accentColor: props.settings.accentColor }"
              @change="
                emit('update', {
                  showYearProgress: ($event.target as HTMLInputElement).checked,
                })
              "
            />
            <span>Year Progress</span>
          </label>

          <label
            class="flex items-center gap-2 cursor-pointer rounded-lg border border-white/5 bg-white/[0.03] p-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:border-white/15 hover:bg-white/[0.08] active:scale-[0.98]"
          >
            <input
              type="checkbox"
              :checked="props.settings.clock24h"
              class="rounded cursor-pointer transition-transform hover:scale-110"
              :style="{ accentColor: props.settings.accentColor }"
              @change="
                emit('update', {
                  clock24h: ($event.target as HTMLInputElement).checked,
                })
              "
            />
            <span>24H Format</span>
          </label>

          <label
            class="flex items-center gap-2 cursor-pointer rounded-lg border border-white/5 bg-white/[0.03] p-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:border-white/15 hover:bg-white/[0.08] active:scale-[0.98]"
          >
            <input
              type="checkbox"
              :checked="props.settings.showAudioPlayer"
              class="rounded cursor-pointer transition-transform hover:scale-110"
              :style="{ accentColor: props.settings.accentColor }"
              @change="
                emit('update', {
                  showAudioPlayer: ($event.target as HTMLInputElement).checked,
                })
              "
            />
            <span>Audio Player</span>
          </label>

          <label
            class="flex items-center gap-2 cursor-pointer rounded-lg border border-white/5 bg-white/[0.03] p-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:border-white/15 hover:bg-white/[0.08] active:scale-[0.98]"
          >
            <input
              type="checkbox"
              :checked="props.settings.showCustomWallpaper"
              class="rounded cursor-pointer transition-transform hover:scale-110"
              :style="{ accentColor: props.settings.accentColor }"
              @change="
                emit('update', {
                  showCustomWallpaper: ($event.target as HTMLInputElement).checked,
                })
              "
            />
            <span>Custom Media</span>
          </label>
        </div>

        <!-- Clock Theme Style Selector -->
        <div v-if="props.settings.showSideClock" class="mt-3 space-y-2 border-t border-white/10 pt-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-semibold tracking-wider uppercase" :style="{ color: props.settings.accentColor }">
              Clock Theme
            </span>
            <span class="text-[10px] text-white/40">4 distinct styles</span>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="ct in CLOCK_THEMES"
              :key="ct.id"
              type="button"
              class="flex flex-col items-start gap-1 p-2 rounded-lg border text-left transition-all duration-200"
              :class="[
                props.settings.clockTheme === ct.id
                  ? 'text-white shadow-sm'
                  : 'border-white/5 bg-white/[0.03] text-white/70 hover:border-white/15 hover:bg-white/[0.08] hover:text-white',
              ]"
              :style="props.settings.clockTheme === ct.id ? {
                borderColor: props.settings.accentColor,
                backgroundColor: `${props.settings.accentColor}18`,
                boxShadow: `0 0 10px 0 ${props.settings.accentColor}30`,
              } : undefined"
              @click="emit('update', { clockTheme: ct.id })"
            >
              <div class="flex items-center gap-1.5 w-full">
                <component
                  :is="ct.icon"
                  class="h-3.5 w-3.5 shrink-0"
                  :style="{ color: props.settings.clockTheme === ct.id ? props.settings.accentColor : undefined }"
                />
                <span class="font-medium text-[11px] truncate">{{ ct.label }}</span>
              </div>
              <span class="text-[9px] text-white/40 leading-tight">{{ ct.desc }}</span>
            </button>
          </div>
        </div>

        <!-- Side Dock Placement & Order Management ("on their place only") -->
        <div
          v-if="props.settings.showSideClock || props.settings.showCalendar || props.settings.showStickyNote"
          class="mt-3 space-y-2.5 border-t border-white/10 pt-3"
        >
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-semibold tracking-wider uppercase" :style="{ color: props.settings.accentColor }">
              Side Dock Placement & Order
            </span>
            <span class="text-[10px] text-white/40">In-dock arrangement</span>
          </div>

          <!-- Dock Position Selector (Left vs Right) -->
          <div class="flex gap-1.5 p-1 rounded-lg border border-white/10 bg-white/[0.03]">
            <button
              type="button"
              class="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer"
              :class="props.settings.sidePanelPosition === 'left' ? 'text-white shadow-sm' : 'text-white/60 hover:text-white'"
              :style="props.settings.sidePanelPosition === 'left' ? {
                backgroundColor: `${props.settings.accentColor}25`,
                color: props.settings.accentColor,
              } : undefined"
              @click="setSidePosition('left')"
            >
              <PanelLeft class="h-3.5 w-3.5" />
              <span>Left Dock</span>
            </button>
            <button
              type="button"
              class="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer"
              :class="props.settings.sidePanelPosition === 'right' ? 'text-white shadow-sm' : 'text-white/60 hover:text-white'"
              :style="props.settings.sidePanelPosition === 'right' ? {
                backgroundColor: `${props.settings.accentColor}25`,
                color: props.settings.accentColor,
              } : undefined"
              @click="setSidePosition('right')"
            >
              <PanelRight class="h-3.5 w-3.5" />
              <span>Right Dock</span>
            </button>
          </div>

          <!-- Reorderable List of Widgets in Dock -->
          <div class="space-y-1.5 pt-1">
            <div
              v-for="(wId, idx) in props.settings.sideWidgetsOrder || ['clock', 'calendar', 'notes']"
              :key="wId"
              class="flex items-center justify-between p-2 rounded-lg border border-white/5 bg-white/[0.03] transition-all hover:border-white/15"
            >
              <div class="flex items-center gap-2 min-w-0">
                <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-white/10 text-[10px] font-mono text-white/70">
                  #{{ idx + 1 }}
                </span>
                <component
                  :is="SIDE_WIDGET_CONFIG[wId].icon"
                  class="h-3.5 w-3.5 shrink-0 opacity-80"
                  :style="{ color: props.settings.accentColor }"
                />
                <div class="flex flex-col min-w-0">
                  <span class="text-xs font-medium text-white truncate">
                    {{ SIDE_WIDGET_CONFIG[wId].label }}
                  </span>
                  <span class="text-[9.5px] text-white/40 truncate">
                    {{ SIDE_WIDGET_CONFIG[wId].desc }}
                  </span>
                </div>
              </div>

              <!-- Reorder Action Buttons -->
              <div class="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  title="Move up"
                  :disabled="idx === 0"
                  class="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-white/5 text-white/70 transition-all hover:bg-white/15 hover:text-white disabled:opacity-20 disabled:pointer-events-none active:scale-90 cursor-pointer"
                  @click="moveWidget(wId, 'up')"
                >
                  <ArrowUp class="h-3 w-3" />
                </button>
                <button
                  type="button"
                  title="Move down"
                  :disabled="idx === (props.settings.sideWidgetsOrder?.length || 3) - 1"
                  class="flex h-6 w-6 items-center justify-center rounded border border-white/10 bg-white/5 text-white/70 transition-all hover:bg-white/15 hover:text-white disabled:opacity-20 disabled:pointer-events-none active:scale-90 cursor-pointer"
                  @click="moveWidget(wId, 'down')"
                >
                  <ArrowDown class="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Shortcuts & Navigation -->
      <div class="space-y-1.5 pt-1">
        <span class="text-[10px] font-semibold tracking-wider uppercase" :style="{ color: props.settings.accentColor }">
          Shortcuts & Navigation
        </span>
        <div class="grid grid-cols-2 gap-2">
          <label
            class="flex items-center gap-2 cursor-pointer rounded-lg border border-white/5 bg-white/[0.03] p-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:border-white/15 hover:bg-white/[0.08] active:scale-[0.98]"
          >
            <input
              type="checkbox"
              :checked="props.settings.showTileGrid"
              class="rounded cursor-pointer transition-transform hover:scale-110"
              :style="{ accentColor: props.settings.accentColor }"
              @change="
                emit('update', {
                  showTileGrid: ($event.target as HTMLInputElement).checked,
                })
              "
            />
            <span>Tile Grid</span>
          </label>

          <label
            class="flex items-center gap-2 cursor-pointer rounded-lg border border-white/5 bg-white/[0.03] p-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:border-white/15 hover:bg-white/[0.08] active:scale-[0.98]"
          >
            <input
              type="checkbox"
              :checked="props.settings.showNavTabs"
              class="rounded cursor-pointer transition-transform hover:scale-110"
              :style="{ accentColor: props.settings.accentColor }"
              @change="
                emit('update', {
                  showNavTabs: ($event.target as HTMLInputElement).checked,
                })
              "
            />
            <span>Header Tabs</span>
          </label>

          <label
            class="flex items-center gap-2 cursor-pointer rounded-lg border border-white/5 bg-white/[0.03] p-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:border-white/15 hover:bg-white/[0.08] active:scale-[0.98]"
          >
            <input
              type="checkbox"
              :checked="props.settings.showLogo"
              class="rounded cursor-pointer transition-transform hover:scale-110"
              :style="{ accentColor: props.settings.accentColor }"
              @change="
                emit('update', {
                  showLogo: ($event.target as HTMLInputElement).checked,
                })
              "
            />
            <span>Brand Logo</span>
          </label>

          <label
            class="flex items-center gap-2 cursor-pointer rounded-lg border border-white/5 bg-white/[0.03] p-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:border-white/15 hover:bg-white/[0.08] active:scale-[0.98]"
          >
            <input
              type="checkbox"
              :checked="props.settings.showSortBar"
              class="rounded cursor-pointer transition-transform hover:scale-110"
              :style="{ accentColor: props.settings.accentColor }"
              @change="
                emit('update', {
                  showSortBar: ($event.target as HTMLInputElement).checked,
                })
              "
            />
            <span>Sort Pill</span>
          </label>

          <label
            class="flex items-center gap-2 cursor-pointer rounded-lg border border-white/5 bg-white/[0.03] p-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:border-white/15 hover:bg-white/[0.08] active:scale-[0.98]"
          >
            <input
              type="checkbox"
              :checked="props.settings.showLabels"
              class="rounded cursor-pointer transition-transform hover:scale-110"
              :style="{ accentColor: props.settings.accentColor }"
              @change="
                emit('update', {
                  showLabels: ($event.target as HTMLInputElement).checked,
                })
              "
            />
            <span>Tile Labels</span>
          </label>

          <label
            class="flex items-center gap-2 cursor-pointer rounded-lg border border-white/5 bg-white/[0.03] p-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:border-white/15 hover:bg-white/[0.08] active:scale-[0.98]"
          >
            <input
              type="checkbox"
              :checked="props.settings.showAddCard"
              class="rounded cursor-pointer transition-transform hover:scale-110"
              :style="{ accentColor: props.settings.accentColor }"
              @change="
                emit('update', {
                  showAddCard: ($event.target as HTMLInputElement).checked,
                })
              "
            />
            <span>Add (+) Slot</span>
          </label>

          <label
            class="flex items-center gap-2 cursor-pointer rounded-lg border border-white/5 bg-white/[0.03] p-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:border-white/15 hover:bg-white/[0.08] active:scale-[0.98]"
          >
            <input
              type="checkbox"
              :checked="props.settings.showScrollProgress"
              class="rounded cursor-pointer transition-transform hover:scale-110"
              :style="{ accentColor: props.settings.accentColor }"
              @change="
                emit('update', {
                  showScrollProgress: ($event.target as HTMLInputElement).checked,
                })
              "
            />
            <span>Scroll Line</span>
          </label>

          <label
            class="flex items-center gap-2 cursor-pointer rounded-lg border border-white/5 bg-white/[0.03] p-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:border-white/15 hover:bg-white/[0.08] active:scale-[0.98]"
          >
            <input
              type="checkbox"
              :checked="props.settings.openInNewTab"
              class="rounded cursor-pointer transition-transform hover:scale-110"
              :style="{ accentColor: props.settings.accentColor }"
              @change="
                emit('update', {
                  openInNewTab: ($event.target as HTMLInputElement).checked,
                })
              "
            />
            <span>Open in Tab</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Particles & Performance -->
    <div class="border-t border-white/10 pt-3 space-y-2 select-none">
      <span class="block font-medium text-white/70">Particles Engine</span>
      <select
        :value="props.settings.particleMode"
        class="settings-select w-full rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 pr-10 text-xs text-white outline-none cursor-pointer transition-all duration-200"
        :style="{ '--tw-ring-color': props.settings.accentColor }"
        @change="
          emit('update', {
            particleMode: ($event.target as HTMLSelectElement)
              .value as ParticleMode,
          })
        "
      >
        <option value="off">Off (0% CPU / GPU Static Mode)</option>
        <option value="cosmic-dust">Cosmic Dust</option>
        <option value="sakura-horizon">Sakura Horizon</option>
        <option value="starfield">Starfield</option>
      </select>
    </div>

    <!-- Backup, Sync & Reset -->
    <div class="border-t border-white/10 pt-3 space-y-2 select-none">
      <span class="block font-medium text-white/70">Backup & Reset</span>
      <div class="grid grid-cols-2 gap-2">
        <button
          type="button"
          class="flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/10 py-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/20 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95 cursor-pointer"
          @click="emit('export')"
        >
          <Download class="h-3.5 w-3.5" /> Export JSON
        </button>
        <label
          class="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/10 py-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/20 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95"
        >
          <Upload class="h-3.5 w-3.5" /> Import JSON
          <input
            type="file"
            accept=".json"
            class="hidden"
            @change="onImportFile"
          />
        </label>
      </div>
      <button
        type="button"
        class="w-full rounded-lg border border-rose-500/30 bg-rose-500/10 py-2 text-rose-300 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-rose-500/20 hover:-translate-y-0.5 hover:scale-[1.01] active:scale-95 cursor-pointer"
        @click="emit('reset')"
      >
        <RotateCcw class="inline mr-1 h-3.5 w-3.5" /> Reset to Defaults
      </button>
    </div>
  </div>
</template>

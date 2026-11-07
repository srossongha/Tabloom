<!--
  SettingsLayoutSection component configuring grid metrics, visibility toggles, and performance.
  Includes particles management, Zod-validated JSON configuration import/export, and defaults reset.
-->
<script setup lang="ts">
import { Download, Upload, RotateCcw, Clock, Monitor, Landmark, Sparkles } from 'lucide-vue-next'
import type {
  AppSettings,
  ParticleMode,
  ClockTheme,
} from '../../../1-domain/entities/AppSettings'

interface Props {
  settings: AppSettings
}
const props = defineProps<Props>()

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
    <!-- Grid & Card Metric Sliders -->
    <div class="space-y-3">
      <div>
        <div class="flex justify-between">
          <span>Grid Columns</span>
          <span class="text-emerald-400 font-mono">{{ props.settings.gridCols }}</span>
        </div>
        <input
          type="range"
          min="3"
          max="10"
          :value="props.settings.gridCols"
          class="mt-1 w-full accent-emerald-500"
          @input="
            emit('update', {
              gridCols: Number(($event.target as HTMLInputElement).value),
            })
          "
        />
      </div>
      <div>
        <div class="flex justify-between">
          <span>Card Height</span>
          <span class="text-emerald-400 font-mono">{{ props.settings.cardHeight }}px</span>
        </div>
        <input
          type="range"
          min="80"
          max="180"
          :value="props.settings.cardHeight"
          class="mt-1 w-full accent-emerald-500"
          @input="
            emit('update', {
              cardHeight: Number(($event.target as HTMLInputElement).value),
            })
          "
        />
      </div>
      <div>
        <div class="flex justify-between">
          <span>Corner Radius</span>
          <span class="text-emerald-400 font-mono">{{ props.settings.tileRadius }}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="32"
          :value="props.settings.tileRadius"
          class="mt-1 w-full accent-emerald-500"
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
        <span class="text-[10px] font-semibold text-emerald-400 tracking-wider uppercase">
          Widgets & Display
        </span>
        <div class="grid grid-cols-2 gap-2">
          <label
            class="flex items-center gap-2 cursor-pointer rounded-lg border border-white/5 bg-white/[0.03] p-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:border-white/15 hover:bg-white/[0.08] active:scale-[0.98]"
          >
            <input
              type="checkbox"
              :checked="props.settings.showGreeting"
              class="accent-emerald-500 rounded cursor-pointer transition-transform hover:scale-110"
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
              class="accent-emerald-500 rounded cursor-pointer transition-transform hover:scale-110"
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
              class="accent-emerald-500 rounded cursor-pointer transition-transform hover:scale-110"
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
              :checked="props.settings.showStickyNote"
              class="accent-emerald-500 rounded cursor-pointer transition-transform hover:scale-110"
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
              class="accent-emerald-500 rounded cursor-pointer transition-transform hover:scale-110"
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
              class="accent-emerald-500 rounded cursor-pointer transition-transform hover:scale-110"
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
              class="accent-emerald-500 rounded cursor-pointer transition-transform hover:scale-110"
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
              class="accent-emerald-500 rounded cursor-pointer transition-transform hover:scale-110"
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
            <span class="text-[10px] font-semibold text-emerald-400 tracking-wider uppercase">
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
                  ? 'border-emerald-500 bg-emerald-500/15 text-white shadow-sm ring-1 ring-emerald-500/50'
                  : 'border-white/5 bg-white/[0.03] text-white/70 hover:border-white/15 hover:bg-white/[0.08] hover:text-white',
              ]"
              @click="emit('update', { clockTheme: ct.id })"
            >
              <div class="flex items-center gap-1.5 w-full">
                <component :is="ct.icon" class="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span class="font-medium text-[11px] truncate">{{ ct.label }}</span>
              </div>
              <span class="text-[9px] text-white/40 leading-tight">{{ ct.desc }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Shortcuts & Navigation -->
      <div class="space-y-1.5 pt-1">
        <span class="text-[10px] font-semibold text-emerald-400 tracking-wider uppercase">
          Shortcuts & Navigation
        </span>
        <div class="grid grid-cols-2 gap-2">
          <label
            class="flex items-center gap-2 cursor-pointer rounded-lg border border-white/5 bg-white/[0.03] p-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:border-white/15 hover:bg-white/[0.08] active:scale-[0.98]"
          >
            <input
              type="checkbox"
              :checked="props.settings.showTileGrid"
              class="accent-emerald-500 rounded cursor-pointer transition-transform hover:scale-110"
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
              class="accent-emerald-500 rounded cursor-pointer transition-transform hover:scale-110"
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
              class="accent-emerald-500 rounded cursor-pointer transition-transform hover:scale-110"
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
              class="accent-emerald-500 rounded cursor-pointer transition-transform hover:scale-110"
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
              class="accent-emerald-500 rounded cursor-pointer transition-transform hover:scale-110"
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
              class="accent-emerald-500 rounded cursor-pointer transition-transform hover:scale-110"
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
              class="accent-emerald-500 rounded cursor-pointer transition-transform hover:scale-110"
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
              class="accent-emerald-500 rounded cursor-pointer transition-transform hover:scale-110"
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
        class="w-full rounded-lg border border-white/10 bg-[#1f1035] p-2 text-white outline-none cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-white/20 focus:border-emerald-400"
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

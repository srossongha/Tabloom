<!--
  SettingsLayoutSection component configuring grid metrics, visibility toggles, and performance.
  Includes particles management, Zod-validated JSON configuration import/export, and defaults reset.
-->
<script setup lang="ts">
import { Download, Upload, RotateCcw } from 'lucide-vue-next'
import type { AppSettings, ParticleMode } from '../../../1-domain/entities/AppSettings'

interface Props {
  settings: AppSettings
}
const props = defineProps<Props>()

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
    <!-- Grid & Card Sliders -->
    <div class="space-y-3">
      <div>
        <div class="flex justify-between"><span>Grid Columns</span><span class="text-emerald-400">{{ props.settings.gridCols }}</span></div>
        <input type="range" min="3" max="10" :value="props.settings.gridCols" class="mt-1 w-full accent-emerald-500" @input="emit('update', { gridCols: Number(($event.target as HTMLInputElement).value) })" />
      </div>
      <div>
        <div class="flex justify-between"><span>Card Height</span><span class="text-emerald-400">{{ props.settings.cardHeight }}px</span></div>
        <input type="range" min="80" max="180" :value="props.settings.cardHeight" class="mt-1 w-full accent-emerald-500" @input="emit('update', { cardHeight: Number(($event.target as HTMLInputElement).value) })" />
      </div>
      <div>
        <div class="flex justify-between"><span>Corner Radius</span><span class="text-emerald-400">{{ props.settings.tileRadius }}px</span></div>
        <input type="range" min="0" max="32" :value="props.settings.tileRadius" class="mt-1 w-full accent-emerald-500" @input="emit('update', { tileRadius: Number(($event.target as HTMLInputElement).value) })" />
      </div>
    </div>

    <!-- Visibility Toggles -->
    <div class="border-t border-white/10 pt-3">
      <span class="block font-medium text-white/70 mb-2">Visibility</span>
      <div class="grid grid-cols-2 gap-2">
        <label class="flex items-center gap-2"><input type="checkbox" :checked="props.settings.showLogo" class="accent-emerald-500 rounded" @change="emit('update', { showLogo: ($event.target as HTMLInputElement).checked })" /> Brand Logo</label>
        <label class="flex items-center gap-2"><input type="checkbox" :checked="props.settings.showSearch" class="accent-emerald-500 rounded" @change="emit('update', { showSearch: ($event.target as HTMLInputElement).checked })" /> Search Bar</label>
        <label class="flex items-center gap-2"><input type="checkbox" :checked="props.settings.showSortBar" class="accent-emerald-500 rounded" @change="emit('update', { showSortBar: ($event.target as HTMLInputElement).checked })" /> Sort Pill</label>
        <label class="flex items-center gap-2"><input type="checkbox" :checked="props.settings.showLabels" class="accent-emerald-500 rounded" @change="emit('update', { showLabels: ($event.target as HTMLInputElement).checked })" /> Tile Labels</label>
        <label class="flex items-center gap-2"><input type="checkbox" :checked="props.settings.showAddCard" class="accent-emerald-500 rounded" @change="emit('update', { showAddCard: ($event.target as HTMLInputElement).checked })" /> Add (+) Card</label>
        <label class="flex items-center gap-2"><input type="checkbox" :checked="props.settings.showSideClock" class="accent-emerald-500 rounded" @change="emit('update', { showSideClock: ($event.target as HTMLInputElement).checked })" /> Side Clock</label>
        <label class="flex items-center gap-2"><input type="checkbox" :checked="props.settings.showStickyNote" class="accent-emerald-500 rounded" @change="emit('update', { showStickyNote: ($event.target as HTMLInputElement).checked })" /> Sticky Note</label>
      </div>
    </div>

    <!-- Particles & Performance -->
    <div class="border-t border-white/10 pt-3 space-y-2">
      <span class="block font-medium text-white/70">Particles Engine</span>
      <select :value="props.settings.particleMode" class="w-full rounded-lg border border-white/10 bg-[#1f1035] p-2 text-white outline-none" @change="emit('update', { particleMode: ($event.target as HTMLSelectElement).value as ParticleMode })">
        <option value="off">Off (0% CPU / GPU Static Mode)</option>
        <option value="cosmic-dust">Cosmic Dust</option>
        <option value="sakura-horizon">Sakura Horizon</option>
        <option value="starfield">Starfield</option>
      </select>
    </div>

    <!-- Backup, Sync & Reset -->
    <div class="border-t border-white/10 pt-3 space-y-2">
      <span class="block font-medium text-white/70">Backup & Reset</span>
      <div class="grid grid-cols-2 gap-2">
        <button type="button" class="flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/10 py-2 hover:bg-white/20" @click="emit('export')"><Download class="h-3.5 w-3.5" /> Export JSON</button>
        <label class="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/10 py-2 hover:bg-white/20"><Upload class="h-3.5 w-3.5" /> Import JSON<input type="file" accept=".json" class="hidden" @change="onImportFile" /></label>
      </div>
      <button type="button" class="w-full rounded-lg border border-rose-500/30 bg-rose-500/10 py-2 text-rose-300 hover:bg-rose-500/20" @click="emit('reset')"><RotateCcw class="inline mr-1 h-3.5 w-3.5" /> Reset to Defaults</button>
    </div>
  </div>
</template>


<!--
  SettingsThemeSection component offering theme preset selection, custom color pickers, and wallpapers.
  Provides controls for live wallpaper upload, background blur, and dark overlay intensity.
-->
<script setup lang="ts">
import { Upload, Trash2 } from 'lucide-vue-next'
import type { AppSettings, ThemePreset } from '../../../1-domain/entities/AppSettings'

interface Props {
  settings: AppSettings
}
const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update', partial: Partial<AppSettings>): void
  (e: 'applyPreset', preset: ThemePreset): void
}>()

const PRESETS: Array<{ id: ThemePreset; label: string; color: string }> = [
  { id: 'cosmic-purple', label: 'Cosmic Purple', color: '#2b1055' },
  { id: 'oled-black', label: 'OLED Black', color: '#000000' },
  { id: 'tokyo-night', label: 'Tokyo Night', color: '#1a1b26' },
  { id: 'emerald-aurora', label: 'Emerald Aurora', color: '#064e3b' },
  { id: 'cyberpunk-neon', label: 'Cyberpunk', color: '#240046' },
  { id: 'frosted-minimal', label: 'Frosted Slate', color: '#1e293b' },
]

function onWallpaperUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => emit('update', { customWallpaper: reader.result as string })
  reader.readAsDataURL(file)
}
</script>

<template>
  <div class="space-y-4 text-xs text-white/80">
    <div>
      <span class="block font-medium text-white/70 mb-1.5">Theme Presets</span>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="p in PRESETS"
          :key="p.id"
          type="button"
          class="flex items-center gap-2 rounded-lg border p-2 text-left transition-all"
          :class="[
            props.settings.themePreset === p.id
              ? 'border-emerald-400 bg-white/10 text-white'
              : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10',
          ]"
          @click="emit('applyPreset', p.id)"
        >
          <span class="h-3.5 w-3.5 rounded-full border border-white/20" :style="{ backgroundColor: p.color }" />
          <span>{{ p.label }}</span>
        </button>
      </div>
    </div>

    <div class="space-y-2 border-t border-white/10 pt-3">
      <span class="block font-medium text-white/70">Custom Colors</span>
      <div class="grid grid-cols-2 gap-2">
        <label class="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-2">
          <span>Gradient Start</span>
          <input type="color" :value="props.settings.bgStart" class="h-5 w-6 cursor-pointer border-0 bg-transparent" @input="emit('update', { bgStart: ($event.target as HTMLInputElement).value })" />
        </label>
        <label class="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-2">
          <span>Gradient End</span>
          <input type="color" :value="props.settings.bgEnd" class="h-5 w-6 cursor-pointer border-0 bg-transparent" @input="emit('update', { bgEnd: ($event.target as HTMLInputElement).value })" />
        </label>
        <label class="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-2">
          <span>Active Accent</span>
          <input type="color" :value="props.settings.accentColor" class="h-5 w-6 cursor-pointer border-0 bg-transparent" @input="emit('update', { accentColor: ($event.target as HTMLInputElement).value })" />
        </label>
        <label class="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-2">
          <span>Label Text</span>
          <input type="color" :value="props.settings.textColor" class="h-5 w-6 cursor-pointer border-0 bg-transparent" @input="emit('update', { textColor: ($event.target as HTMLInputElement).value })" />
        </label>
      </div>
    </div>

    <div class="space-y-3 border-t border-white/10 pt-3">
      <span class="block font-medium text-white/70">Custom Wallpaper</span>
      <div class="flex items-center gap-2">
        <input
          type="text"
          placeholder="Paste image URL..."
          :value="props.settings.customWallpaper"
          class="flex-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 outline-none placeholder-white/30"
          @input="emit('update', { customWallpaper: ($event.target as HTMLInputElement).value })"
        />
        <label class="flex cursor-pointer items-center rounded-lg border border-white/15 bg-white/10 p-2 hover:bg-white/20">
          <Upload class="h-3.5 w-3.5 text-white" />
          <input type="file" accept="image/*" class="hidden" @change="onWallpaperUpload" />
        </label>
        <button
          v-if="props.settings.customWallpaper"
          type="button"
          class="rounded-lg border border-white/10 bg-rose-500/20 p-2 text-rose-300 hover:bg-rose-500/40"
          @click="emit('update', { customWallpaper: '' })"
        >
          <Trash2 class="h-3.5 w-3.5" />
        </button>
      </div>

      <div class="grid grid-cols-2 gap-3 pt-1">
        <div>
          <div class="flex justify-between"><span>Blur</span><span>{{ props.settings.wallpaperBlur }}px</span></div>
          <input type="range" min="0" max="24" :value="props.settings.wallpaperBlur" class="mt-1 w-full accent-emerald-500" @input="emit('update', { wallpaperBlur: Number(($event.target as HTMLInputElement).value) })" />
        </div>
        <div>
          <div class="flex justify-between"><span>Dim</span><span>{{ props.settings.wallpaperDim }}%</span></div>
          <input type="range" min="0" max="90" :value="props.settings.wallpaperDim" class="mt-1 w-full accent-emerald-500" @input="emit('update', { wallpaperDim: Number(($event.target as HTMLInputElement).value) })" />
        </div>
      </div>
    </div>
  </div>
</template>

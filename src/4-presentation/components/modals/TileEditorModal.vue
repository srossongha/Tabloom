<!--
  TileEditorModal component enabling comprehensive tile creation and editing.
  Supports standard icon mode or full tile image cover mode, live interactive preview,
  custom tint colors, and file uploads.
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { X, Upload, Palette, Image as ImageIcon, Sparkles, Pin } from 'lucide-vue-next'
import type { Tile, IconMode, TileDisplayMode } from '../../../1-domain/entities/Tile'
import { resolveFaviconUrl, generateMonogram } from '../../../3-infrastructure/favicon/faviconService'

interface Props {
  isOpen: boolean
  tile?: Tile | null
}
const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: {
    title: string
    url: string
    iconMode: IconMode
    displayMode: TileDisplayMode
    customIcon?: string
    tintColor?: string
    pinned: boolean
  }): void
}>()

const title = ref('')
const url = ref('')
const iconMode = ref<IconMode>('auto')
const displayMode = ref<TileDisplayMode>('icon')
const customIcon = ref('')
const tintColor = ref('')
const pinned = ref(false)

watch(() => props.tile, (curr) => {
  if (curr) {
    title.value = curr.title
    url.value = curr.url
    iconMode.value = curr.iconMode
    displayMode.value = curr.displayMode || 'icon'
    customIcon.value = curr.customIcon || ''
    tintColor.value = curr.tintColor || ''
    pinned.value = Boolean(curr.pinned)
  } else {
    title.value = ''
    url.value = ''
    iconMode.value = 'auto'
    displayMode.value = 'icon'
    customIcon.value = ''
    tintColor.value = ''
    pinned.value = false
  }
}, { immediate: true })

function handleFileUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    customIcon.value = reader.result as string
    iconMode.value = 'upload'
  }
  reader.readAsDataURL(file)
}

function onSave() {
  let finalUrl = url.value.trim()
  if (!/^https?:\/\//i.test(finalUrl)) finalUrl = `https://${finalUrl}`
  emit('save', {
    title: title.value.trim() || finalUrl,
    url: finalUrl,
    iconMode: iconMode.value,
    displayMode: displayMode.value,
    customIcon: customIcon.value.trim() || undefined,
    tintColor: tintColor.value.trim() || undefined,
    pinned: pinned.value,
  })
  emit('close')
}

// Live Preview helpers
const previewFavicon = computed(() => {
  return resolveFaviconUrl(url.value || 'https://google.com', customIcon.value, iconMode.value)
})

const previewMonogram = computed(() => {
  return generateMonogram(title.value || 'Shortcut', url.value || 'https://google.com')
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen) emit('close')
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="props.isOpen"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/60 select-none overflow-y-auto"
        @click.self="emit('close')"
      >
        <div
          class="relative w-full max-w-lg rounded-2xl border border-white/20 bg-gradient-to-b from-purple-950/90 to-[#0e0720]/95 p-6 shadow-2xl shadow-purple-950/60 my-8"
        >
          <!-- Header -->
          <div class="flex items-center justify-between pb-4 border-b border-white/10">
            <div class="flex items-center gap-2">
              <Sparkles class="h-4 w-4" :style="{ color: 'var(--accent)' }" />
              <h3 class="text-base font-semibold text-white">
                {{ props.tile ? 'Edit Shortcut Tile' : 'Add Shortcut Tile' }}
              </h3>
            </div>
            <button
              type="button"
              class="rounded-lg p-1 text-white/60 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-110 hover:text-white active:scale-90 cursor-pointer"
              @click="emit('close')"
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <form class="space-y-4 pt-4" @submit.prevent="onSave">
            <!-- Live Tile Preview Box -->
            <div class="flex flex-col items-center justify-center p-3 rounded-xl border border-black/10 dark:border-white/10 bg-slate-100/90 dark:bg-black/30">
              <span class="text-[10px] text-slate-500 dark:text-white/40 uppercase tracking-wider mb-2 font-medium">Live Tile Preview</span>
              <div
                class="gpu-card relative flex w-36 h-28 cursor-default flex-col items-center justify-center rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/[0.08] p-3 shadow-md overflow-hidden transition-all duration-300"
                :style="{
                  backgroundColor: tintColor || undefined,
                }"
              >
                <!-- Full Cover Preview -->
                <template v-if="displayMode === 'full-cover' && (customIcon || previewFavicon)">
                  <img
                    :src="customIcon || previewFavicon"
                    :alt="title || 'Preview'"
                    class="absolute inset-0 h-full w-full object-cover"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                  <span class="absolute bottom-1.5 left-1 right-1 truncate text-center text-[10px] font-semibold text-white drop-shadow">
                    {{ title || 'My Shortcut' }}
                  </span>
                </template>

                <!-- Icon Badge Preview -->
                <template v-else>
                  <div class="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.1] shadow-inner">
                    <img
                      v-if="iconMode !== 'monogram'"
                      :src="customIcon || previewFavicon"
                      :alt="title || 'Preview'"
                      class="h-7 w-7 object-contain"
                    />
                    <div
                      v-else
                      class="flex h-full w-full items-center justify-center text-xs font-bold text-white"
                      :style="{ backgroundColor: previewMonogram.color }"
                    >
                      {{ previewMonogram.letter }}
                    </div>
                  </div>
                </template>

                <div v-if="pinned" class="absolute top-1.5 left-1.5" :style="{ color: 'var(--accent)' }">
                  <Pin class="h-2.5 w-2.5 rotate-45" />
                </div>
              </div>
              <span v-if="displayMode !== 'full-cover'" class="text-xs font-semibold text-slate-800 dark:text-white/80 mt-1.5 truncate max-w-[140px]">
                {{ title || 'My Shortcut' }}
              </span>
            </div>

            <!-- Name & URL -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-700 dark:text-white/70">Name</label>
                <input
                  v-model="title"
                  type="text"
                  required
                  placeholder="e.g. YouTube or Minecraft"
                  class="mt-1 w-full rounded-lg border border-black/15 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 outline-none transition-all duration-200"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-700 dark:text-white/70">Click Destination URL</label>
                <input
                  v-model="url"
                  type="text"
                  required
                  placeholder="https://..."
                  class="mt-1 w-full rounded-lg border border-black/15 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 outline-none transition-all duration-200"
                />
              </div>
            </div>

            <!-- Display Style: Icon vs Full Tile Image Cover -->
            <div>
              <label class="block text-xs font-medium text-slate-700 dark:text-white/70 mb-1.5">Tile Display Style</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  class="flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer"
                  :class="[
                    displayMode === 'icon'
                      ? 'shadow-sm font-semibold'
                      : 'border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-black/[0.06] dark:hover:bg-white/10',
                  ]"
                  :style="displayMode === 'icon' ? {
                    borderColor: 'var(--accent)',
                    backgroundColor: 'var(--accent-15)',
                    color: 'var(--accent)',
                  } : undefined"
                  @click="displayMode = 'icon'"
                >
                  <Sparkles class="h-3.5 w-3.5" :style="{ color: 'var(--accent)' }" />
                  <span>Standard Icon Badge</span>
                </button>
                <button
                  type="button"
                  class="flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer"
                  :class="[
                    displayMode === 'full-cover'
                      ? 'shadow-sm font-semibold'
                      : 'border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-black/[0.06] dark:hover:bg-white/10',
                  ]"
                  :style="displayMode === 'full-cover' ? {
                    borderColor: 'var(--accent)',
                    backgroundColor: 'var(--accent-15)',
                    color: 'var(--accent)',
                  } : undefined"
                  @click="displayMode = 'full-cover'"
                >
                  <ImageIcon class="h-3.5 w-3.5" :style="{ color: 'var(--accent)' }" />
                  <span>Full Tile Image Cover</span>
                </button>
              </div>
              <p v-if="displayMode === 'full-cover'" class="text-[11px] mt-1" :style="{ color: 'var(--accent)' }">
                The image fills the entire tile surface. Clicking anywhere on the tile opens the URL.
              </p>
            </div>

            <!-- Image Source / Icon Options -->
            <div class="space-y-2">
              <label class="block text-xs font-medium text-white/70">
                {{ displayMode === 'full-cover' ? 'Tile Image Source' : 'Icon Source' }}
              </label>
              <div class="flex gap-2">
                <select
                  v-model="iconMode"
                  class="settings-select flex-1 rounded-lg border border-white/15 bg-white/5 p-2 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="auto">Auto Favicon (Domain)</option>
                  <option value="custom-url">Image URL</option>
                  <option value="upload">Upload File (PNG, JPG, GIF)</option>
                  <option v-if="displayMode !== 'full-cover'" value="monogram">Monogram / Letter</option>
                </select>
              </div>

              <div v-if="iconMode === 'custom-url'" class="pt-1">
                <input
                  v-model="customIcon"
                  type="url"
                  :placeholder="displayMode === 'full-cover' ? 'Paste full tile image URL...' : 'Paste icon URL...'"
                  class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition-all duration-200"
                />
              </div>

              <div v-else-if="iconMode === 'upload'" class="flex items-center gap-3 pt-1">
                <label
                  class="flex cursor-pointer items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white transition-all duration-200 hover:bg-white/20 hover:scale-105 active:scale-95"
                >
                  <Upload class="h-3.5 w-3.5" /> Upload Image File
                  <input type="file" accept="image/*" class="hidden" @change="handleFileUpload" />
                </label>
                <span v-if="customIcon" class="text-xs" :style="{ color: 'var(--accent)' }">✓ Image loaded</span>
              </div>
            </div>

            <!-- Card Tint & Pin -->
            <div class="flex items-center justify-between pt-1 border-t border-white/10">
              <label class="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                <Palette class="h-3.5 w-3.5" :style="{ color: 'var(--accent)' }" /> Card Tint:
                <input
                  v-model="tintColor"
                  type="color"
                  class="h-6 w-8 cursor-pointer border-0 bg-transparent transition-transform hover:scale-110"
                />
              </label>
              <label class="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                <input v-model="pinned" type="checkbox" class="rounded cursor-pointer" :style="{ accentColor: 'var(--accent)' }" /> Pin to top
              </label>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-2 pt-3">
              <button
                type="button"
                class="rounded-lg px-4 py-2 text-xs font-medium text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white active:scale-95 cursor-pointer"
                @click="emit('close')"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="rounded-lg px-5 py-2 text-xs font-medium shadow-md transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                :style="{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-contrast)',
                }"
              >
                Save Tile
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

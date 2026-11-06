<!--
  TileEditorModal component enabling comprehensive tile creation and editing.
  Configures title, URL, custom icons, upload previews, and personalized card tint colors.
-->
<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { X, Upload, Palette } from 'lucide-vue-next'
import type { Tile, IconMode } from '../../../1-domain/entities/Tile'

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
    customIcon?: string
    tintColor?: string
    pinned: boolean
  }): void
}>()

const title = ref('')
const url = ref('')
const iconMode = ref<IconMode>('auto')
const customIcon = ref('')
const tintColor = ref('')
const pinned = ref(false)

watch(() => props.tile, (curr) => {
  if (curr) {
    title.value = curr.title
    url.value = curr.url
    iconMode.value = curr.iconMode
    customIcon.value = curr.customIcon || ''
    tintColor.value = curr.tintColor || ''
    pinned.value = Boolean(curr.pinned)
  } else {
    title.value = ''
    url.value = ''
    iconMode.value = 'auto'
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
    customIcon: customIcon.value.trim() || undefined,
    tintColor: tintColor.value.trim() || undefined,
    pinned: pinned.value,
  })
  emit('close')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen) emit('close')
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div v-if="props.isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 transition-opacity duration-200" @click.self="emit('close')">
    <div class="relative w-full max-w-md rounded-2xl border border-white/20 bg-gradient-to-b from-purple-950/90 to-[#0e0720]/95 p-6 shadow-2xl shadow-purple-950/60 transition-transform duration-200 scale-100">
      <div class="flex items-center justify-between pb-4 border-b border-white/10">
        <h3 class="text-base font-semibold text-white">{{ props.tile ? 'Edit Shortcut' : 'Add Shortcut' }}</h3>
        <button class="text-white/60 hover:text-white" @click="emit('close')"><X class="h-4 w-4" /></button>
      </div>
      <form class="space-y-4 pt-4" @submit.prevent="onSave">
        <div>
          <label class="block text-xs font-medium text-white/70">Name</label>
          <input v-model="title" type="text" placeholder="e.g. GitHub" class="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-emerald-400" />
        </div>
        <div>
          <label class="block text-xs font-medium text-white/70">URL</label>
          <input v-model="url" type="text" required placeholder="https://..." class="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-emerald-400" />
        </div>
        <div>
          <label class="block text-xs font-medium text-white/70">Icon Source</label>
          <select v-model="iconMode" class="mt-1 w-full rounded-lg border border-white/10 bg-[#1f1035] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400">
            <option value="auto">Auto Favicon</option>
            <option value="custom-url">Custom Image URL</option>
            <option value="upload">Upload Local Image</option>
            <option value="monogram">Monogram / Letter</option>
          </select>
        </div>
        <div v-if="iconMode === 'custom-url'">
          <input v-model="customIcon" type="url" placeholder="Paste image url..." class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-emerald-400" />
        </div>
        <div v-else-if="iconMode === 'upload'" class="flex items-center gap-3">
          <label class="flex cursor-pointer items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20">
            <Upload class="h-3.5 w-3.5" /> Upload File
            <input type="file" accept="image/*" class="hidden" @change="handleFileUpload" />
          </label>
          <span v-if="customIcon" class="text-xs text-emerald-400">Image loaded</span>
        </div>
        <div class="flex items-center justify-between pt-1">
          <label class="flex items-center gap-2 text-xs text-white/70">
            <Palette class="h-3.5 w-3.5" /> Card Tint:
            <input v-model="tintColor" type="color" class="h-6 w-8 cursor-pointer border-0 bg-transparent" />
          </label>
          <label class="flex items-center gap-2 text-xs text-white/70">
            <input v-model="pinned" type="checkbox" class="rounded accent-emerald-500" /> Pin to top
          </label>
        </div>
        <div class="flex justify-end gap-2 pt-3">
          <button type="button" class="rounded-lg px-4 py-2 text-xs font-medium text-white/70 hover:bg-white/10" @click="emit('close')">Cancel</button>
          <button type="submit" class="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-medium text-white shadow-md hover:bg-emerald-400">Save</button>
        </div>
      </form>
    </div>
  </div>
</template>

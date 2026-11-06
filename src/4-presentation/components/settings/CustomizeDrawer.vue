<!--
  CustomizeDrawer component offering slide-over no-code visual configuration.
  Provides live controls for themes, wallpapers, grid layout, data sources, and JSON backup.
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { X, Palette, Sliders, Database } from 'lucide-vue-next'
import type { AppSettings, ThemePreset } from '../../../1-domain/entities/AppSettings'
import type { BookmarkFolder } from '../../../1-domain/entities/BrowserItem'
import SettingsThemeSection from './SettingsThemeSection.vue'
import SettingsLayoutSection from './SettingsLayoutSection.vue'
import SettingsGeneralSection from './SettingsGeneralSection.vue'

interface Props {
  isOpen: boolean
  settings: AppSettings
  folders: BookmarkFolder[]
}
const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updateSettings', partial: Partial<AppSettings>): void
  (e: 'applyPreset', preset: ThemePreset): void
  (e: 'exportConfig'): void
  (e: 'importConfig', text: string): void
  (e: 'resetDefaults'): void
  (e: 'importedBookmarks'): void
  (e: 'clearHidden'): void
}>()

type DrawerTab = 'theme' | 'layout' | 'data'
const currentTab = ref<DrawerTab>('theme')

const userNameInput = ref('')
const isSaved = ref(false)

async function loadUserName() {
  if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
    try {
      const res = await new Promise<{ userName?: string }>((resolve) => {
        chrome.storage.sync.get(['userName'], resolve)
      })
      if (res && typeof res.userName === 'string') {
        userNameInput.value = res.userName
        return
      }
    } catch {}
  }
  userNameInput.value = localStorage.getItem('userName') || ''
}

async function saveUserName() {
  const trimmed = userNameInput.value.trim().slice(0, 30)
  userNameInput.value = trimmed

  if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
    try {
      await chrome.storage.sync.set({ userName: trimmed })
    } catch {}
  }
  try {
    localStorage.setItem('userName', trimmed)
  } catch {}

  window.dispatchEvent(new CustomEvent('tabloom:userNameChanged', { detail: trimmed }))
  isSaved.value = true
  setTimeout(() => {
    isSaved.value = false
  }, 1500)
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) loadUserName()
  },
  { immediate: true }
)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen) emit('close')
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div v-if="props.isOpen" class="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm" @click.self="emit('close')">
    <aside class="gpu-card absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-white/10 bg-[#0e0720]/95 shadow-2xl transition-transform duration-300 ease-out">
      <!-- Drawer Header -->
      <div class="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h2 class="text-sm font-semibold tracking-wide text-white">Customize Tabloom</h2>
        <button class="rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white" @click="emit('close')">
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Your Name Section -->
      <div class="border-b border-white/10 px-5 py-3.5">
        <label class="block text-xs font-medium text-white/70 mb-1.5">Your name</label>
        <div class="flex items-center gap-2">
          <input
            v-model="userNameInput"
            type="text"
            maxlength="30"
            placeholder="User"
            class="flex-1 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs text-white placeholder-white/30 outline-none transition-colors focus:border-emerald-400 focus:bg-white/[0.1]"
            @keydown.enter="saveUserName"
          />
          <button
            type="button"
            class="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition-all active:scale-95 cursor-pointer"
            @click="saveUserName"
          >
            {{ isSaved ? 'Saved!' : 'Save' }}
          </button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex border-b border-white/10 px-5 pt-3">
        <button
          class="flex flex-1 items-center justify-center gap-1.5 pb-2.5 text-xs font-medium transition-colors"
          :class="[currentTab === 'theme' ? 'border-b-2 border-emerald-400 text-emerald-400' : 'text-white/50 hover:text-white']"
          @click="currentTab = 'theme'"
        >
          <Palette class="h-3.5 w-3.5" /> Theme
        </button>
        <button
          class="flex flex-1 items-center justify-center gap-1.5 pb-2.5 text-xs font-medium transition-colors"
          :class="[currentTab === 'layout' ? 'border-b-2 border-emerald-400 text-emerald-400' : 'text-white/50 hover:text-white']"
          @click="currentTab = 'layout'"
        >
          <Sliders class="h-3.5 w-3.5" /> Layout
        </button>
        <button
          class="flex flex-1 items-center justify-center gap-1.5 pb-2.5 text-xs font-medium transition-colors"
          :class="[currentTab === 'data' ? 'border-b-2 border-emerald-400 text-emerald-400' : 'text-white/50 hover:text-white']"
          @click="currentTab = 'data'"
        >
          <Database class="h-3.5 w-3.5" /> Data
        </button>
      </div>

      <!-- Drawer Content -->
      <div class="flex-1 overflow-y-auto p-5">
        <SettingsThemeSection
          v-if="currentTab === 'theme'"
          :settings="props.settings"
          @update="emit('updateSettings', $event)"
          @apply-preset="emit('applyPreset', $event)"
        />
        <SettingsLayoutSection
          v-else-if="currentTab === 'layout'"
          :settings="props.settings"
          @update="emit('updateSettings', $event)"
          @export="emit('exportConfig')"
          @import="emit('importConfig', $event)"
          @reset="emit('resetDefaults')"
        />
        <SettingsGeneralSection
          v-else
          :settings="props.settings"
          :folders="props.folders"
          @update="emit('updateSettings', $event)"
          @imported-bookmarks="emit('importedBookmarks')"
          @clear-hidden="emit('clearHidden')"
        />
      </div>
    </aside>
  </div>
</template>

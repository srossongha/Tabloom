<!--
  TabBrandingSection component: lets users customize the browser tab title and favicon,
  along with the header brand logo and name.
  Features a live interactive browser tab preview, preset disguises (Google, GitHub, Notion, Minecraft, etc.),
  custom image upload, URL input, and one-click quick names.
-->
<script setup lang="ts">
import { ref } from 'vue'
import {
  Upload,
  RotateCcw,
  Globe,
} from 'lucide-vue-next'
import type { AppSettings } from '../../../1-domain/entities/AppSettings'
import {
  TAB_ICON_PRESETS,
  type TabIconPreset,
} from '../../../2-application/services/tabIconPresets'

interface Props {
  settings: AppSettings
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update', partial: Partial<AppSettings>): void
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const customUrlInput = ref('')
const showUrlInput = ref(false)

const QUICK_NAMES = [
  'Tabloom',
  'New Tab',
  'Google',
  'Workspace',
  'Home',
  'Dashboard',
]

function selectPreset(preset: TabIconPreset) {
  emit('update', {
    appIcon: preset.iconUrl,
  })
}

function handleNameInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  emit('update', {
    appName: val || 'Tabloom',
  })
}

function setQuickName(name: string) {
  emit('update', {
    appName: name,
  })
}

function resetToDefault() {
  emit('update', {
    appName: 'Tabloom',
    appIcon: '/icons/icon.svg',
  })
}

function triggerFileUpload() {
  fileInputRef.value?.click()
}

function onFileSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    const dataUrl = reader.result as string
    emit('update', {
      appIcon: dataUrl,
    })
  }
  reader.readAsDataURL(file)
}

function applyCustomUrl() {
  const trimmed = customUrlInput.value.trim()
  if (trimmed) {
    emit('update', {
      appIcon: trimmed,
    })
    customUrlInput.value = ''
    showUrlInput.value = false
  }
}
</script>

<template>
  <div class="rounded-xl border border-white/10 bg-white/[0.04] p-4 space-y-4 select-none">
    <!-- Header with Reset Button -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Globe class="h-4 w-4 text-emerald-400" />
        <div>
          <h3 class="text-xs font-semibold text-white tracking-wide">
            Browser Tab & Logo Identity
          </h3>
          <p class="text-[11px] text-white/50">
            Customize the browser tab title, favicon, and header logo
          </p>
        </div>
      </div>
      <button
        type="button"
        title="Reset to default Tabloom"
        class="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/70 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
        @click="resetToDefault"
      >
        <RotateCcw class="h-3 w-3" />
        <span>Reset</span>
      </button>
    </div>

    <!-- Live Browser Tab Preview Replica -->
    <div class="rounded-lg border border-white/10 bg-black/40 p-3">
      <span class="block text-[10px] font-medium uppercase tracking-wider text-white/40 mb-2">
        Live Browser Tab Preview
      </span>
      <div class="flex items-center">
        <!-- Replicated Chrome Tab Shape -->
        <div
          class="relative flex items-center gap-2 rounded-t-lg border-t border-x border-white/20 bg-[#1e2029] px-3.5 py-1.5 shadow-md min-w-[140px] max-w-[210px]"
        >
          <img
            :src="props.settings.appIcon || '/icons/icon.svg'"
            alt="Tab Icon"
            class="h-4 w-4 shrink-0 rounded-sm object-contain"
            @error="($event.target as HTMLImageElement).src = '/icons/icon.svg'"
          />
          <span class="truncate text-xs font-medium text-white/95">
            {{ props.settings.appName || 'Tabloom' }}
          </span>
          <span class="ml-auto text-[10px] text-white/40 hover:text-white/80 cursor-default">
            ✕
          </span>
        </div>
        <!-- Background Tab Bar Gap -->
        <div class="flex-1 border-b border-white/15 h-8 flex items-center pl-2">
          <span class="text-xs text-white/20 font-bold">+</span>
        </div>
      </div>
    </div>

    <!-- Tab Name Input & Suggestions -->
    <div class="space-y-1.5">
      <label class="block text-xs font-medium text-white/80">
        Tab Name / Title
      </label>
      <input
        type="text"
        maxlength="40"
        :value="props.settings.appName"
        placeholder="Tabloom"
        class="w-full rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-xs text-white placeholder-white/30 outline-none transition-all duration-200 focus:border-emerald-400 focus:bg-white/[0.1] focus:ring-1 focus:ring-emerald-400/30"
        @input="handleNameInput"
      />

      <!-- Quick Name Chips -->
      <div class="flex flex-wrap gap-1.5 pt-1">
        <button
          v-for="name in QUICK_NAMES"
          :key="name"
          type="button"
          class="rounded-full px-2.5 py-0.5 text-[10.5px] transition-all cursor-pointer border"
          :class="[
            props.settings.appName === name
              ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-300 font-medium'
              : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white hover:bg-white/10',
          ]"
          @click="setQuickName(name)"
        >
          {{ name }}
        </button>
      </div>
    </div>

    <!-- Tab Favicon & Preset Disguises -->
    <div class="space-y-2 pt-2 border-t border-white/10">
      <div class="flex items-center justify-between">
        <label class="block text-xs font-medium text-white/80">
          Tab Favicon & Logo
        </label>
        <div class="flex items-center gap-1.5">
          <button
            type="button"
            class="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 cursor-pointer"
            @click="triggerFileUpload"
          >
            <Upload class="h-3 w-3" />
            <span>Upload</span>
          </button>
          <span class="text-white/20">|</span>
          <button
            type="button"
            class="text-[11px] text-white/60 hover:text-white cursor-pointer"
            @click="showUrlInput = !showUrlInput"
          >
            URL
          </button>
        </div>
      </div>

      <!-- Hidden file input for custom image upload -->
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onFileSelected"
      />

      <!-- Optional URL input -->
      <div v-if="showUrlInput" class="flex items-center gap-1.5">
        <input
          v-model="customUrlInput"
          type="url"
          placeholder="https://example.com/favicon.ico"
          class="flex-1 rounded-lg border border-white/15 bg-white/[0.06] px-2.5 py-1 text-xs text-white placeholder-white/30 outline-none focus:border-emerald-400"
          @keydown.enter="applyCustomUrl"
        />
        <button
          type="button"
          class="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-400 cursor-pointer"
          @click="applyCustomUrl"
        >
          Apply
        </button>
      </div>

      <!-- Preset Icons Grid -->
      <div class="grid grid-cols-5 gap-2">
        <button
          v-for="preset in TAB_ICON_PRESETS"
          :key="preset.id"
          type="button"
          :title="preset.name"
          class="group relative flex flex-col items-center justify-center gap-1 rounded-lg border p-2 transition-all cursor-pointer backdrop-blur-sm"
          :class="[
            props.settings.appIcon === preset.iconUrl
              ? 'border-emerald-400 bg-emerald-500/15 shadow-sm shadow-emerald-500/20'
              : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.08]',
          ]"
          @click="selectPreset(preset)"
        >
          <img
            :src="preset.iconUrl"
            :alt="preset.name"
            class="h-5 w-5 object-contain transition-transform group-hover:scale-110"
            @error="($event.target as HTMLImageElement).src = '/icons/icon.svg'"
          />
          <span class="text-[9.5px] truncate w-full text-center text-white/70 group-hover:text-white">
            {{ preset.name }}
          </span>

          <!-- Active Indicator Badge -->
          <span
            v-if="props.settings.appIcon === preset.iconUrl"
            class="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white shadow"
          >
            ✓
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

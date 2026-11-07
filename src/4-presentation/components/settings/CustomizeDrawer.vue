<!--
  CustomizeDrawer component offering slide-over no-code visual configuration.
  Provides live controls for themes, wallpapers, grid layout, data sources, and JSON backup.
  Features fluid curved motion animations for opening/closing and tab transitions.
-->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { X, Palette, Sliders, Database, Check } from 'lucide-vue-next'
import type {
  AppSettings,
  ThemePreset,
} from '../../../1-domain/entities/AppSettings'
import type { BookmarkFolder } from '../../../1-domain/entities/BrowserItem'
import { parseHexOrRgb } from '../../../2-application/services/colorUtils'
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
  (e: 'reimportBookmarks'): void
  (e: 'clearHidden'): void
}>()

type DrawerTab = 'theme' | 'layout' | 'data'
const currentTab = ref<DrawerTab>('theme')

const TABS: Array<{ id: DrawerTab; label: string; icon: any }> = [
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'layout', label: 'Layout', icon: Sliders },
  { id: 'data', label: 'Data', icon: Database },
]

const activeAccent = computed(() => props.settings.accentColor || '#10b981')

const accentGlow = computed(() => {
  const rgb = parseHexOrRgb(activeAccent.value)
  if (!rgb) return 'rgba(16, 185, 129, 0.45)'
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.45)`
})

// Dynamic Moving Underline Indicator State
const tabContainerRef = ref<HTMLElement | null>(null)
const tabRefs = ref<Record<string, HTMLElement | null>>({})
const lineLeft = ref(0)
const lineWidth = ref(0)
const isLineReady = ref(false)

function setDrawerTabRef(id: DrawerTab, el: any) {
  if (el) {
    tabRefs.value[id] = el as HTMLElement
    if (id === currentTab.value) {
      nextTick(() => {
        updateLinePosition(false)
      })
    }
  }
}

function updateLinePosition(animated = true) {
  const targetEl = tabRefs.value[currentTab.value]
  const containerEl = tabContainerRef.value
  if (!targetEl || !containerEl) return

  // With containerEl having position: relative, targetEl.offsetLeft gives the exact local position
  const left = targetEl.offsetLeft
  const width = targetEl.offsetWidth

  if (width === 0) {
    requestAnimationFrame(() => updateLinePosition(animated))
    return
  }

  lineLeft.value = left
  lineWidth.value = width

  if (!animated) {
    isLineReady.value = false
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        isLineReady.value = true
      })
    })
  } else {
    isLineReady.value = true
  }
}

function selectTab(id: DrawerTab) {
  if (currentTab.value === id) return
  currentTab.value = id
  updateLinePosition(true)
}

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

  window.dispatchEvent(
    new CustomEvent('tabloom:userNameChanged', { detail: trimmed })
  )
  isSaved.value = true
  setTimeout(() => {
    isSaved.value = false
  }, 1500)
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      loadUserName()
      isLineReady.value = false
      nextTick(() => {
        updateLinePosition(false)
        window.setTimeout(() => updateLinePosition(false), 240)
      })
    }
  },
  { immediate: true }
)

watch(
  () => props.settings.accentColor,
  () => {
    nextTick(() => updateLinePosition(false))
  }
)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen) emit('close')
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', () => updateLinePosition(false))
  if (props.isOpen) {
    nextTick(() => updateLinePosition(false))
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', () => updateLinePosition(false))
})
</script>

<template>
  <div
    class="fixed inset-0 z-[90] overflow-hidden pointer-events-none select-none"
    :class="{ 'pointer-events-auto': props.isOpen }"
  >
    <!-- Smooth Backdrop Fade -->
    <Transition name="drawer-backdrop">
      <div
        v-if="props.isOpen"
        class="fixed inset-0 bg-black/60 backdrop-blur-md pointer-events-auto transition-opacity cursor-pointer"
        @click="emit('close')"
      />
    </Transition>

    <!-- Drawer Panel: Slides from Right to Left on Open; Slides from Left to Right on Close -->
    <Transition name="drawer-slide">
      <aside
        v-if="props.isOpen"
        class="settings-drawer-panel fixed inset-y-0 right-0 flex w-full max-w-sm sm:max-w-md flex-col border-l border-white/10 bg-[#0e0720]/95 shadow-2xl backdrop-blur-2xl pointer-events-auto"
      >
        <!-- Drawer Header -->
        <div
          class="flex items-center justify-between border-b border-white/10 px-5 py-4"
        >
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-semibold tracking-wide text-white">
              Customize Tabloom
            </h2>
          </div>
          <button
            aria-label="Close settings"
            class="rounded-lg p-1.5 text-white/50 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-110 hover:bg-white/10 hover:text-white active:scale-90 cursor-pointer"
            @click="emit('close')"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- Your Name Section -->
        <div class="border-b border-white/10 px-5 py-3.5">
          <label class="block text-xs font-medium text-white/70 mb-1.5">
            Your name
          </label>
          <div class="flex items-center gap-2">
            <input
              v-model="userNameInput"
              type="text"
              maxlength="30"
              placeholder="User"
              class="flex-1 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs text-white placeholder-white/30 outline-none transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus:bg-white/[0.1] focus:ring-1"
              :style="{
                '--tw-ring-color': activeAccent,
              }"
              @keydown.enter="saveUserName"
            />
            <button
              type="button"
              class="flex items-center gap-1 rounded-lg px-3.5 py-1.5 text-xs font-medium shadow-sm transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105 active:scale-95 cursor-pointer"
              :style="{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-contrast)',
                boxShadow: `0 2px 8px 0 var(--accent-glow, rgba(0,0,0,0.2))`,
              }"
              @click="saveUserName"
            >
              <Check v-if="isSaved" class="h-3 w-3 animate-bounce" />
              <span>{{ isSaved ? 'Saved' : 'Save' }}</span>
            </button>
          </div>
        </div>

        <!-- Navigation Tabs with fluid moving underline indicator -->
        <div ref="tabContainerRef" class="relative flex border-b border-white/10 px-5 pt-2.5 select-none">
          <!-- The Single Animated Moving Underline Indicator (Crisp Apple fluid curve & natural glide) -->
          <div
            class="pointer-events-none absolute bottom-0 left-0 h-[2.5px] rounded-full will-change-[transform,width,opacity]"
            :style="{
              transform: `translate3d(${lineLeft}px, 0, 0)`,
              width: `${lineWidth}px`,
              transition: isLineReady
                ? 'transform 460ms cubic-bezier(0.16, 1, 0.3, 1), width 460ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease'
                : 'opacity 200ms ease',
              opacity: isLineReady ? 1 : 0,
              backgroundColor: activeAccent,
              boxShadow: `0 0 12px 2px ${accentGlow}`,
            }"
          />

          <button
            v-for="t in TABS"
            :key="t.id"
            :ref="(el) => setDrawerTabRef(t.id, el)"
            type="button"
            :data-drawer-tab="t.id"
            class="relative flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors duration-200 cursor-pointer select-none"
            :class="[
              currentTab === t.id
                ? 'font-semibold'
                : 'text-white/50 hover:text-white/85 dark:text-white/50 dark:hover:text-white/85 light:text-slate-500 light:hover:text-slate-900',
            ]"
            :style="{
              color: currentTab === t.id ? activeAccent : undefined,
            }"
            @click="selectTab(t.id)"
          >
            <component
              :is="t.icon"
              class="h-3.5 w-3.5 transition-transform duration-200"
              :class="{ 'scale-110': currentTab === t.id }"
            />
            <span>{{ t.label }}</span>
          </button>
        </div>

        <!-- Drawer Content with Curved Slide & Fade Motion -->
        <div class="flex-1 overflow-y-auto p-5 scrollbar-thin [scrollbar-gutter:stable]">
          <Transition name="tab-fade" mode="out-in">
            <SettingsThemeSection
              v-if="currentTab === 'theme'"
              key="theme"
              :settings="props.settings"
              @update="emit('updateSettings', $event)"
              @apply-preset="emit('applyPreset', $event)"
            />
            <SettingsLayoutSection
              v-else-if="currentTab === 'layout'"
              key="layout"
              :settings="props.settings"
              @update="emit('updateSettings', $event)"
              @export="emit('exportConfig')"
              @import="emit('importConfig', $event)"
              @reset="emit('resetDefaults')"
            />
            <SettingsGeneralSection
              v-else
              key="data"
              :settings="props.settings"
              :folders="props.folders"
              @update="emit('updateSettings', $event)"
              @imported-bookmarks="emit('importedBookmarks')"
              @reimport-bookmarks="emit('reimportBookmarks')"
              @clear-hidden="emit('clearHidden')"
            />
          </Transition>
        </div>
      </aside>
    </Transition>
  </div>
</template>

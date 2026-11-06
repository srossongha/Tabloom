<!--
  Root application component assembling the background, navigation, search, grid, and modals.
  Coordinates global lifecycle events, reactive store initializations, and layout state.
-->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { Tile, IconMode } from '../1-domain/entities/Tile'
import { defaultBrowserAdapter } from '../3-infrastructure/browser/browserHistoryAndApiAdapter'
import { defaultStorageAdapter } from '../3-infrastructure/storage/storageAdapter'
import { useSettingsStore } from '../2-application/useCases/useSettingsStore'
import { useTilesStore } from '../2-application/useCases/useTilesStore'
import { useNavigationViews } from '../2-application/useCases/useNavigationViews'
import { filterTiles, sortTiles } from '../2-application/services/tileEngine'
import CosmicCanvas from './components/background/CosmicCanvas.vue'
import TopNavHeader from './components/header/TopNavHeader.vue'
import SideClockWidget from './components/clock/SideClockWidget.vue'
import DynamicGreeting from './components/greeting/DynamicGreeting.vue'
import WebSearchBar from './components/search/WebSearchBar.vue'
import SortModeBar from './components/grid/SortModeBar.vue'
import TileGridContainer from './components/grid/TileGridContainer.vue'
import TileEditorModal from './components/modals/TileEditorModal.vue'
import CustomizeDrawer from './components/settings/CustomizeDrawer.vue'

const settingsStore = useSettingsStore(defaultStorageAdapter)
const tilesStore = useTilesStore(defaultBrowserAdapter, defaultStorageAdapter)
const nav = useNavigationViews()

const isSettingsOpen = ref(false)
const isModalOpen = ref(false)
const editingTile = ref<Tile | null>(null)
const scrollProgress = ref(0)

const visibleTiles = computed(() => {
  const filtered = filterTiles(tilesStore.tiles.value, nav.searchQuery.value)
  return sortTiles(filtered, nav.sortMode.value)
})

function onScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight
  scrollProgress.value = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
}

onMounted(async () => {
  window.addEventListener('scroll', onScroll, { passive: true })
  await Promise.all([settingsStore.init(), tilesStore.init()])
  tilesStore.refresh(nav.activeView.value, settingsStore.settings.value)
})

onUnmounted(() => window.removeEventListener('scroll', onScroll))

watch(
  () => [nav.activeView.value, settingsStore.settings.value.dataSourceMode, settingsStore.settings.value.bookmarkFolder, settingsStore.settings.value.maxDiscoveredTiles],
  () => tilesStore.refresh(nav.activeView.value, settingsStore.settings.value)
)

function onTileClick(tile: Tile) {
  if (nav.activeView.value === 'openTabs' && tile.tabId) {
    defaultBrowserAdapter.focusTab(tile.tabId, tile.windowId)
  } else if (nav.activeView.value === 'lastSession' && tile.sessionId) {
    defaultBrowserAdapter.restoreSession(tile.sessionId)
  } else {
    tilesStore.recordClick(tile)
    if (settingsStore.settings.value.openInNewTab) {
      window.open(tile.url, '_blank')
    } else {
      if (typeof chrome !== 'undefined' && chrome.tabs?.update) {
        chrome.tabs.update({ url: tile.url })
      } else {
        window.location.href = tile.url
      }
    }
  }
}

function onSaveTile(payload: { title: string; url: string; iconMode: IconMode; customIcon?: string; tintColor?: string; pinned: boolean }) {
  if (editingTile.value) tilesStore.updateTile(editingTile.value.id, payload)
  else tilesStore.addCustomTile(payload)
  editingTile.value = null
}

function onExportConfig() {
  const blob = new Blob([settingsStore.exportConfigJson()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'tabloom-config.json'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="relative min-h-screen w-full overflow-hidden select-none" :style="{ background: `radial-gradient(circle at 50% 20%, var(--bg-start) 0%, var(--bg-end) 100%)` }">
    <!-- Top-of-UI Clean Ambient Scrollbar -->
    <div
      class="fixed top-0 left-0 right-0 z-50 h-[3px] bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-500 origin-left transition-transform duration-75 pointer-events-none"
      :style="{ transform: `scaleX(${scrollProgress})` }"
    />

    <div
      v-if="settingsStore.settings.value.customWallpaper"
      class="pointer-events-none fixed inset-0 z-0 bg-cover bg-center transition-all duration-300"
      :style="{
        backgroundImage: `url(${settingsStore.settings.value.customWallpaper})`,
        filter: `blur(${settingsStore.settings.value.wallpaperBlur}px)`,
        opacity: 1 - settingsStore.settings.value.wallpaperDim / 100,
      }"
    />
    <CosmicCanvas :mode="settingsStore.settings.value.particleMode" :density="settingsStore.settings.value.particleDensity" />

    <div class="relative z-10 flex min-h-screen flex-col">
      <TopNavHeader :app-name="settingsStore.settings.value.appName" :active-view="nav.activeView.value" :show-logo="settingsStore.settings.value.showLogo" @select-view="nav.setView" @open-settings="isSettingsOpen = true" />
      <SideClockWidget
        v-if="settingsStore.settings.value.showSideClock"
        :use-24h="settingsStore.settings.value.clock24h"
        @toggle-format="settingsStore.updateSettings({ clock24h: !settingsStore.settings.value.clock24h })"
      />
      <DynamicGreeting />
      <WebSearchBar v-if="settingsStore.settings.value.showSearch" v-model="nav.searchQuery.value" :search-engine="settingsStore.settings.value.searchEngine" :open-in-new-tab="settingsStore.settings.value.openInNewTab" />
      <SortModeBar v-if="settingsStore.settings.value.showSortBar" v-model="nav.sortMode.value" />
      <TileGridContainer
        :tiles="visibleTiles"
        :active-view="nav.activeView.value"
        :grid-cols="settingsStore.settings.value.gridCols"
        :show-add-card="settingsStore.settings.value.showAddCard"
        :show-labels="settingsStore.settings.value.showLabels"
        :is-loading="tilesStore.isLoading.value"
        @click-tile="onTileClick"
        @edit-tile="editingTile = $event; isModalOpen = true"
        @delete-tile="tilesStore.deleteTile($event, (u) => settingsStore.updateSettings({ hiddenUrls: [...settingsStore.settings.value.hiddenUrls, u] }))"
        @close-tab="defaultBrowserAdapter.closeTab($event); tilesStore.refresh(nav.activeView.value, settingsStore.settings.value, true)"
        @reorder="tilesStore.reorder"
        @open-add-modal="editingTile = null; isModalOpen = true"
      />
    </div>

    <TileEditorModal :is-open="isModalOpen" :tile="editingTile" @close="isModalOpen = false; editingTile = null" @save="onSaveTile" />
    <CustomizeDrawer
      :is-open="isSettingsOpen"
      :settings="settingsStore.settings.value"
      :folders="tilesStore.bookmarkFolders.value"
      @close="isSettingsOpen = false"
      @update-settings="settingsStore.updateSettings"
      @apply-preset="settingsStore.applyThemePreset"
      @export-config="onExportConfig"
      @import-config="settingsStore.importConfigJson"
      @reset-defaults="settingsStore.resetDefaults"
      @imported-bookmarks="tilesStore.refresh(nav.activeView.value, settingsStore.settings.value, true)"
      @clear-hidden="settingsStore.clearHiddenUrls(); tilesStore.refresh(nav.activeView.value, settingsStore.settings.value, true)"
    />
  </div>
</template>

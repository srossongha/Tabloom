<!--
  SettingsGeneralSection component managing data sources, bookmark folders, and search providers.
  Provides file upload triggers for Netscape bookmarks HTML parsing and hidden URL restoration.
-->
<script setup lang="ts">
import { RotateCcw, Upload } from 'lucide-vue-next'
import type { AppSettings } from '../../../1-domain/entities/AppSettings'
import type { BookmarkFolder } from '../../../1-domain/entities/BrowserItem'
import { parseBookmarksHtml } from '../../../3-infrastructure/importer/browserDataImporter'

interface Props {
  settings: AppSettings
  folders: BookmarkFolder[]
}
const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update', partial: Partial<AppSettings>): void
  (e: 'importedBookmarks'): void
  (e: 'clearHidden'): void
}>()

function onHtmlFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const items = parseBookmarksHtml(reader.result as string)
    localStorage.setItem('home_tiles_imported_bookmarks', JSON.stringify(items))
    emit('importedBookmarks')
  }
  reader.readAsText(file)
}
</script>

<template>
  <div class="space-y-4 text-xs text-white/80 select-none">
    <div>
      <label class="block font-medium text-white/70">Data Source Mode</label>
      <select
        :value="props.settings.dataSourceMode"
        class="mt-1 w-full rounded-lg border border-white/10 bg-[#1f1035] p-2 text-white outline-none cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-white/25 focus:border-emerald-400"
        @change="emit('update', { dataSourceMode: ($event.target as HTMLSelectElement).value as AppSettings['dataSourceMode'] })"
      >
        <option value="bookmarks-only">Bookmarks Only (Clean & Separated)</option>
        <option value="smart-blend">Smart Blend (Starter Fallback)</option>
        <option value="history-only">Browser History Only</option>
        <option value="manual-only">Manual Custom Tiles Only</option>
      </select>
    </div>

    <div>
      <label class="block font-medium text-white/70">Bookmark Folder</label>
      <select
        :value="props.settings.bookmarkFolder"
        class="mt-1 w-full rounded-lg border border-white/10 bg-[#1f1035] p-2 text-white outline-none cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-white/25 focus:border-emerald-400"
        @change="emit('update', { bookmarkFolder: ($event.target as HTMLSelectElement).value })"
      >
        <option v-for="f in props.folders" :key="f.id" :value="f.id">{{ f.title }}</option>
      </select>
    </div>

    <div>
      <div class="flex justify-between">
        <span>Max Discovered Tiles</span>
        <span class="text-emerald-400 font-mono">{{ props.settings.maxDiscoveredTiles }}</span>
      </div>
      <input
        type="range"
        min="6"
        max="60"
        step="6"
        :value="props.settings.maxDiscoveredTiles"
        class="mt-1 w-full accent-emerald-500 cursor-pointer"
        @input="emit('update', { maxDiscoveredTiles: Number(($event.target as HTMLInputElement).value) })"
      />
    </div>

    <div>
      <label class="block font-medium text-white/70">Search Engine</label>
      <select
        :value="props.settings.searchEngine"
        class="mt-1 w-full rounded-lg border border-white/10 bg-[#1f1035] p-2 text-white outline-none cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-white/25 focus:border-emerald-400"
        @change="emit('update', { searchEngine: ($event.target as HTMLSelectElement).value as AppSettings['searchEngine'] })"
      >
        <option value="google">Google</option>
        <option value="duckduckgo">DuckDuckGo</option>
        <option value="brave">Brave</option>
        <option value="youtube">YouTube</option>
        <option value="perplexity">Perplexity</option>
        <option value="chatgpt">ChatGPT</option>
      </select>
    </div>

    <label class="flex items-center gap-2 pt-1 font-medium text-white/80 cursor-pointer">
      <input
        type="checkbox"
        :checked="props.settings.openInNewTab"
        class="rounded accent-emerald-500 cursor-pointer transition-transform hover:scale-110"
        @change="emit('update', { openInNewTab: ($event.target as HTMLInputElement).checked })"
      />
      Open links in new tab
    </label>

    <div class="flex flex-col gap-2 pt-2 border-t border-white/10">
      <label class="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 py-2 font-medium transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/20 hover:-translate-y-0.5 hover:scale-[1.01] active:scale-95">
        <Upload class="h-3.5 w-3.5 text-emerald-400" /> Import Bookmarks HTML
        <input type="file" accept=".html,.htm" class="hidden" @change="onHtmlFile" />
      </label>

      <button
        type="button"
        class="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/10 hover:-translate-y-0.5 hover:scale-[1.01] active:scale-95 cursor-pointer"
        @click="emit('clearHidden')"
      >
        <RotateCcw class="h-3.5 w-3.5" /> Restore Hidden Tiles ({{ props.settings.hiddenUrls.length }})
      </button>
    </div>
  </div>
</template>


<!--
  SettingsGeneralSection component managing data sources, bookmark folders, and search providers.
  Provides file upload triggers for Netscape bookmarks HTML parsing and hidden URL restoration.
-->
<script setup lang="ts">
import { RotateCcw, Upload, Bookmark } from "lucide-vue-next";
import type { AppSettings } from "../../../1-domain/entities/AppSettings";
import type { BookmarkFolder } from "../../../1-domain/entities/BrowserItem";
import { parseBookmarksHtml } from "../../../3-infrastructure/importer/browserDataImporter";

interface Props {
  settings: AppSettings;
  folders: BookmarkFolder[];
}
const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "update", partial: Partial<AppSettings>): void;
  (e: "importedBookmarks"): void;
  (e: "reimportBookmarks"): void;
  (e: "clearHidden"): void;
}>();

function onHtmlFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const items = parseBookmarksHtml(reader.result as string);
    localStorage.setItem(
      "home_tiles_imported_bookmarks",
      JSON.stringify(items),
    );
    emit("importedBookmarks");
  };
  reader.readAsText(file);
}
</script>

<template>
  <div class="space-y-4 text-xs text-white/80 select-none">
    <div>
      <label class="block font-medium text-white/70">Data Source Mode</label>
      <select
        :value="props.settings.dataSourceMode"
        class="settings-select mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 pr-10 text-xs text-white outline-none cursor-pointer transition-all duration-200"
        @change="
          emit('update', {
            dataSourceMode: ($event.target as HTMLSelectElement)
              .value as AppSettings['dataSourceMode'],
          })
        "
      >
        <option value="bookmarks-only">
          Bookmarks Only (Clean & Separated)
        </option>
        <option value="smart-blend">
          Smart Blend (Starter Fallback)
        </option>
        <option value="history-only">
          Browser History Only
        </option>
        <option value="manual-only">
          Manual Custom Tiles Only
        </option>
      </select>
    </div>

    <div>
      <label class="block font-medium text-white/70">Bookmark Folder</label>
      <select
        :value="props.settings.bookmarkFolder"
        class="settings-select mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 pr-10 text-xs text-white outline-none cursor-pointer transition-all duration-200"
        @change="
          emit('update', {
            bookmarkFolder: ($event.target as HTMLSelectElement).value,
          })
        "
      >
        <option
          v-for="f in props.folders"
          :key="f.id"
          :value="f.id"
        >
          {{ f.title }}
        </option>
      </select>
    </div>

    <div>
      <label class="block font-medium text-white/70">Search Engine</label>
      <select
        :value="props.settings.searchEngine"
        class="settings-select mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 pr-10 text-xs text-white outline-none cursor-pointer transition-all duration-200"
        @change="
          emit('update', {
            searchEngine: ($event.target as HTMLSelectElement)
              .value as AppSettings['searchEngine'],
          })
        "
      >
        <option value="google">
          Google
        </option>
        <option value="duckduckgo">
          DuckDuckGo
        </option>
        <option value="brave">
          Brave Search
        </option>
        <option value="youtube">
          YouTube
        </option>
        <option value="perplexity">
          Perplexity AI
        </option>
        <option value="chatgpt">
          ChatGPT
        </option>
      </select>
    </div>

    <label class="flex items-center gap-2 cursor-pointer pt-1">
      <input
        type="checkbox"
        :checked="props.settings.openInNewTab"
        class="rounded cursor-pointer transition-transform hover:scale-110"
        :style="{ accentColor: 'var(--accent)' }"
        @change="
          emit('update', {
            openInNewTab: ($event.target as HTMLInputElement).checked,
          })
        "
      />
      Open links in new tab
    </label>

    <div class="flex flex-col gap-2.5 pt-2 border-t border-white/10">
      <button
        type="button"
        class="flex items-center justify-center gap-2 rounded-lg border py-2 font-medium transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:scale-[1.01] active:scale-95 cursor-pointer"
        :style="{
          borderColor: 'var(--accent)',
          backgroundColor: 'var(--accent-15)',
          color: 'var(--accent)',
        }"
        @click="emit('reimportBookmarks')"
      >
        <Bookmark class="h-3.5 w-3.5" /> Re-sync from Browser Bookmarks
      </button>

      <p class="text-[10.5px] text-white/50 leading-relaxed px-1">
        Your browser bookmarks were collected on first launch. Customizing or
        deleting shortcuts on Tabloom never modifies or deletes your actual
        browser bookmarks.
      </p>

      <label
        class="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 py-2 font-medium transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/20 hover:-translate-y-0.5 hover:scale-[1.01] active:scale-95"
      >
        <Upload class="h-3.5 w-3.5" :style="{ color: 'var(--accent)' }" /> Import Bookmarks HTML
        <input
          type="file"
          accept=".html,.htm"
          class="hidden"
          @change="onHtmlFile"
        />
      </label>

      <div
        v-if="props.settings.hiddenUrls.length"
        class="flex items-center justify-between pt-2 border-t border-white/10"
      >
        <span class="text-white/60 text-[11px]">
          {{ props.settings.hiddenUrls.length }} hidden shortcuts
        </span>
        <button
          type="button"
          class="flex items-center gap-1 text-[11px] hover:underline cursor-pointer"
          :style="{ color: 'var(--accent)' }"
          @click="emit('clearHidden')"
        >
          <RotateCcw class="h-3 w-3" /> Unhide all
        </button>
      </div>
    </div>
  </div>
</template>

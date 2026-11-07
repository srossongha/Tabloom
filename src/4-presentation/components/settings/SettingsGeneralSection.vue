<!--
  SettingsGeneralSection component managing data sources, bookmark folders, and search providers.
  Provides file upload triggers for Netscape bookmarks HTML parsing and hidden URL restoration.
-->
<script setup lang="ts">
import { RotateCcw, Upload, Bookmark, Check } from "lucide-vue-next";
import type { AppSettings } from "../../../1-domain/entities/AppSettings";
import type { BookmarkFolder } from "../../../1-domain/entities/BrowserItem";
import { parseBookmarksHtml } from "../../../3-infrastructure/importer/browserDataImporter";
import { isColorBright } from "../../../2-application/services/colorUtils";
import TabBrandingSection from "./TabBrandingSection.vue";

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

const ACCENT_SWATCHES: Array<{ label: string; color: string }> = [
  { label: "Emerald Green", color: "#10b981" },
  { label: "Electric Blue", color: "#3b82f6" },
  { label: "Sky Cyan", color: "#06b6d4" },
  { label: "Cosmic Purple", color: "#8b5cf6" },
  { label: "Sakura Pink", color: "#ec4899" },
  { label: "Neon Coral", color: "#f43f5e" },
  { label: "Sunset Amber", color: "#f59e0b" },
  { label: "Crisp Indigo", color: "#6366f1" },
  { label: "Pure White", color: "#ffffff" },
];

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
    <!-- Browser Tab & Logo Identity Customization -->
    <TabBrandingSection
      :settings="props.settings"
      @update="emit('update', $event)"
    />

    <div>
      <label class="block font-medium text-white/70">Data Source Mode</label>
      <select
        :value="props.settings.dataSourceMode"
        class="settings-select mt-1 w-full rounded-lg border border-white/15 bg-white/5 p-2 text-white outline-none cursor-pointer transition-all duration-200 focus:border-emerald-400"
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
        class="settings-select mt-1 w-full rounded-lg border border-white/15 bg-white/5 p-2 text-white outline-none cursor-pointer transition-all duration-200 focus:border-emerald-400"
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
      <div class="flex justify-between">
        <span>Max Discovered Tiles</span>
        <span class="text-emerald-400 font-mono">{{
          props.settings.maxDiscoveredTiles
        }}</span>
      </div>
      <input
        type="range"
        min="6"
        max="60"
        step="6"
        :value="props.settings.maxDiscoveredTiles"
        class="mt-1 w-full accent-emerald-500 cursor-pointer"
        @input="
          emit('update', {
            maxDiscoveredTiles: Number(
              ($event.target as HTMLInputElement).value,
            ),
          })
        "
      />
    </div>

    <div>
      <label class="block font-medium text-white/70">Search Engine</label>
      <select
        :value="props.settings.searchEngine"
        class="settings-select mt-1 w-full rounded-lg border border-white/15 bg-white/5 p-2 text-white outline-none cursor-pointer transition-all duration-200 focus:border-emerald-400"
        @change="
          emit('update', {
            searchEngine: ($event.target as HTMLSelectElement)
              .value as AppSettings['searchEngine'],
          })
        "
      >
        <option value="google">Google</option>
        <option value="duckduckgo">DuckDuckGo</option>
        <option value="brave">Brave</option>
        <option value="youtube">YouTube</option>
        <option value="perplexity">Perplexity</option>
        <option value="chatgpt">ChatGPT</option>
      </select>
    </div>

    <label
      class="flex items-center gap-2 pt-1 font-medium text-white/80 cursor-pointer"
    >
      <input
        type="checkbox"
        :checked="props.settings.openInNewTab"
        class="rounded accent-emerald-500 cursor-pointer transition-transform hover:scale-110"
        @change="
          emit('update', {
            openInNewTab: ($event.target as HTMLInputElement).checked,
          })
        "
      />
      Open links in new tab
    </label>

    <div class="flex flex-col gap-2.5 pt-2 border-t border-white/10">
      <!-- Dedicated Bookmarks Tab Color Setting -->
      <div class="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2.5">
        <div class="flex items-center justify-between">
          <div>
            <span class="block text-xs font-semibold text-white/90">Bookmarks Active Tab Color</span>
            <span class="text-[10.5px] text-white/45">Change the green color of the Bookmarks button</span>
          </div>
          <!-- Live replica of the Bookmarks button from user's screenshot -->
          <div
            class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition-all duration-300 select-none"
            :style="{
              backgroundColor: props.settings.accentColor,
              color: isColorBright(props.settings.accentColor) ? '#0f172a' : '#ffffff',
            }"
          >
            <Bookmark class="h-3.5 w-3.5" />
            <span>Bookmarks</span>
          </div>
        </div>

        <!-- Quick 1-click Accent Swatches -->
        <div class="flex flex-wrap items-center gap-1.5">
          <button
            v-for="swatch in ACCENT_SWATCHES"
            :key="swatch.color"
            type="button"
            :title="swatch.label"
            class="flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-200 hover:scale-115 active:scale-95 cursor-pointer"
            :class="[
              props.settings.accentColor.toLowerCase() === swatch.color.toLowerCase()
                ? 'border-white scale-110 shadow-md ring-2 ring-white/40'
                : 'border-white/10 hover:border-white/30',
            ]"
            :style="{ backgroundColor: swatch.color }"
            @click="emit('update', { accentColor: swatch.color })"
          >
            <Check
              v-if="props.settings.accentColor.toLowerCase() === swatch.color.toLowerCase()"
              class="h-3 w-3"
              :class="isColorBright(swatch.color) ? 'text-slate-900' : 'text-white'"
            />
          </button>

          <!-- Custom Color input -->
          <label class="flex items-center gap-1.5 ml-auto rounded-lg border border-white/10 bg-white/5 px-2 py-1 cursor-pointer hover:border-white/20">
            <span class="font-mono text-[11px] text-white/80 uppercase">{{ props.settings.accentColor }}</span>
            <input
              type="color"
              :value="props.settings.accentColor"
              class="h-5 w-6 cursor-pointer border-0 bg-transparent transition-transform hover:scale-110"
              @input="emit('update', { accentColor: ($event.target as HTMLInputElement).value })"
            />
          </label>
        </div>
      </div>

      <button
        type="button"
        class="flex items-center justify-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 py-2 font-medium text-emerald-300 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-emerald-500/20 hover:-translate-y-0.5 hover:scale-[1.01] active:scale-95 cursor-pointer"
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
        <Upload class="h-3.5 w-3.5 text-emerald-400" /> Import Bookmarks HTML
        <input
          type="file"
          accept=".html,.htm"
          class="hidden"
          @change="onHtmlFile"
        />
      </label>

      <button
        type="button"
        class="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/10 hover:-translate-y-0.5 hover:scale-[1.01] active:scale-95 cursor-pointer"
        @click="emit('clearHidden')"
      >
        <RotateCcw class="h-3.5 w-3.5" /> Restore Hidden Tiles ({{
          props.settings.hiddenUrls.length
        }})
      </button>
    </div>
  </div>
</template>

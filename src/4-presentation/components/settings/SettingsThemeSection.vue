<!--
  SettingsThemeSection component offering theme preset selection, custom color pickers,
  high-performance local wallpaper uploads (GIF, MP4, images) and ambient audio tracks (MP3/WAV/OGG).
  Supports local IndexedDB storage for zero-lag performance or account-synced URLs.
-->
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  Upload,
  Trash2,
  Music,
  Check,
  HardDrive,
  Moon,
  Sun,
  Sparkles,
  Bookmark,
  Clock,
  Monitor,
  Landmark,
  Palette,
  RotateCcw,
} from "lucide-vue-next";
import type {
  AppSettings,
  ThemePreset,
  ThemeMode,
  ClockTheme,
} from "../../../1-domain/entities/AppSettings";
import {
  mediaStorageService,
  type MediaMetadata,
} from "../../../3-infrastructure/storage/mediaStorageService";
import { convertImageToWebP } from "../../../2-application/services/imageOptimizerService";
import { isColorBright } from "../../../2-application/services/colorUtils";
import TabBrandingSection from "./TabBrandingSection.vue";
import SegmentedPillControl, {
  type SegmentedOption,
} from "../common/SegmentedPillControl.vue";

interface Props {
  settings: AppSettings;
}
const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "update", partial: Partial<AppSettings>): void;
  (e: "applyPreset", preset: ThemePreset): void;
  (e: "reset"): void;
}>();

const THEME_MODES: Array<SegmentedOption<ThemeMode>> = [
  { id: "dark", label: "Dark", icon: Moon },
  { id: "light", label: "Light", icon: Sun },
  { id: "auto", label: "Auto", icon: Sparkles },
];

const BACKGROUND_MODES: Array<SegmentedOption<string>> = [
  { id: "gradient", label: "Gradient Colors", icon: Palette },
  { id: "wallpaper", label: "Custom Wallpaper", icon: HardDrive },
];

const activeBackgroundMode = computed(() => {
  return props.settings.showCustomWallpaper && props.settings.customWallpaper
    ? "wallpaper"
    : "gradient";
});

function onSelectBackgroundMode(mode: string) {
  emit("update", { showCustomWallpaper: mode === "wallpaper" });
}

const DARK_PRESETS: Array<{ id: ThemePreset; label: string; color: string }> = [
  { id: "cosmic-purple", label: "Cosmic Purple", color: "#2b1055" },
  { id: "oled-black", label: "OLED Black", color: "#000000" },
  { id: "tokyo-night", label: "Tokyo Night", color: "#1a1b26" },
  { id: "emerald-aurora", label: "Emerald Aurora", color: "#064e3b" },
  { id: "cyberpunk-neon", label: "Cyberpunk", color: "#240046" },
  { id: "frosted-minimal", label: "Frosted Slate", color: "#1e293b" },
];

const LIGHT_PRESETS: Array<{ id: ThemePreset; label: string; color: string }> =
  [
    { id: "cotton-white", label: "Cotton White", color: "#f8fafc" },
    { id: "sakura-day", label: "Sakura Day", color: "#fff1f2" },
    { id: "nordic-light", label: "Nordic Light", color: "#f0f9ff" },
    { id: "cream-latte", label: "Cream Latte", color: "#fef3c7" },
  ];

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

const WALLPAPER_PRESETS: Array<{
  id: string;
  name: string;
  url: string;
  type: "light" | "dark";
}> = [
  {
    id: "alpine-lake",
    name: "Alpine Lake",
    type: "dark",
    url: "/image/alpine-lake.webp",
  },
  {
    id: "misty-canopy",
    name: "Misty Canopy",
    type: "dark",
    url: "/image/misty-canopy.webp",
  },
  {
    id: "misty-pines",
    name: "Misty Pines",
    type: "dark",
    url: "/image/misty-pines.webp",
  },
  {
    id: "mountain-summit",
    name: "Mountain Summit",
    type: "dark",
    url: "/image/mountain-summit.webp",
  },
];

const CLOCK_THEMES: Array<{
  id: ClockTheme;
  label: string;
  desc: string;
  icon: any;
}> = [
  {
    id: "digital-lcd",
    label: "Digital LCD",
    desc: "7-segment with ghost lines",
    icon: Monitor,
  },
  {
    id: "digital-clean",
    label: "Digital Clean",
    desc: "Active 7-segment lines only",
    icon: Sparkles,
  },
  {
    id: "clock-tower",
    label: "Clock Tower",
    desc: "Roman numeral tower dial",
    icon: Landmark,
  },
  {
    id: "minimal",
    label: "Minimal Clean",
    desc: "Modern typography display",
    icon: Clock,
  },
];

const localWallpaperInfo = ref<MediaMetadata | null>(null);
const localAudioInfo = ref<MediaMetadata | null>(null);
const uploadMessage = ref("");

async function refreshMediaInfo() {
  localWallpaperInfo.value =
    await mediaStorageService.getMediaInfo("wallpaper");
  localAudioInfo.value = await mediaStorageService.getMediaInfo("audio");
}

function formatBytes(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function onWallpaperUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  try {
    // If user dropped or selected an audio file in the wallpaper slot (e.g. mp3)
    if (
      file.type.startsWith("audio/") ||
      file.name.match(/\.(mp3|wav|ogg|m4a)$/i)
    ) {
      await mediaStorageService.saveMedia("audio", file, file.name);
      await refreshMediaInfo();
      emit("update", {
        backgroundAudio: "local:audio",
        backgroundAudioName: file.name,
        backgroundAudioAutoplay: true,
      });
      window.dispatchEvent(
        new CustomEvent("tabloom:mediaUpdated", { detail: { id: "audio" } }),
      );
      uploadMessage.value = `Audio "${file.name}" saved locally!`;
      setTimeout(() => {
        uploadMessage.value = "";
      }, 3000);
      return;
    }

    const isVideo =
      file.type.startsWith("video/") || file.name.match(/\.(mp4|webm)$/i);

    let fileToSave: File | Blob = file;
    let fileNameToSave = file.name;

    if (!isVideo) {
      uploadMessage.value = "Converting image to high-performance .webp...";
      const result = await convertImageToWebP(file, file.name);
      fileToSave = result.blob;
      fileNameToSave = result.fileName;
    }

    await mediaStorageService.saveMedia("wallpaper", fileToSave, fileNameToSave);
    await refreshMediaInfo();

    emit("update", {
      customWallpaper: "local:wallpaper",
      wallpaperType: isVideo ? "video" : "image",
      showCustomWallpaper: true,
    });
    window.dispatchEvent(
      new CustomEvent("tabloom:mediaUpdated", { detail: { id: "wallpaper" } }),
    );
    uploadMessage.value = isVideo
      ? `Video "${file.name}" saved locally!`
      : `Wallpaper converted to .webp ("${fileNameToSave}") & cached!`;
    setTimeout(() => {
      uploadMessage.value = "";
    }, 4000);
  } finally {
    (e.target as HTMLInputElement).value = "";
  }
}

async function removeWallpaper() {
  try {
    await mediaStorageService.removeMedia("wallpaper");
  } catch {}
  localWallpaperInfo.value = null;
  emit("update", { customWallpaper: "", showCustomWallpaper: false });
  window.dispatchEvent(
    new CustomEvent("tabloom:mediaUpdated", { detail: { id: "wallpaper" } }),
  );
  uploadMessage.value = "Wallpaper cleared! Background color active.";
  setTimeout(() => {
    uploadMessage.value = "";
  }, 2500);
}

function onSelectThemeMode(mode: "dark" | "light" | "auto") {
  if (mode === "light") {
    emit("update", {
      themeMode: "light",
      bgStart: "#ffffff",
      bgEnd: "#f1f5f9",
      tileBg: "rgba(255, 255, 255, 0.85)",
      textColor: "#0f172a",
      themePreset: "cotton-white",
    });
  } else if (mode === "dark") {
    emit("update", {
      themeMode: "dark",
      bgStart: "#2b1055",
      bgEnd: "#090314",
      tileBg: "rgba(43, 16, 85, 0.45)",
      textColor: "#ffffff",
      themePreset: "cosmic-purple",
    });
  } else {
    emit("update", { themeMode: "auto" });
  }
}

async function onAudioUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  try {
    await mediaStorageService.saveMedia("audio", file, file.name);
    await refreshMediaInfo();
    emit("update", {
      backgroundAudio: "local:audio",
      backgroundAudioName: file.name,
      backgroundAudioAutoplay: true,
    });
    window.dispatchEvent(
      new CustomEvent("tabloom:mediaUpdated", { detail: { id: "audio" } }),
    );
    uploadMessage.value = `Audio "${file.name}" saved locally!`;
    setTimeout(() => {
      uploadMessage.value = "";
    }, 3000);
  } finally {
    (e.target as HTMLInputElement).value = "";
  }
}

async function removeAudio() {
  await mediaStorageService.removeMedia("audio");
  localAudioInfo.value = null;
  emit("update", { backgroundAudio: "", backgroundAudioName: "" });
  window.dispatchEvent(
    new CustomEvent("tabloom:mediaUpdated", { detail: { id: "audio" } }),
  );
}

onMounted(() => {
  refreshMediaInfo();
});
</script>

<template>
  <div class="space-y-4 text-xs text-white/80">
    <!-- Browser Tab & Logo Identity Customization -->
    <TabBrandingSection
      :settings="props.settings"
      @update="emit('update', $event)"
    />

    <!-- Success Toast Notification -->
    <div
      v-if="uploadMessage"
      class="flex items-center gap-1.5 rounded-lg border px-3 py-2 transition-all animate-pulse"
      :style="{
        borderColor: `${props.settings.accentColor}50`,
        backgroundColor: `${props.settings.accentColor}18`,
        color: props.settings.accentColor,
      }"
    >
      <Check class="h-3.5 w-3.5" />
      <span>{{ uploadMessage }}</span>
    </div>

    <!-- Theme Mode Switcher (Dark / Light / Auto) -->
    <div class="space-y-1.5">
      <div class="flex items-center justify-between">
        <span class="font-medium text-white/70">Theme Mode</span>
        <span
          class="text-[11px] font-mono capitalize"
          :style="{ color: props.settings.accentColor }"
          >{{ props.settings.themeMode || "auto" }}</span
        >
      </div>
      <SegmentedPillControl
        :model-value="props.settings.themeMode || 'auto'"
        :options="THEME_MODES"
        :accent-color="props.settings.accentColor"
        @change="onSelectThemeMode($event as ThemeMode)"
      />
    </div>

    <!-- Theme Presets: Dark Collection -->
    <div class="space-y-1.5">
      <div class="flex items-center justify-between">
        <span class="block font-medium text-white/70">Dark Themes</span>
        <span class="text-[10px] text-white/40">Glass & Deep Gradients</span>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="p in DARK_PRESETS"
          :key="p.id"
          type="button"
          class="flex items-center gap-2 rounded-lg border p-2 text-left transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          :class="[
            props.settings.themePreset === p.id
              ? 'bg-white/10 text-white shadow-md'
              : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10 hover:text-white',
          ]"
          :style="
            props.settings.themePreset === p.id
              ? {
                  borderColor: props.settings.accentColor,
                  boxShadow: `0 0 12px 0 ${props.settings.accentColor}30`,
                }
              : undefined
          "
          @click="emit('applyPreset', p.id)"
        >
          <span
            class="h-3.5 w-3.5 rounded-full border border-white/20 transition-transform duration-200 group-hover:scale-110 shadow-sm"
            :style="{ backgroundColor: p.color }"
          />
          <span class="font-medium">{{ p.label }}</span>
        </button>
      </div>
    </div>

    <!-- Theme Presets: Light Collection -->
    <div class="space-y-1.5">
      <div class="flex items-center justify-between">
        <span class="block font-medium text-white/70">Light Themes</span>
        <span class="text-[10px] text-white/40"
          >Clean, Frosted & High-Contrast</span
        >
      </div>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="p in LIGHT_PRESETS"
          :key="p.id"
          type="button"
          class="flex items-center gap-2 rounded-lg border p-2 text-left transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          :class="[
            props.settings.themePreset === p.id
              ? 'bg-white/10 text-white shadow-md'
              : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10 hover:text-white',
          ]"
          :style="
            props.settings.themePreset === p.id
              ? {
                  borderColor: props.settings.accentColor,
                  boxShadow: `0 0 12px 0 ${props.settings.accentColor}30`,
                }
              : undefined
          "
          @click="emit('applyPreset', p.id)"
        >
          <span
            class="h-3.5 w-3.5 rounded-full border border-black/20 transition-transform duration-200 group-hover:scale-110 shadow-sm"
            :style="{ backgroundColor: p.color }"
          />
          <span class="font-medium">{{ p.label }}</span>
        </button>
      </div>
    </div>

    <!-- Active Bookmarks & Navigation Tab Color -->
    <div class="space-y-3 border-t border-white/10 pt-3">
      <div class="flex items-center justify-between">
        <div>
          <span class="block font-medium text-white/90">App Accent Color</span>
          <span class="text-[11px] text-white/45"
            >Buttons, tabs, active highlights, and badges</span
          >
        </div>
        <!-- Live replica of the Bookmarks button from user's screenshot -->
        <div
          class="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 shadow-sm select-none"
        >
          <div
            class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition-all duration-300"
            :style="{
              backgroundColor: props.settings.accentColor,
              color: isColorBright(props.settings.accentColor)
                ? '#0f172a'
                : '#ffffff',
            }"
          >
            <Bookmark class="h-3.5 w-3.5" />
            <span>Active Accent</span>
          </div>
        </div>
      </div>

      <!-- Quick 1-click Accent Swatches -->
      <div class="grid grid-cols-5 gap-1.5 sm:grid-cols-9">
        <button
          v-for="swatch in ACCENT_SWATCHES"
          :key="swatch.color"
          type="button"
          :title="swatch.label"
          class="group relative flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-115 active:scale-95 cursor-pointer"
          :class="[
            props.settings.accentColor.toLowerCase() ===
            swatch.color.toLowerCase()
              ? 'border-white scale-110 shadow-md ring-2 ring-white/40'
              : 'border-white/10 hover:border-white/30',
          ]"
          :style="{ backgroundColor: swatch.color }"
          @click="emit('update', { accentColor: swatch.color })"
        >
          <Check
            v-if="
              props.settings.accentColor.toLowerCase() ===
              swatch.color.toLowerCase()
            "
            class="h-3.5 w-3.5"
            :class="
              isColorBright(swatch.color) ? 'text-slate-900' : 'text-white'
            "
          />
        </button>
      </div>

      <!-- Custom Color Picker row with Hex display -->
      <label
        class="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-2 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08] cursor-pointer"
      >
        <div class="flex items-center gap-2">
          <span class="text-xs text-white/70">Custom Accent Color</span>
          <span
            class="font-mono text-xs font-semibold text-white/90 uppercase"
            >{{ props.settings.accentColor }}</span
          >
        </div>
        <input
          type="color"
          :value="props.settings.accentColor"
          class="h-6 w-8 cursor-pointer rounded border-0 bg-transparent transition-transform hover:scale-110"
          @input="
            emit('update', {
              accentColor: ($event.target as HTMLInputElement).value,
            })
          "
        />
      </label>
    </div>

    <!-- Background & Label Colors -->
    <div class="space-y-2 border-t border-white/10 pt-3">
      <span class="block font-medium text-white/70"
        >Background & Text Colors</span
      >
      <div class="grid grid-cols-3 gap-2">
        <label
          class="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-white/20 hover:bg-white/[0.08] cursor-pointer"
        >
          <span class="text-xs">Grad Start</span>
          <input
            type="color"
            :value="props.settings.bgStart"
            class="h-5 w-6 cursor-pointer border-0 bg-transparent transition-transform hover:scale-110"
            @input="
              emit('update', {
                bgStart: ($event.target as HTMLInputElement).value,
                showCustomWallpaper: false,
              })
            "
          />
        </label>
        <label
          class="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-white/20 hover:bg-white/[0.08] cursor-pointer"
        >
          <span class="text-xs">Grad End</span>
          <input
            type="color"
            :value="props.settings.bgEnd"
            class="h-5 w-6 cursor-pointer border-0 bg-transparent transition-transform hover:scale-110"
            @input="
              emit('update', {
                bgEnd: ($event.target as HTMLInputElement).value,
                showCustomWallpaper: false,
              })
            "
          />
        </label>
        <label
          class="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-white/20 hover:bg-white/[0.08] cursor-pointer"
        >
          <span class="text-xs">Label Text</span>
          <input
            type="color"
            :value="props.settings.textColor"
            class="h-5 w-6 cursor-pointer border-0 bg-transparent transition-transform hover:scale-110"
            @input="
              emit('update', {
                textColor: ($event.target as HTMLInputElement).value,
              })
            "
          />
        </label>
      </div>

      <!-- Live Wallpaper Overlay Notification -->
      <div
        v-if="
          props.settings.customWallpaper && props.settings.showCustomWallpaper
        "
        class="flex items-center justify-between rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-amber-200 text-[11px]"
      >
        <div class="flex items-center gap-1.5 truncate">
          <span>🖼️ Wallpaper is active and covering your colors.</span>
        </div>
        <button
          type="button"
          class="shrink-0 rounded bg-amber-500/25 px-2 py-0.5 text-[11px] font-semibold text-amber-100 hover:bg-amber-500/40 cursor-pointer"
          @click="emit('update', { showCustomWallpaper: false })"
        >
          Show Colors
        </button>
      </div>
    </div>

    <!-- Clock Theme / Style Selector -->
    <div class="space-y-2 border-t border-white/10 pt-3">
      <div class="flex items-center justify-between">
        <span class="font-medium text-white/70">Clock Theme</span>
        <span class="text-[10px] text-white/40">4 distinct styles</span>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="ct in CLOCK_THEMES"
          :key="ct.id"
          type="button"
          class="flex flex-col items-start gap-1 p-2 rounded-lg border text-left transition-all duration-200"
          :class="[
            props.settings.clockTheme === ct.id
              ? 'text-white shadow-sm'
              : 'border-white/5 bg-white/[0.03] text-white/70 hover:border-white/15 hover:bg-white/[0.08] hover:text-white',
          ]"
          :style="
            props.settings.clockTheme === ct.id
              ? {
                  borderColor: props.settings.accentColor,
                  backgroundColor: `${props.settings.accentColor}18`,
                  boxShadow: `0 0 10px 0 ${props.settings.accentColor}30`,
                }
              : undefined
          "
          @click="emit('update', { clockTheme: ct.id })"
        >
          <div class="flex items-center gap-1.5 w-full">
            <component
              :is="ct.icon"
              class="h-3.5 w-3.5 shrink-0"
              :style="{ color: props.settings.accentColor }"
            />
            <span class="font-medium text-[11px] truncate">{{ ct.label }}</span>
          </div>
          <span class="text-[9px] text-white/40 leading-tight">{{
            ct.desc
          }}</span>
        </button>
      </div>
    </div>

    <!-- Custom Wallpaper (Image, GIF, MP4) -->
    <div class="space-y-3 border-t border-white/10 pt-3">
      <div class="flex items-center justify-between">
        <div>
          <span class="font-medium text-white/90"
            >Background Mode & Wallpaper</span
          >
          <p class="text-[10px] text-white/50">
            Choose clean colors or media wallpaper
          </p>
        </div>
        <button
          v-if="props.settings.customWallpaper"
          type="button"
          class="flex items-center gap-1 rounded-md bg-rose-500/20 px-2 py-1 text-[11px] font-medium text-rose-300 hover:bg-rose-500/30 transition-colors cursor-pointer"
          title="Clear wallpaper and restore background gradient"
          @click="removeWallpaper"
        >
          <Trash2 class="h-3 w-3" />
          <span>Clear Wallpaper</span>
        </button>
      </div>

      <!-- Mode Selector: Gradient Colors vs Media Wallpaper -->
      <SegmentedPillControl
        :model-value="activeBackgroundMode"
        :options="BACKGROUND_MODES"
        :accent-color="props.settings.accentColor"
        @change="onSelectBackgroundMode"
      />

      <!-- Active Local Wallpaper Badge -->
      <div
        v-if="
          props.settings.customWallpaper === 'local:wallpaper' &&
          localWallpaperInfo
        "
        class="flex items-center justify-between rounded-lg border px-3 py-2 text-xs"
        :style="{
          borderColor: `${props.settings.accentColor}30`,
          backgroundColor: `${props.settings.accentColor}12`,
        }"
      >
        <div class="flex items-center gap-2 truncate">
          <HardDrive class="h-3.5 w-3.5 shrink-0" :style="{ color: props.settings.accentColor }" />
          <div class="truncate">
            <span class="font-medium text-white/90 truncate block">
              {{ localWallpaperInfo.name }}
            </span>
            <span class="text-[10px]" :style="{ color: props.settings.accentColor }">
              Local DB • {{ formatBytes(localWallpaperInfo.size) }} (Fast 0-lag load)
            </span>
          </div>
        </div>
        <button
          type="button"
          class="rounded p-1 text-white/40 hover:bg-rose-500/20 hover:text-rose-300 cursor-pointer"
          title="Remove local wallpaper"
          @click="removeWallpaper"
        >
          <Trash2 class="h-3.5 w-3.5" />
        </button>
      </div>

      <!-- Wallpaper URL / File Picker -->
      <div class="flex items-center gap-2">
        <input
          type="text"
          placeholder="Paste Image, GIF, or Video URL (syncs to account)..."
          :value="
            props.settings.customWallpaper === 'local:wallpaper'
              ? ''
              : props.settings.customWallpaper
          "
          class="flex-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 outline-none placeholder-white/30 text-xs"
          @input="
            emit('update', {
              customWallpaper: ($event.target as HTMLInputElement).value,
              showCustomWallpaper: true,
            })
          "
        />
        <label
          class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 hover:bg-white/20 transition-colors"
          title="Upload GIF, MP4, or Image (stored locally)"
        >
          <Upload class="h-3.5 w-3.5 text-white" />
          <span class="text-[11px] font-medium text-white hidden sm:inline"
            >Upload</span
          >
          <input
            type="file"
            accept="image/*,video/mp4,video/webm,.gif,.mp4,.webm,.mp3,.wav,.ogg,.m4a"
            class="hidden"
            @change="onWallpaperUpload"
          />
        </label>
        <button
          v-if="props.settings.customWallpaper"
          type="button"
          class="rounded-lg border border-white/10 bg-rose-500/20 p-2 text-rose-300 hover:bg-rose-500/40 cursor-pointer"
          title="Clear wallpaper"
          @click="removeWallpaper"
        >
          <Trash2 class="h-3.5 w-3.5" />
        </button>
      </div>

      <!-- Wallpaper Presets (Light & Dark) -->
      <div class="space-y-1.5 pt-1">
        <span class="block text-[11px] font-medium text-white/60"
          >Curated Wallpapers</span
        >
        <div class="grid grid-cols-3 gap-1.5">
          <button
            v-for="wp in WALLPAPER_PRESETS"
            :key="wp.id"
            type="button"
            class="group relative flex h-14 flex-col justify-end overflow-hidden rounded-lg border p-1.5 text-left transition-all hover:scale-[1.02] cursor-pointer"
            :class="[
              props.settings.customWallpaper === wp.url &&
              props.settings.showCustomWallpaper
                ? 'ring-2'
                : 'border-white/10 hover:border-white/30',
            ]"
            :style="{
              backgroundImage: `url(${wp.url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderColor: props.settings.customWallpaper === wp.url && props.settings.showCustomWallpaper ? props.settings.accentColor : undefined,
              '--tw-ring-color': `${props.settings.accentColor}66`,
            }"
            @click="
              emit('update', {
                customWallpaper: wp.url,
                showCustomWallpaper: true,
              })
            "
          >
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
            />
            <span
              class="relative z-10 text-[9px] font-semibold text-white drop-shadow truncate w-full"
            >
              {{ wp.name }}
            </span>
            <span
              v-if="
                props.settings.customWallpaper === wp.url &&
                props.settings.showCustomWallpaper
              "
              class="absolute top-1 right-1 z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-bold shadow"
              :style="{
                backgroundColor: props.settings.accentColor,
                color: isColorBright(props.settings.accentColor) ? '#0f172a' : '#ffffff',
              }"
            >
              ✓
            </span>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 pt-1">
        <div>
          <div class="flex justify-between">
            <span>Blur</span>
            <span>{{ props.settings.wallpaperBlur }}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="24"
            :value="props.settings.wallpaperBlur"
            class="mt-1 w-full cursor-pointer"
            :style="{ accentColor: props.settings.accentColor }"
            @input="
              emit('update', {
                wallpaperBlur: Number(
                  ($event.target as HTMLInputElement).value,
                ),
              })
            "
          />
        </div>
        <div>
          <div class="flex justify-between">
            <span>Dim</span>
            <span>{{ props.settings.wallpaperDim }}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="90"
            :value="props.settings.wallpaperDim"
            class="mt-1 w-full cursor-pointer"
            :style="{ accentColor: props.settings.accentColor }"
            @input="
              emit('update', {
                wallpaperDim: Number(($event.target as HTMLInputElement).value),
              })
            "
          />
        </div>
      </div>
    </div>

    <!-- Background Music & Ambient Sound (MP3, WAV, OGG) -->
    <div class="space-y-3 border-t border-white/10 pt-3">
      <div class="flex items-center justify-between">
        <span class="font-medium text-white/70">Background Music / Audio</span>
        <span class="text-[10px] text-white/40">MP3, WAV, OGG</span>
      </div>

      <!-- Active Local Audio Badge -->
      <div
        v-if="
          props.settings.backgroundAudio === 'local:audio' && localAudioInfo
        "
        class="flex items-center justify-between rounded-lg border px-3 py-2 text-xs"
        :style="{
          borderColor: `${props.settings.accentColor}30`,
          backgroundColor: `${props.settings.accentColor}12`,
        }"
      >
        <div class="flex items-center gap-2 truncate">
          <Music class="h-3.5 w-3.5 shrink-0" :style="{ color: props.settings.accentColor }" />
          <div class="truncate">
            <span class="font-medium text-white/90 truncate block">
              {{ localAudioInfo.name }}
            </span>
            <span class="text-[10px]" :style="{ color: props.settings.accentColor }">
              Local DB • {{ formatBytes(localAudioInfo.size) }} (Stutter-free playback)
            </span>
          </div>
        </div>
        <button
          type="button"
          class="rounded p-1 text-white/40 hover:bg-rose-500/20 hover:text-rose-300"
          title="Remove audio track"
          @click="removeAudio"
        >
          <Trash2 class="h-3.5 w-3.5" />
        </button>
      </div>

      <!-- Audio URL / File Picker -->
      <div class="flex items-center gap-2">
        <input
          type="text"
          placeholder="Paste Audio MP3 URL (syncs to account)..."
          :value="
            props.settings.backgroundAudio === 'local:audio'
              ? ''
              : props.settings.backgroundAudio
          "
          class="flex-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 outline-none placeholder-white/30 text-xs"
          @input="
            emit('update', {
              backgroundAudio: ($event.target as HTMLInputElement).value,
              backgroundAudioName: ($event.target as HTMLInputElement).value
                ? 'Web Audio Track'
                : '',
            })
          "
        />
        <label
          class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 hover:bg-white/20 transition-colors"
          title="Upload MP3, WAV, or OGG file (stored locally)"
        >
          <Upload class="h-3.5 w-3.5 text-white" />
          <span class="text-[11px] font-medium text-white hidden sm:inline"
            >Upload</span
          >
          <input
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.m4a"
            class="hidden"
            @change="onAudioUpload"
          />
        </label>
        <button
          v-if="
            props.settings.backgroundAudio &&
            props.settings.backgroundAudio !== 'local:audio'
          "
          type="button"
          class="rounded-lg border border-white/10 bg-rose-500/20 p-2 text-rose-300 hover:bg-rose-500/40"
          title="Clear audio URL"
          @click="removeAudio"
        >
          <Trash2 class="h-3.5 w-3.5" />
        </button>
      </div>

      <!-- Audio Options (Autoplay, Loop, Volume) -->
      <div v-if="props.settings.backgroundAudio" class="space-y-2.5 pt-1">
        <div class="flex items-center justify-between">
          <span>Autoplay on new tab</span>
          <input
            type="checkbox"
            :checked="props.settings.backgroundAudioAutoplay"
            class="h-4 w-4 cursor-pointer rounded"
            :style="{ accentColor: props.settings.accentColor }"
            @change="
              emit('update', {
                backgroundAudioAutoplay: ($event.target as HTMLInputElement)
                  .checked,
              })
            "
          />
        </div>
        <div class="flex items-center justify-between">
          <span>Loop audio track</span>
          <input
            type="checkbox"
            :checked="props.settings.backgroundAudioLoop"
            class="h-4 w-4 cursor-pointer rounded"
            :style="{ accentColor: props.settings.accentColor }"
            @change="
              emit('update', {
                backgroundAudioLoop: ($event.target as HTMLInputElement)
                  .checked,
              })
            "
          />
        </div>
        <div>
          <div class="flex justify-between">
            <span>Audio Volume</span>
            <span>{{ props.settings.backgroundAudioVolume }}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            :value="props.settings.backgroundAudioVolume"
            class="mt-1 w-full cursor-pointer"
            :style="{ accentColor: props.settings.accentColor }"
            @input="
              emit('update', {
                backgroundAudioVolume: Number(
                  ($event.target as HTMLInputElement).value,
                ),
              })
            "
          />
        </div>
      </div>
    </div>

    <!-- Reset Theme to Default -->
    <div class="border-t border-white/10 pt-4">
      <button
        type="button"
        class="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-medium text-white/80 transition-all duration-200 hover:border-white/30 hover:bg-white/10 hover:text-white active:scale-98 cursor-pointer"
        title="Reset all colors, presets, and theme appearance to default"
        @click="emit('reset')"
      >
        <RotateCcw class="h-3.5 w-3.5" />
        <span>Reset Theme to Default</span>
      </button>
    </div>
  </div>
</template>

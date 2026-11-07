<!--
  SortModeBar component providing secondary pill switcher for ordering active tiles
  and an expandable quick Grid & Style Designer (2D Minecraft, Retro Pixel, margins, paddings, columns).
-->
<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import {
  ArrowDownAZ,
  Flame,
  LayoutGrid,
  SlidersHorizontal,
  Box,
  Gamepad2,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-vue-next";
import type { SortMode } from "../../../1-domain/entities/BrowserItem";
import type {
  AppSettings,
  TileStyle,
} from "../../../1-domain/entities/AppSettings";
import {
  isColorBright,
  parseHexOrRgb,
} from "../../../2-application/services/colorUtils";

interface Props {
  modelValue: SortMode;
  accentColor?: string;
  gridCols?: number;
  settings?: AppSettings;
}

const props = withDefaults(defineProps<Props>(), {
  accentColor: "#10b981",
  gridCols: 6,
});

const emit = defineEmits<{
  (e: "update:modelValue", mode: SortMode): void;
  (e: "updateSettings", partial: Partial<AppSettings>): void;
}>();

const MODES: Array<{ id: SortMode; label: string; icon: unknown }> = [
  { id: "default", label: "Default", icon: LayoutGrid },
  { id: "name", label: "Name", icon: ArrowDownAZ },
  { id: "mostUsed", label: "Most used", icon: Flame },
];

const TILE_STYLES: Array<{
  id: TileStyle;
  label: string;
  icon: unknown;
  desc: string;
}> = [
  {
    id: "minecraft-2d",
    label: "2D Minecraft",
    icon: Box,
    desc: "Sharp pixel block with inventory slot bevels",
  },
  {
    id: "retro-pixel",
    label: "Retro Pixel",
    icon: Gamepad2,
    desc: "8-bit arcade borders with drop shadow",
  },
  {
    id: "glassmorphic",
    label: "Glassmorphic",
    icon: Sparkles,
    desc: "Smooth frosted glass with soft glow",
  },
  {
    id: "minimal-flat",
    label: "Minimal Flat",
    icon: LayoutGrid,
    desc: "Clean borderless modern tiles",
  },
];

const COLUMN_PRESETS = [2, 3, 4, 5, 6, 8, 10];

const isDesignerOpen = ref(false);

const activeAccent = computed(() => props.accentColor || "#10b981");
const activeTextColor = computed(() =>
  isColorBright(activeAccent.value) ? "#0f172a" : "#ffffff",
);
const accentGlow = computed(() => {
  const rgb = parseHexOrRgb(activeAccent.value);
  if (!rgb) return "rgba(16, 185, 129, 0.40)";
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.38)`;
});

const containerRef = ref<HTMLElement | null>(null);
const modeRefs = ref<Record<string, HTMLElement | null>>({});
const pillLeft = ref(0);
const pillTop = ref(0);
const pillWidth = ref(0);
const pillHeight = ref(0);
const pillReady = ref(false);

function setModeRef(id: SortMode, el: any) {
  if (el) {
    modeRefs.value[id] = el as HTMLElement;
    if (id === props.modelValue) {
      nextTick(() => {
        updatePillPosition();
      });
    }
  }
}

function updatePillPosition() {
  const activeEl = modeRefs.value[props.modelValue];
  const contEl = containerRef.value;
  if (!activeEl || !contEl) return;

  const left = activeEl.offsetLeft;
  const top = activeEl.offsetTop;
  const width = activeEl.offsetWidth;
  const height = activeEl.offsetHeight;

  if (width === 0) {
    requestAnimationFrame(updatePillPosition);
    return;
  }

  pillLeft.value = left;
  pillTop.value = top;
  pillWidth.value = width;
  pillHeight.value = height;
  pillReady.value = true;
}

function handleModeClick(mode: SortMode) {
  emit("update:modelValue", mode);
  nextTick(() => {
    updatePillPosition();
  });
}

watch(
  () => [props.modelValue, props.accentColor],
  async () => {
    await nextTick();
    requestAnimationFrame(updatePillPosition);
  },
);

onMounted(() => {
  window.addEventListener("resize", updatePillPosition);
  nextTick(() => {
    updatePillPosition();
  });
});

onUnmounted(() => {
  window.removeEventListener("resize", updatePillPosition);
});

const containerMaxWidth = computed(() => {
  if (props.gridCols <= 3) return "max-w-3xl";
  if (props.gridCols === 4) return "max-w-4xl";
  if (props.gridCols === 5) return "max-w-5xl";
  if (props.gridCols === 6) return "max-w-6xl";
  return "max-w-7xl";
});
</script>

<template>
  <div
    class="relative z-20 mx-auto flex w-full flex-col items-end px-6 pb-3 transition-all duration-300"
    :class="containerMaxWidth"
  >
    <!-- Top Action Bar: Sort Pills + Quick Grid Designer Toggle -->
    <div class="flex items-center gap-2">
      <!-- Sort Modes Group -->
      <div
        ref="containerRef"
        class="relative flex items-center gap-1 rounded-full border border-white/10 dark:border-white/10 light:border-black/10 bg-white/[0.05] dark:bg-white/[0.05] light:bg-black/[0.04] p-1 shadow-lg shadow-black/20 backdrop-blur-xl"
        role="group"
        aria-label="Tile sort modes"
      >
        <!-- Animated Sliding Mask Indicator -->
        <div
          class="pointer-events-none absolute top-0 left-0 rounded-full will-change-[transform,width,height,opacity]"
          :style="{
            transform: `translate3d(${pillLeft}px, ${pillTop}px, 0)`,
            width: `${pillWidth}px`,
            height: `${pillHeight}px`,
            transition: pillReady
              ? 'transform 460ms cubic-bezier(0.16, 1, 0.3, 1), width 460ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease'
              : 'opacity 200ms ease',
            opacity: pillReady ? 1 : 0,
            backgroundColor: activeAccent,
            boxShadow: `0 2px 10px 0 ${accentGlow}`,
          }"
        />

        <button
          v-for="item in MODES"
          :key="item.id"
          :ref="(el) => setModeRef(item.id, el)"
          type="button"
          class="relative z-10 flex h-6.5 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-medium leading-none transition-colors duration-200 select-none cursor-pointer bg-transparent"
          :class="[
            props.modelValue === item.id
              ? 'shadow-none'
              : 'text-white/60 hover:text-white dark:text-white/60 dark:hover:text-white light:text-slate-600 light:hover:text-slate-900',
          ]"
          :style="{
            color: props.modelValue === item.id ? activeTextColor : undefined,
          }"
          @click="handleModeClick(item.id)"
        >
          <component :is="item.icon" class="h-3 w-3 shrink-0" />
          <span class="inline-flex items-center leading-none">{{
            item.label
          }}</span>
        </button>
      </div>

      <!-- Quick Grid & 2D Minecraft Designer Toggle Button -->
      <button
        v-if="props.settings"
        type="button"
        class="flex h-8.5 items-center gap-1.5 rounded-full border px-3 text-xs font-medium shadow-lg shadow-black/15 backdrop-blur-xl transition-all duration-200 cursor-pointer select-none"
        :class="[
          isDesignerOpen
            ? 'shadow-md ring-1'
            : 'border-white/10 dark:border-white/10 light:border-black/10 bg-white/[0.05] dark:bg-white/[0.05] light:bg-black/[0.04] text-white/70 hover:bg-white/[0.1] hover:text-white dark:text-white/70 dark:hover:text-white light:text-slate-700 light:hover:text-slate-900',
        ]"
        :style="isDesignerOpen ? {
          borderColor: activeAccent,
          backgroundColor: `${activeAccent}25`,
          color: activeAccent,
          '--tw-ring-color': `${activeAccent}50`,
        } : undefined"
        title="Customize grid layout, margins, paddings, and 2D Minecraft style"
        @click="isDesignerOpen = !isDesignerOpen"
      >
        <SlidersHorizontal class="h-3.5 w-3.5" :style="{ color: isDesignerOpen ? activeAccent : undefined }" />
        <span class="hidden sm:inline">Customize Grid</span>
        <span class="sm:hidden">Grid</span>
        <ChevronUp v-if="isDesignerOpen" class="h-3 w-3 opacity-60" />
        <ChevronDown v-else class="h-3 w-3 opacity-60" />
      </button>
    </div>

    <!-- Expandable In-Place Grid Designer Panel -->
    <Transition name="drawer-backdrop">
      <div
        v-if="isDesignerOpen && props.settings"
        class="mt-2.5 w-full rounded-2xl border border-white/15 dark:border-white/15 light:border-black/10 bg-[#0e0720]/95 dark:bg-[#0e0720]/95 light:bg-white/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-2xl text-white dark:text-white light:text-slate-900 select-none animate-in fade-in zoom-in-95 duration-200"
      >
        <div class="flex items-center justify-between pb-3 border-b border-white/10 dark:border-white/10 light:border-black/10">
          <div class="flex items-center gap-2">
            <Box class="h-4 w-4" :style="{ color: activeAccent }" />
            <span class="text-xs font-semibold tracking-wide uppercase">
              Grid & Tile Designer
            </span>
            <span
              class="rounded-full px-2 py-0.5 text-[10px] font-mono"
              :style="{ backgroundColor: `${activeAccent}20`, color: activeAccent }"
            >
              Live Preview
            </span>
          </div>
          <button
            type="button"
            class="text-[11px] text-white/50 dark:text-white/50 light:text-slate-500 hover:text-white dark:hover:text-white light:hover:text-slate-900 cursor-pointer"
            @click="isDesignerOpen = false"
          >
            ✕ Close
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3.5">
          <!-- Left Column: Tile Styles -->
          <div class="space-y-2">
            <span class="block text-xs font-medium text-white/80 dark:text-white/80 light:text-slate-700">
              Tile Design Style
            </span>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="ts in TILE_STYLES"
                :key="ts.id"
                type="button"
                class="flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition-all duration-200 cursor-pointer"
                :class="[
                  props.settings.tileStyle === ts.id
                    ? 'shadow-md ring-1'
                    : 'border-white/10 dark:border-white/10 light:border-black/10 bg-white/[0.04] dark:bg-white/[0.04] light:bg-black/[0.03] hover:border-white/20 hover:bg-white/[0.08]',
                ]"
                :style="props.settings.tileStyle === ts.id ? {
                  borderColor: activeAccent,
                  backgroundColor: `${activeAccent}20`,
                  '--tw-ring-color': `${activeAccent}50`,
                } : undefined"
                @click="emit('updateSettings', { tileStyle: ts.id })"
              >
                <div class="flex items-center gap-1.5 w-full">
                  <component
                    :is="ts.icon"
                    class="h-3.5 w-3.5 shrink-0"
                    :style="{ color: props.settings.tileStyle === ts.id ? activeAccent : undefined }"
                  />
                  <span class="text-xs font-semibold truncate">{{ ts.label }}</span>
                </div>
                <span class="text-[9px] text-white/50 dark:text-white/50 light:text-slate-500 leading-tight">
                  {{ ts.desc }}
                </span>
              </button>
            </div>

            <!-- Quick Columns Picker -->
            <div class="pt-2">
              <div class="flex items-center justify-between text-xs">
                <span class="text-white/80 dark:text-white/80 light:text-slate-700 font-medium">Grid Columns</span>
                <span class="font-mono font-semibold" :style="{ color: activeAccent }">{{ props.settings.gridCols }} Columns</span>
              </div>
              <div class="flex flex-wrap gap-1.5 pt-1.5">
                <button
                  v-for="cols in COLUMN_PRESETS"
                  :key="cols"
                  type="button"
                  class="flex-1 min-w-[36px] rounded-lg border py-1 text-center text-xs font-mono font-medium transition-all cursor-pointer"
                  :class="[
                    props.settings.gridCols === cols
                      ? 'shadow-sm font-bold'
                      : 'border-white/10 dark:border-white/10 light:border-black/10 bg-white/[0.04] dark:bg-white/[0.04] light:bg-black/[0.03] hover:bg-white/[0.1] text-white/70 dark:text-white/70 light:text-slate-700',
                  ]"
                  :style="props.settings.gridCols === cols ? {
                    borderColor: activeAccent,
                    backgroundColor: activeAccent,
                    color: activeTextColor,
                  } : undefined"
                  @click="emit('updateSettings', { gridCols: cols })"
                >
                  {{ cols }}
                </button>
              </div>
            </div>
          </div>

          <!-- Right Column: Margins, Paddings, Height & Gap Sliders -->
          <div class="space-y-3">
            <!-- Tile Spacing / Gap (Margin) -->
            <div>
              <div class="flex justify-between text-xs font-medium">
                <span class="text-white/80 dark:text-white/80 light:text-slate-700">Tile Spacing (Margin / Gap)</span>
                <span class="font-mono" :style="{ color: activeAccent }">{{ props.settings.tileGap }}px</span>
              </div>
              <input
                type="range"
                min="4"
                max="48"
                :value="props.settings.tileGap"
                class="mt-1 w-full cursor-pointer"
                :style="{ accentColor: activeAccent }"
                @input="
                  emit('updateSettings', {
                    tileGap: Number(($event.target as HTMLInputElement).value),
                  })
                "
              />
            </div>

            <!-- Grid Outer Margin / Padding -->
            <div>
              <div class="flex justify-between text-xs font-medium">
                <span class="text-white/80 dark:text-white/80 light:text-slate-700">Grid Outer Margin / Padding</span>
                <span class="font-mono" :style="{ color: activeAccent }">{{ props.settings.gridPadding ?? 24 }}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="64"
                :value="props.settings.gridPadding ?? 24"
                class="mt-1 w-full cursor-pointer"
                :style="{ accentColor: activeAccent }"
                @input="
                  emit('updateSettings', {
                    gridPadding: Number(($event.target as HTMLInputElement).value),
                  })
                "
              />
            </div>

            <!-- Card Height -->
            <div>
              <div class="flex justify-between text-xs font-medium">
                <span class="text-white/80 dark:text-white/80 light:text-slate-700">Card Height</span>
                <span class="font-mono" :style="{ color: activeAccent }">{{ props.settings.cardHeight }}px</span>
              </div>
              <input
                type="range"
                min="70"
                max="220"
                :value="props.settings.cardHeight"
                class="mt-1 w-full cursor-pointer"
                :style="{ accentColor: activeAccent }"
                @input="
                  emit('updateSettings', {
                    cardHeight: Number(($event.target as HTMLInputElement).value),
                  })
                "
              />
            </div>

            <!-- Tile Inner Padding -->
            <div>
              <div class="flex justify-between text-xs font-medium">
                <span class="text-white/80 dark:text-white/80 light:text-slate-700">Tile Inner Padding</span>
                <span class="font-mono" :style="{ color: activeAccent }">{{ props.settings.tilePadding ?? 16 }}px</span>
              </div>
              <input
                type="range"
                min="4"
                max="32"
                :value="props.settings.tilePadding ?? 16"
                class="mt-1 w-full cursor-pointer"
                :style="{ accentColor: activeAccent }"
                @input="
                  emit('updateSettings', {
                    tilePadding: Number(($event.target as HTMLInputElement).value),
                  })
                "
              />
            </div>

            <!-- Corner Radius (Disabled if Minecraft 2D or Retro Pixel) -->
            <div>
              <div class="flex justify-between text-xs font-medium">
                <span class="text-white/80 dark:text-white/80 light:text-slate-700">Corner Radius</span>
                <span class="font-mono" :style="{ color: activeAccent }">
                  {{ props.settings.tileStyle === 'minecraft-2d' || props.settings.tileStyle === 'retro-pixel' ? '0px (Strict 2D Block)' : `${props.settings.tileRadius}px` }}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="32"
                :disabled="props.settings.tileStyle === 'minecraft-2d' || props.settings.tileStyle === 'retro-pixel'"
                :value="props.settings.tileRadius"
                class="mt-1 w-full cursor-pointer disabled:opacity-40"
                :style="{ accentColor: activeAccent }"
                @input="
                  emit('updateSettings', {
                    tileRadius: Number(($event.target as HTMLInputElement).value),
                  })
                "
              />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

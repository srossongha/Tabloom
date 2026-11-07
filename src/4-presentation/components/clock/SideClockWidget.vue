<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { Sparkles } from "lucide-vue-next";
import type { ClockTheme } from "../../../1-domain/entities/AppSettings";
import SevenSegmentDisplay from "./SevenSegmentDisplay.vue";
import ClockTowerDisplay from "./ClockTowerDisplay.vue";

interface Props {
  clockTheme?: ClockTheme;
  use24h?: boolean;
  showYearProgress?: boolean;
  isLight?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  clockTheme: "digital-lcd",
  use24h: true,
  showYearProgress: true,
  isLight: false,
});

const emit = defineEmits<{
  (e: "toggleFormat"): void;
  (e: "updateTheme", theme: ClockTheme): void;
}>();

const now = ref(new Date());
let timer: number | undefined;

function updateClock() {
  now.value = new Date();
}

function handleVisibility() {
  if (typeof document === "undefined") return;
  if (document.hidden) {
    if (timer) {
      clearInterval(timer);
      timer = undefined;
    }
  } else {
    now.value = new Date();
    if (!timer) {
      timer = window.setInterval(updateClock, 1000);
    }
  }
}

onMounted(() => {
  timer = window.setInterval(updateClock, 1000);
  document.addEventListener("visibilitychange", handleVisibility, {
    passive: true,
  });
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  document.removeEventListener("visibilitychange", handleVisibility);
});

const hoursFormatted = computed(() => {
  const h = now.value.getHours();
  if (props.use24h) {
    return String(h).padStart(2, "0");
  }
  const h12 = h % 12 || 12;
  return String(h12);
});

const minutesFormatted = computed(() => {
  return String(now.value.getMinutes()).padStart(2, "0");
});

const secondsFormatted = computed(() => {
  return String(now.value.getSeconds()).padStart(2, "0");
});

const ampm = computed(() => {
  return now.value.getHours() >= 12 ? "PM" : "AM";
});

const dayOfWeek = computed(() => {
  return now.value.toLocaleDateString(undefined, { weekday: "long" });
});

const fullDate = computed(() => {
  return now.value.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
});

const dayOfYear = computed(() => {
  const start = new Date(now.value.getFullYear(), 0, 0);
  const diff = now.value.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
});

const totalDaysInYear = computed(() => {
  const year = now.value.getFullYear();
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
});

const yearProgress = computed(() => {
  return Math.min(
    100,
    Math.max(0, Math.round((dayOfYear.value / totalDaysInYear.value) * 100)),
  );
});

// Quick cycle theme directly on widget
const ALL_THEMES: ClockTheme[] = [
  "digital-lcd",
  "digital-clean",
  "clock-tower",
  "minimal",
];

const currentThemeLabel = computed(() => {
  switch (props.clockTheme) {
    case "digital-lcd":
      return "Digital LCD (Ghost Lines)";
    case "digital-clean":
      return "Digital Clean (Active Only)";
    case "clock-tower":
      return "Clock Tower (Roman Dial)";
    case "minimal":
      return "Minimal Modern";
    default:
      return "Clock";
  }
});

function cycleTheme(e: MouseEvent) {
  e.stopPropagation();
  const currentIndex = ALL_THEMES.indexOf(props.clockTheme);
  const nextTheme = ALL_THEMES[(currentIndex + 1) % ALL_THEMES.length];
  emit("updateTheme", nextTheme);
}
</script>

<template>
  <div
    class="gpu-card group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] dark:border-white/[0.08] light:border-black/[0.08] bg-white/[0.04] dark:bg-white/[0.04] light:bg-black/[0.03] p-4 shadow-lg shadow-black/20 backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:scale-[1.01] hover:border-white/20 hover:bg-white/[0.07] active:scale-[0.99]"
    title="Click to toggle 12h / 24h format. Click top badge to switch theme."
    @click="emit('toggleFormat')"
  >
    <!-- Top Bar: Theme Switcher Pill -->
    <div class="mb-2 flex items-center justify-between select-none">
      <button
        type="button"
        class="group/btn inline-flex items-center gap-1.5 rounded-full border border-current/10 bg-current/[0.05] px-2 py-0.5 text-[10px] font-medium text-current/70 transition-all hover:bg-current/10 hover:text-current active:scale-95"
        :title="`Current: ${currentThemeLabel}. Click to switch style.`"
        @click="cycleTheme"
      >
        <Sparkles class="h-2.5 w-2.5 text-[var(--accent)] transition-transform group-hover/btn:rotate-45" />
        <span class="max-w-[130px] truncate text-[9px] tracking-wide">{{ currentThemeLabel }}</span>
      </button>

      <span
        v-if="props.use24h && props.clockTheme === 'minimal'"
        class="rounded border border-current/10 bg-current/[0.03] px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-current/50 uppercase"
      >
        24H
      </span>
    </div>

    <!-- THEME 1: Digital LCD (with ghost inactive lines, matching user's photo) -->
    <SevenSegmentDisplay
      v-if="props.clockTheme === 'digital-lcd'"
      :hours="hoursFormatted"
      :minutes="minutesFormatted"
      :seconds="secondsFormatted"
      :show-inactive-segments="true"
      :use-24h="props.use24h"
      :ampm="ampm"
      :is-light="props.isLight"
    />

    <!-- THEME 2: Digital Clean (without inactive lines) -->
    <SevenSegmentDisplay
      v-else-if="props.clockTheme === 'digital-clean'"
      :hours="hoursFormatted"
      :minutes="minutesFormatted"
      :seconds="secondsFormatted"
      :show-inactive-segments="false"
      :use-24h="props.use24h"
      :ampm="ampm"
      :is-light="props.isLight"
    />

    <!-- THEME 3: Clock Tower (Architectural Vintage Dial) -->
    <ClockTowerDisplay
      v-else-if="props.clockTheme === 'clock-tower'"
      :date="now"
      :use-24h="props.use24h"
      :is-light="props.isLight"
    />

    <!-- THEME 4: Minimal Modern Digital (Original clean display) -->
    <div
      v-else
      class="flex items-baseline justify-between select-none py-1"
    >
      <div class="flex items-baseline tracking-tight font-mono">
        <span
          class="text-4xl font-light tracking-tighter xl:text-5xl text-current"
        >
          {{ hoursFormatted
          }}<span class="animate-pulse text-[var(--accent)] font-normal">:</span
          >{{ minutesFormatted }}
        </span>
        <span
          v-if="!props.use24h"
          class="ml-2 text-[11px] font-medium tracking-wider text-current/40 uppercase"
        >
          {{ ampm }}
        </span>
      </div>
    </div>

    <!-- Calm Date string -->
    <div
      class="mt-2.5 flex items-center justify-between text-xs text-current/60 select-none"
    >
      <span class="font-medium text-current/90">{{ dayOfWeek }}</span>
      <span class="text-current/50">{{ fullDate }}</span>
    </div>

    <!-- Minimal Year Progress Bar -->
    <div
      v-if="props.showYearProgress"
      class="mt-3 border-t border-current/10 pt-2.5 select-none"
    >
      <div class="flex items-center justify-between text-[11px] text-current/50">
        <span>Day {{ dayOfYear }} of {{ totalDaysInYear }}</span>
        <span class="font-mono text-[var(--accent)] font-medium"
          >{{ yearProgress }}%</span
        >
      </div>
      <div
        class="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-current/10"
      >
        <div
          class="h-full rounded-full transition-all duration-500"
          :style="{
            width: `${yearProgress}%`,
            backgroundColor: 'var(--accent, #10b981)',
          }"
        />
      </div>
    </div>
  </div>
</template>

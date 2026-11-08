<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { ArrowUp, ArrowDown, EyeOff } from "lucide-vue-next";
import type { ClockTheme } from "../../../1-domain/entities/AppSettings";
import SevenSegmentDisplay from "./SevenSegmentDisplay.vue";
import ClockTowerDisplay from "./ClockTowerDisplay.vue";

interface Props {
  clockTheme?: ClockTheme;
  use24h?: boolean;
  showYearProgress?: boolean;
  showDate?: boolean;
  timeOnly?: boolean;
  isLight?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  clockTheme: "digital-lcd",
  use24h: true,
  showYearProgress: true,
  showDate: true,
  timeOnly: false,
  isLight: false,
  canMoveUp: true,
  canMoveDown: true,
});

const emit = defineEmits<{
  (e: "toggleFormat"): void;
  (e: "updateTheme", theme: ClockTheme): void;
  (e: "moveUp"): void;
  (e: "moveDown"): void;
  (e: "hide"): void;
}>();

const now = ref(new Date());
let timer: number | undefined;

function updateClock() {
  now.value = new Date();
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = undefined;
  }
}

function startTimer() {
  now.value = new Date();
  if (!timer) {
    timer = window.setInterval(updateClock, 1000);
  }
}

function handleVisibility() {
  if (typeof document === "undefined") return;
  if (document.hidden) {
    stopTimer();
  } else {
    startTimer();
  }
}

onMounted(() => {
  startTimer();
  document.addEventListener("visibilitychange", handleVisibility, {
    passive: true,
  });
  window.addEventListener("blur", stopTimer, { passive: true });
  window.addEventListener("focus", startTimer, { passive: true });
});

onUnmounted(() => {
  stopTimer();
  document.removeEventListener("visibilitychange", handleVisibility);
  window.removeEventListener("blur", stopTimer);
  window.removeEventListener("focus", startTimer);
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

const isEffectiveTimeOnly = computed(
  () => props.timeOnly || (!props.showDate && !props.showYearProgress)
);
</script>

<template>
  <div
    class="gpu-card group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/[0.08] dark:border-white/[0.08] light:border-black/[0.08] bg-white/[0.04] dark:bg-white/[0.04] light:bg-black/[0.03] shadow-lg shadow-black/20 backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:scale-[1.01] hover:border-white/20 hover:bg-white/[0.07] active:scale-[0.99]"
    :class="[
      isEffectiveTimeOnly
        ? 'p-4 items-center justify-center'
        : 'p-4 justify-between'
    ]"
    title="Click to toggle 12h / 24h format."
    @click="emit('toggleFormat')"
  >
    <!-- Micro Hover Actions (completely hidden until hover, zero visual noise normally) -->
    <div
      class="absolute top-2 right-2 z-20 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      @click.stop
    >
      <button
        v-if="canMoveUp"
        type="button"
        title="Move clock up in dock"
        class="flex h-5 w-5 items-center justify-center rounded bg-black/50 text-white/70 hover:bg-black/75 hover:text-white transition-all active:scale-90 cursor-pointer"
        @click.stop="emit('moveUp')"
      >
        <ArrowUp class="h-3 w-3" />
      </button>
      <button
        v-if="canMoveDown"
        type="button"
        title="Move clock down in dock"
        class="flex h-5 w-5 items-center justify-center rounded bg-black/50 text-white/70 hover:bg-black/75 hover:text-white transition-all active:scale-90 cursor-pointer"
        @click.stop="emit('moveDown')"
      >
        <ArrowDown class="h-3 w-3" />
      </button>
      <button
        type="button"
        title="Hide clock widget (can re-enable in Settings)"
        class="flex h-5 w-5 items-center justify-center rounded bg-black/50 text-white/70 hover:bg-rose-500/80 hover:text-white transition-all active:scale-90 cursor-pointer"
        @click.stop="emit('hide')"
      >
        <EyeOff class="h-3 w-3" />
      </button>
    </div>

    <!-- THEME 1: Digital LCD (with ghost inactive lines) -->
    <SevenSegmentDisplay
      v-if="props.clockTheme === 'digital-lcd'"
      :hours="hoursFormatted"
      :minutes="minutesFormatted"
      :seconds="secondsFormatted"
      :show-inactive-segments="true"
      :use-24h="props.use24h"
      :ampm="ampm"
      :is-light="props.isLight"
      :time-only="isEffectiveTimeOnly"
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
      :time-only="isEffectiveTimeOnly"
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
      class="flex items-center justify-center select-none py-1 w-full"
    >
      <div class="flex items-baseline tracking-tight font-mono">
        <span
          class="text-4xl font-light tracking-tighter xl:text-5xl text-current"
        >
          {{ hoursFormatted
          }}<span
            class="font-normal transition-opacity duration-200"
            :class="now.getSeconds() % 2 === 0 ? 'opacity-100' : 'opacity-30'"
            :style="{ color: 'var(--accent)' }"
          >:</span
          >{{ minutesFormatted }}
        </span>
        <span
          v-if="!props.use24h && !isEffectiveTimeOnly"
          class="ml-2 text-[11px] font-medium tracking-wider text-current/40 uppercase"
        >
          {{ ampm }}
        </span>
      </div>
    </div>

    <!-- Calm Date string -->
    <div
      v-if="!isEffectiveTimeOnly && props.showDate"
      class="mt-2.5 flex items-center justify-between text-xs text-current/60 select-none w-full"
    >
      <span class="font-medium text-current/90">{{ dayOfWeek }}</span>
      <span class="text-current/50">{{ fullDate }}</span>
    </div>

    <!-- Minimal Year Progress Bar -->
    <div
      v-if="!isEffectiveTimeOnly && props.showYearProgress"
      class="mt-3 border-t border-current/10 pt-2.5 select-none w-full"
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

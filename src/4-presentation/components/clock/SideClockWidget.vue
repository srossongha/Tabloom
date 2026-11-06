<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";

interface Props {
  use24h?: boolean;
  showYearProgress?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  use24h: true,
  showYearProgress: true,
});

const emit = defineEmits<{
  (e: "toggleFormat"): void;
}>();

const now = ref(new Date());
let timer: number | undefined;

function updateClock() {
  const d = new Date();
  if (
    d.getMinutes() !== now.value.getMinutes() ||
    d.getHours() !== now.value.getHours()
  ) {
    now.value = d;
  }
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
      timer = window.setInterval(updateClock, 5000);
    }
  }
}

onMounted(() => {
  timer = window.setInterval(updateClock, 5000);
  document.addEventListener("visibilitychange", handleVisibility, { passive: true });
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
</script>

<template>
  <div
    class="gpu-card group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 shadow-lg shadow-black/20 backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:scale-[1.01] hover:border-white/20 hover:bg-white/[0.07] active:scale-[0.99]"
    title="Click to toggle 12h / 24h format"
    @click="emit('toggleFormat')"
  >
    <!-- Big Clean Time -->
    <div class="flex items-baseline justify-between select-none">
      <div class="flex items-baseline tracking-tight font-mono">
        <span
          class="text-4xl font-light text-white tracking-tighter xl:text-5xl"
        >
          {{ hoursFormatted
          }}<span class="animate-pulse text-[var(--accent)] font-normal">:</span
          >{{ minutesFormatted }}
        </span>
        <span
          v-if="!props.use24h"
          class="ml-2 text-[11px] font-medium tracking-wider text-white/40 uppercase"
        >
          {{ ampm }}
        </span>
      </div>

      <span
        v-if="props.use24h"
        class="rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-white/40 uppercase"
      >
        24H
      </span>
    </div>

    <!-- Calm Date string -->
    <div
      class="mt-2.5 flex items-center justify-between text-xs text-white/60 select-none"
    >
      <span class="font-medium text-white/80">{{ dayOfWeek }}</span>
      <span class="text-white/40">{{ fullDate }}</span>
    </div>

    <!-- Minimal Year Progress Bar -->
    <div v-if="props.showYearProgress" class="mt-3.5 border-t border-white/[0.06] pt-2.5 select-none">
      <div class="flex items-center justify-between text-[11px] text-white/40">
        <span>Day {{ dayOfYear }} of {{ totalDaysInYear }}</span>
        <span class="font-mono text-[var(--accent)] font-medium"
          >{{ yearProgress }}%</span
        >
      </div>
      <div
        class="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.08]"
      >
        <div
          class="h-full rounded-full transition-all duration-500"
          :style="{ width: `${yearProgress}%`, backgroundColor: 'var(--accent, #10b981)' }"
        />
      </div>
    </div>
  </div>
</template>

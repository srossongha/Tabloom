<script setup lang="ts">
import { computed } from "vue";

interface Props {
  hours: string;
  minutes: string;
  seconds: string;
  showInactiveSegments?: boolean;
  use24h?: boolean;
  ampm?: string;
  isLight?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showInactiveSegments: true,
  use24h: true,
  ampm: "AM",
  isLight: false,
});

// Standard 7-segment segment mapping for 0-9 (a, b, c, d, e, f, g)
const DIGIT_SEGMENTS: Record<string, number[]> = {
  "0": [1, 1, 1, 1, 1, 1, 0],
  "1": [0, 1, 1, 0, 0, 0, 0],
  "2": [1, 1, 0, 1, 1, 0, 1],
  "3": [1, 1, 1, 1, 0, 0, 1],
  "4": [0, 1, 1, 0, 0, 1, 1],
  "5": [1, 0, 1, 1, 0, 1, 1],
  "6": [1, 0, 1, 1, 1, 1, 1],
  "7": [1, 1, 1, 0, 0, 0, 0],
  "8": [1, 1, 1, 1, 1, 1, 1],
  "9": [1, 1, 1, 1, 0, 1, 1],
  " ": [0, 0, 0, 0, 0, 0, 0],
};

// SVG polygon points for the 7 segments inside viewBox="0 0 28 52"
// Geometric beveled segments with 45-degree angle cuts matching authentic LCD hardware
const SEGMENT_PATHS = {
  a: "3.8,2  24.2,2  20.6,6.2  7.4,6.2",
  b: "24.6,3.3  26.5,5.2  26.5,23.8  22.3,21.6  22.3,7.4",
  c: "22.3,30.4  26.5,28.2  26.5,46.8  24.6,48.7  22.3,44.6",
  d: "7.4,45.8  20.6,45.8  24.2,50  3.8,50",
  e: "5.7,30.4  5.7,44.6  3.4,48.7  1.5,46.8  1.5,28.2",
  f: "1.5,5.2  3.4,3.3  5.7,7.4  5.7,21.6  1.5,23.8",
  g: "3.5,26  6.5,23.9  21.5,23.9  24.5,26  21.5,28.1  6.5,28.1",
};

const segmentKeys = ["a", "b", "c", "d", "e", "f", "g"] as const;

function getSegmentState(char: string, index: number): boolean {
  const pattern = DIGIT_SEGMENTS[char] ?? DIGIT_SEGMENTS[" "];
  return pattern[index] === 1;
}

// Split hours, minutes, seconds into individual single character digits
const hDigits = computed(() => {
  const padded = props.hours.padStart(2, props.use24h ? "0" : " ");
  return [padded[0], padded[1]];
});

const mDigits = computed(() => {
  const padded = props.minutes.padStart(2, "0");
  return [padded[0], padded[1]];
});

const sDigits = computed(() => {
  const padded = props.seconds.padStart(2, "0");
  return [padded[0], padded[1]];
});
</script>

<template>
  <div class="relative w-full select-none py-1">
    <!-- LCD Bezel/Screen Container -->
    <div
      class="relative flex items-center justify-between rounded-xl px-2 py-2.5 transition-all duration-300"
      :class="[
        props.showInactiveSegments
          ? 'bg-black/[0.04] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06]'
          : 'bg-transparent',
      ]"
    >
      <svg
        viewBox="0 0 216 54"
        class="w-full h-auto drop-shadow-sm transition-colors duration-200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- HOUR DIGIT 1 (x: 2) -->
        <g transform="translate(2, 1)">
          <polygon
            v-for="(k, idx) in segmentKeys"
            :key="'h1-' + k"
            :points="SEGMENT_PATHS[k]"
            fill="currentColor"
            :class="[
              getSegmentState(hDigits[0], idx)
                ? 'opacity-100 text-current'
                : props.showInactiveSegments
                  ? 'opacity-[0.11] dark:opacity-[0.09] text-current'
                  : 'opacity-0',
            ]"
          />
        </g>

        <!-- HOUR DIGIT 2 (x: 34) -->
        <g transform="translate(34, 1)">
          <polygon
            v-for="(k, idx) in segmentKeys"
            :key="'h2-' + k"
            :points="SEGMENT_PATHS[k]"
            fill="currentColor"
            :class="[
              getSegmentState(hDigits[1], idx)
                ? 'opacity-100 text-current'
                : props.showInactiveSegments
                  ? 'opacity-[0.11] dark:opacity-[0.09] text-current'
                  : 'opacity-0',
            ]"
          />
        </g>

        <!-- COLON 1 (x: 66) -->
        <g transform="translate(66, 1)">
          <rect
            x="2"
            y="15.5"
            width="4.5"
            height="4.5"
            rx="0.6"
            fill="currentColor"
            class="opacity-95"
          />
          <rect
            x="2"
            y="32"
            width="4.5"
            height="4.5"
            rx="0.6"
            fill="currentColor"
            class="opacity-95"
          />
        </g>

        <!-- MINUTE DIGIT 1 (x: 77) -->
        <g transform="translate(77, 1)">
          <polygon
            v-for="(k, idx) in segmentKeys"
            :key="'m1-' + k"
            :points="SEGMENT_PATHS[k]"
            fill="currentColor"
            :class="[
              getSegmentState(mDigits[0], idx)
                ? 'opacity-100 text-current'
                : props.showInactiveSegments
                  ? 'opacity-[0.11] dark:opacity-[0.09] text-current'
                  : 'opacity-0',
            ]"
          />
        </g>

        <!-- MINUTE DIGIT 2 (x: 109) -->
        <g transform="translate(109, 1)">
          <polygon
            v-for="(k, idx) in segmentKeys"
            :key="'m2-' + k"
            :points="SEGMENT_PATHS[k]"
            fill="currentColor"
            :class="[
              getSegmentState(mDigits[1], idx)
                ? 'opacity-100 text-current'
                : props.showInactiveSegments
                  ? 'opacity-[0.11] dark:opacity-[0.09] text-current'
                  : 'opacity-0',
            ]"
          />
        </g>

        <!-- COLON 2 (x: 141) -->
        <g transform="translate(141, 1)">
          <rect
            x="2"
            y="15.5"
            width="4.5"
            height="4.5"
            rx="0.6"
            fill="currentColor"
            class="opacity-95"
          />
          <rect
            x="2"
            y="32"
            width="4.5"
            height="4.5"
            rx="0.6"
            fill="currentColor"
            class="opacity-95"
          />
        </g>

        <!-- SECOND DIGIT 1 (x: 152) -->
        <g transform="translate(152, 1)">
          <polygon
            v-for="(k, idx) in segmentKeys"
            :key="'s1-' + k"
            :points="SEGMENT_PATHS[k]"
            fill="currentColor"
            :class="[
              getSegmentState(sDigits[0], idx)
                ? 'opacity-100 text-current'
                : props.showInactiveSegments
                  ? 'opacity-[0.11] dark:opacity-[0.09] text-current'
                  : 'opacity-0',
            ]"
          />
        </g>

        <!-- SECOND DIGIT 2 (x: 184) -->
        <g transform="translate(184, 1)">
          <polygon
            v-for="(k, idx) in segmentKeys"
            :key="'s2-' + k"
            :points="SEGMENT_PATHS[k]"
            fill="currentColor"
            :class="[
              getSegmentState(sDigits[1], idx)
                ? 'opacity-100 text-current'
                : props.showInactiveSegments
                  ? 'opacity-[0.11] dark:opacity-[0.09] text-current'
                  : 'opacity-0',
            ]"
          />
        </g>
      </svg>
    </div>

    <!-- Mode Badge (24H or AM/PM) -->
    <div
      class="mt-1 flex items-center justify-between px-1 text-[10px] font-mono tracking-wider text-current/50 select-none uppercase"
    >
      <span
        class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-semibold tracking-wider transition-colors"
        :class="
          props.showInactiveSegments
            ? 'bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-current/70'
            : 'text-current/50'
        "
      >
        <span
          class="h-1.5 w-1.5 rounded-full"
          :style="{ backgroundColor: 'var(--accent, #10b981)' }"
        />
        {{ props.showInactiveSegments ? 'LCD SEGMENT' : 'LED CLEAN' }}
      </span>

      <span
        v-if="!props.use24h"
        class="font-semibold text-[var(--accent)] tracking-widest"
      >
        {{ props.ampm }}
      </span>
      <span
        v-else
        class="text-[9px] font-medium tracking-widest text-current/50"
      >
        24H
      </span>
    </div>
  </div>
</template>

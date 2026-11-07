<script setup lang="ts">
import { computed } from "vue";

interface Props {
  date: Date;
  use24h?: boolean;
  isLight?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  use24h: true,
  isLight: false,
});

// Hands rotation calculations (hardware-accelerated GPU transforms via SVG transform)
const hourAngle = computed(() => {
  const h = props.date.getHours() % 12;
  const m = props.date.getMinutes();
  const s = props.date.getSeconds();
  return (h + m / 60 + s / 3600) * 30;
});

const minuteAngle = computed(() => {
  const m = props.date.getMinutes();
  const s = props.date.getSeconds();
  return (m + s / 60) * 6;
});

const secondAngle = computed(() => {
  const s = props.date.getSeconds();
  return s * 6;
});

// Digital readout for precise reading
const digitalTime = computed(() => {
  const h = props.date.getHours();
  const m = String(props.date.getMinutes()).padStart(2, "0");
  const s = String(props.date.getSeconds()).padStart(2, "0");
  if (props.use24h) {
    return `${String(h).padStart(2, "0")}:${m}:${s}`;
  }
  const h12 = h % 12 || 12;
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h12}:${m}:${s} ${ampm}`;
});

// Roman numerals along circular perimeter radius = 66
const ROMAN_NUMERALS = [
  { label: "XII", angle: 0 },
  { label: "I", angle: 30 },
  { label: "II", angle: 60 },
  { label: "III", angle: 90 },
  { label: "IV", angle: 120 },
  { label: "V", angle: 150 },
  { label: "VI", angle: 180 },
  { label: "VII", angle: 210 },
  { label: "VIII", angle: 240 },
  { label: "IX", angle: 270 },
  { label: "X", angle: 300 },
  { label: "XI", angle: 330 },
].map((item) => {
  const rad = (item.angle * Math.PI) / 180;
  return {
    label: item.label,
    x: 100 + 66 * Math.sin(rad),
    y: 100 - 66 * Math.cos(rad),
  };
});

// 60 minute / second ticks
const TICKS = Array.from({ length: 60 }, (_, i) => {
  const rad = (i * 6 * Math.PI) / 180;
  const isMajor = i % 5 === 0;
  const r1 = isMajor ? 78 : 81;
  const r2 = 84;
  return {
    isMajor,
    x1: 100 + r1 * Math.sin(rad),
    y1: 100 - r1 * Math.cos(rad),
    x2: 100 + r2 * Math.sin(rad),
    y2: 100 - r2 * Math.cos(rad),
  };
});
</script>

<template>
  <div class="relative flex flex-col items-center justify-center select-none py-1">
    <!-- Clock Tower Dial Face -->
    <div class="relative w-44 h-44 xl:w-48 xl:h-48 drop-shadow-md">
      <svg
        viewBox="0 0 200 200"
        class="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <!-- Subtle radial dial glow -->
          <radialGradient id="towerDialGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="currentColor" stop-opacity="0.04" />
            <stop offset="70%" stop-color="currentColor" stop-opacity="0.02" />
            <stop offset="100%" stop-color="currentColor" stop-opacity="0.08" />
          </radialGradient>
        </defs>

        <!-- Outer Bezel Rings -->
        <circle
          cx="100"
          cy="100"
          r="94"
          fill="url(#towerDialGrad)"
          stroke="currentColor"
          stroke-width="2"
          class="opacity-30 dark:opacity-20"
        />
        <circle
          cx="100"
          cy="100"
          r="89"
          fill="none"
          stroke="var(--accent, #10b981)"
          stroke-width="1.2"
          stroke-dasharray="3 3"
          class="opacity-60"
        />
        <circle
          cx="100"
          cy="100"
          r="85"
          fill="none"
          stroke="currentColor"
          stroke-width="0.8"
          class="opacity-40"
        />

        <!-- Dial Perimeter Ticks -->
        <line
          v-for="(t, i) in TICKS"
          :key="'tick-' + i"
          :x1="t.x1"
          :y1="t.y1"
          :x2="t.x2"
          :y2="t.y2"
          :stroke="t.isMajor ? 'var(--accent, #10b981)' : 'currentColor'"
          :stroke-width="t.isMajor ? 2.2 : 0.8"
          :class="t.isMajor ? 'opacity-80' : 'opacity-25'"
          stroke-linecap="round"
        />

        <!-- Roman Numerals -->
        <text
          v-for="num in ROMAN_NUMERALS"
          :key="num.label"
          :x="num.x"
          :y="num.y"
          text-anchor="middle"
          dominant-baseline="central"
          font-family="Georgia, Cambria, 'Times New Roman', serif"
          font-weight="bold"
          font-size="9.5"
          fill="currentColor"
          class="opacity-90 tracking-widest select-none"
        >
          {{ num.label }}
        </text>

        <!-- Inner Tower Rosette & Inscription -->
        <circle
          cx="100"
          cy="100"
          r="45"
          fill="none"
          stroke="currentColor"
          stroke-width="0.8"
          class="opacity-20"
        />
        <circle
          cx="100"
          cy="100"
          r="42"
          fill="none"
          stroke="currentColor"
          stroke-width="0.5"
          stroke-dasharray="1 3"
          class="opacity-30"
        />
        <text
          x="100"
          y="126"
          text-anchor="middle"
          font-family="Georgia, Cambria, serif"
          font-size="6.5"
          font-weight="bold"
          letter-spacing="0.25em"
          fill="currentColor"
          class="opacity-40 uppercase"
        >
          CLOCK TOWER
        </text>

        <!-- Hour Hand (Vintage Spade Design) -->
        <g
          :style="{
            transform: `rotate(${hourAngle}deg)`,
            transformOrigin: '100px 100px',
            transition: 'transform 0.15s ease-out',
          }"
        >
          <!-- Counterweight tail -->
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="114"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            class="opacity-90"
          />
          <!-- Stem -->
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="66"
            stroke="currentColor"
            stroke-width="3.2"
            stroke-linecap="round"
          />
          <!-- Spade / Diamond Spear Head -->
          <polygon
            points="100,56 104.5,64 100,68 95.5,64"
            fill="currentColor"
          />
          <circle
            cx="100"
            cy="64"
            r="1.8"
            fill="none"
            stroke="currentColor"
            stroke-width="0.8"
            class="opacity-40"
          />
        </g>

        <!-- Minute Hand (Elongated Lance Design) -->
        <g
          :style="{
            transform: `rotate(${minuteAngle}deg)`,
            transformOrigin: '100px 100px',
            transition: 'transform 0.15s ease-out',
          }"
        >
          <!-- Counterweight tail -->
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="116"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            class="opacity-80"
          />
          <!-- Stem and needle -->
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="34"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
          <!-- Arrow pointer -->
          <polygon
            points="100,28 103,36 100,34 97,36"
            fill="currentColor"
          />
        </g>

        <!-- Second Hand (Ticking Needle with Counterweight Ring) -->
        <g
          :style="{
            transform: `rotate(${secondAngle}deg)`,
            transformOrigin: '100px 100px',
          }"
        >
          <!-- Needle -->
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="20"
            stroke="var(--accent, #10b981)"
            stroke-width="1.2"
            stroke-linecap="round"
          />
          <!-- Counterweight tail & ring -->
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="120"
            stroke="var(--accent, #10b981)"
            stroke-width="1.2"
          />
          <circle
            cx="100"
            cy="114"
            r="3"
            fill="none"
            stroke="var(--accent, #10b981)"
            stroke-width="1.2"
          />
        </g>

        <!-- Center Pinion Cap -->
        <circle
          cx="100"
          cy="100"
          r="4.5"
          fill="currentColor"
          class="opacity-95"
        />
        <circle
          cx="100"
          cy="100"
          r="2.2"
          fill="var(--accent, #10b981)"
        />
      </svg>
    </div>

    <!-- Digital Readout Pill below Dial -->
    <div class="mt-2 flex items-center justify-center">
      <span
        class="inline-flex items-center gap-1.5 rounded-full border border-current/10 bg-current/[0.04] px-2.5 py-0.5 font-mono text-[11px] font-semibold tracking-wider text-current/80 shadow-sm"
      >
        <span
          class="h-1.5 w-1.5 rounded-full shadow-sm"
          :style="{
            backgroundColor: 'var(--accent, #10b981)',
            boxShadow: '0 0 6px var(--accent, #10b981)',
          }"
        />
        {{ digitalTime }}
      </span>
    </div>
  </div>
</template>

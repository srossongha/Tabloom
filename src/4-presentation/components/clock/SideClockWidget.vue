<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  use24h?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  use24h: true,
})

const emit = defineEmits<{
  (e: 'toggleFormat'): void
}>()

const now = ref(new Date())
let timer: number | undefined

onMounted(() => {
  timer = window.setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const hoursFormatted = computed(() => {
  const h = now.value.getHours()
  if (props.use24h) {
    return String(h).padStart(2, '0')
  }
  const h12 = h % 12 || 12
  return String(h12).padStart(2, '0')
})

const minutesFormatted = computed(() => {
  return String(now.value.getMinutes()).padStart(2, '0')
})

const secondsFormatted = computed(() => {
  return String(now.value.getSeconds()).padStart(2, '0')
})

const ampm = computed(() => {
  return now.value.getHours() >= 12 ? 'PM' : 'AM'
})

const dayOfWeek = computed(() => {
  return now.value.toLocaleDateString(undefined, { weekday: 'long' })
})

const fullDate = computed(() => {
  return now.value.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
})

const dayOfYear = computed(() => {
  const start = new Date(now.value.getFullYear(), 0, 0)
  const diff = now.value.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  return Math.floor(diff / oneDay)
})

const totalDaysInYear = computed(() => {
  const year = now.value.getFullYear()
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365
})

const yearProgress = computed(() => {
  return Math.min(100, Math.max(0, Math.round((dayOfYear.value / totalDaysInYear.value) * 100)))
})

const weekNumber = computed(() => {
  const d = new Date(Date.UTC(now.value.getFullYear(), now.value.getMonth(), now.value.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
})
</script>

<template>
  <aside
    class="pointer-events-auto fixed top-24 left-6 z-20 hidden w-56 flex-col gap-3.5 select-none min-[1350px]:flex xl:w-60 2xl:left-10 2xl:w-64"
    aria-label="Side Clock and Ambient Stats"
  >
    <!-- Top Box: Time & Date Clock Card -->
    <div
      class="gpu-card group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-4.5 shadow-xl shadow-black/20 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/[0.09]"
      title="Click to toggle 12h / 24h format"
      @click="emit('toggleFormat')"
    >
      <div class="flex items-baseline justify-between">
        <!-- Big Clock Numbers -->
        <div class="flex items-baseline tracking-tight">
          <span class="text-4xl font-light text-white drop-shadow-sm xl:text-5xl font-mono">
            {{ hoursFormatted }}<span class="animate-pulse text-emerald-400/80">:</span>{{ minutesFormatted }}
          </span>
          <span class="ml-1.5 text-xs font-mono font-medium text-emerald-400">
            :{{ secondsFormatted }}
          </span>
        </div>

        <!-- 12h AM/PM or 24h pill -->
        <span
          v-if="!props.use24h"
          class="rounded-md border border-white/10 bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-white/80 uppercase"
        >
          {{ ampm }}
        </span>
        <span
          v-else
          class="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-white/40 uppercase"
        >
          24H
        </span>
      </div>

      <!-- Date string -->
      <div class="mt-2.5 flex flex-col">
        <span class="text-xs font-semibold text-white/90 tracking-wide">
          {{ dayOfWeek }}
        </span>
        <span class="text-[11px] text-white/50">
          {{ fullDate }}
        </span>
      </div>

      <!-- Subtle format switch hint on hover -->
      <div class="absolute right-2 bottom-1.5 text-[9px] text-white/30 opacity-0 transition-opacity group-hover:opacity-100">
        switch format
      </div>
    </div>

    <!-- Bottom Box: Ambient Year Progress & Day Numbers -->
    <div
      class="gpu-card flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-xl shadow-black/20 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/[0.09]"
    >
      <div class="flex items-center justify-between text-xs">
        <span class="font-medium text-white/70">Year Progress</span>
        <span class="font-mono font-semibold text-emerald-400">{{ yearProgress }}%</span>
      </div>

      <!-- Progress bar -->
      <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          class="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-500 transition-all duration-500"
          :style="{ width: `${yearProgress}%` }"
        />
      </div>

      <!-- Day and Week numbers -->
      <div class="mt-3 flex items-center justify-between text-[11px] text-white/50">
        <span>Day <strong class="font-semibold text-white/80">{{ dayOfYear }}</strong> / {{ totalDaysInYear }}</span>
        <span>Week <strong class="font-semibold text-white/80">{{ weekNumber }}</strong></span>
      </div>
    </div>
  </aside>
</template>

<style scoped>
aside {
  animation: clockFadeIn 300ms ease-out forwards;
}

@keyframes clockFadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

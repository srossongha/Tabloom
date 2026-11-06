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
</script>

<template>
  <div
    class="gpu-card group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-4.5 shadow-xl shadow-black/20 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/[0.09]"
    title="Click to toggle 12h / 24h format"
    @click="emit('toggleFormat')"
  >
    <!-- Time row -->
    <div class="flex items-baseline justify-between">
      <div class="flex items-baseline tracking-tight">
        <span class="text-4xl font-light text-white drop-shadow-sm xl:text-5xl font-mono">
          {{ hoursFormatted }}<span class="animate-pulse text-emerald-400/80">:</span>{{ minutesFormatted }}
        </span>
        <span class="ml-1.5 text-xs font-mono font-medium text-emerald-400">
          :{{ secondsFormatted }}
        </span>
      </div>

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

    <!-- Date row -->
    <div class="mt-2 flex flex-col">
      <span class="text-xs font-semibold text-white/90 tracking-wide">
        {{ dayOfWeek }}
      </span>
      <span class="text-[11px] text-white/50">
        {{ fullDate }}
      </span>
    </div>

    <!-- Compact Year Progress -->
    <div class="mt-3 border-t border-white/10 pt-2.5">
      <div class="flex items-center justify-between text-[11px] text-white/50">
        <span>Day <strong class="font-semibold text-white/80">{{ dayOfYear }}</strong> / {{ totalDaysInYear }}</span>
        <span class="font-mono font-semibold text-emerald-400">{{ yearProgress }}%</span>
      </div>
      <div class="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
        <div
          class="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-500 transition-all duration-500"
          :style="{ width: `${yearProgress}%` }"
        />
      </div>
    </div>

    <!-- Switch format hint on hover -->
    <div class="absolute right-2 bottom-1.5 text-[9px] text-white/25 opacity-0 transition-opacity group-hover:opacity-100">
      click to toggle format
    </div>
  </div>
</template>

<!--
  CalendarWidget: Elegant, low-overhead monthly calendar dock component.
  - Matches Tabloom glassmorphic aesthetics with responsive accent colors.
  - Interactive month navigation with quick return-to-today.
  - Zero idle CPU impact: recalculates on date changes and tab visibility only.
  - Includes in-dock reorder controls (move up / down) to change placement right on the dock.
-->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Minimize2,
  Maximize2,
} from 'lucide-vue-next'

interface Props {
  accentColor?: string
  isLight?: boolean
  isSmall?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  accentColor: '#10b981',
  isLight: false,
  isSmall: false,
})

const emit = defineEmits<{
  (e: 'toggleSmall'): void
}>()

// Current real-world date
const now = ref(new Date())
// Month being viewed (defaults to current month)
const viewDate = ref(new Date(now.value.getFullYear(), now.value.getMonth(), 1))
// Selected date for day preview
const selectedDate = ref(new Date())

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const currentMonthLabel = computed(() => {
  return `${MONTH_NAMES[viewDate.value.getMonth()]} ${viewDate.value.getFullYear()}`
})

const isViewingCurrentMonth = computed(() => {
  return (
    viewDate.value.getFullYear() === now.value.getFullYear() &&
    viewDate.value.getMonth() === now.value.getMonth()
  )
})

interface CalendarDay {
  key: string
  dayNumber: number
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
}

const calendarDays = computed<CalendarDay[]>(() => {
  const year = viewDate.value.getFullYear()
  const month = viewDate.value.getMonth()

  // First day of current month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDayWeekday = new Date(year, month, 1).getDay()
  // Total days in current month
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate()
  // Total days in previous month
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const days: CalendarDay[] = []

  // 1. Leading days from previous month
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i
    const d = new Date(year, month - 1, dayNum)
    days.push({
      key: `prev_${dayNum}`,
      dayNumber: dayNum,
      date: d,
      isCurrentMonth: false,
      isToday: isSameDay(d, now.value),
      isSelected: isSameDay(d, selectedDate.value),
    })
  }

  // 2. Days of current month
  for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
    const d = new Date(year, month, dayNum)
    days.push({
      key: `curr_${dayNum}`,
      dayNumber: dayNum,
      date: d,
      isCurrentMonth: true,
      isToday: isSameDay(d, now.value),
      isSelected: isSameDay(d, selectedDate.value),
    })
  }

  // 3. Trailing days from next month to fill grid (35 or 42 total cells)
  const totalCells = days.length <= 35 ? 35 : 42
  const remaining = totalCells - days.length
  for (let dayNum = 1; dayNum <= remaining; dayNum++) {
    const d = new Date(year, month + 1, dayNum)
    days.push({
      key: `next_${dayNum}`,
      dayNumber: dayNum,
      date: d,
      isCurrentMonth: false,
      isToday: isSameDay(d, now.value),
      isSelected: isSameDay(d, selectedDate.value),
    })
  }

  return days
})

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

function prevMonth() {
  viewDate.value = new Date(
    viewDate.value.getFullYear(),
    viewDate.value.getMonth() - 1,
    1
  )
}

function nextMonth() {
  viewDate.value = new Date(
    viewDate.value.getFullYear(),
    viewDate.value.getMonth() + 1,
    1
  )
}

function goToToday() {
  now.value = new Date()
  viewDate.value = new Date(now.value.getFullYear(), now.value.getMonth(), 1)
  selectedDate.value = new Date(now.value)
}

function selectDay(day: CalendarDay) {
  selectedDate.value = new Date(day.date)
  if (!day.isCurrentMonth) {
    viewDate.value = new Date(day.date.getFullYear(), day.date.getMonth(), 1)
  }
}

// Day of Year and Week Number calculations for status footer
const formattedSelectedDate = computed(() => {
  const d = selectedDate.value
  const dayName = d.toLocaleDateString(undefined, { weekday: 'short' })
  const monthName = d.toLocaleDateString(undefined, { month: 'short' })
  return `${dayName}, ${monthName} ${d.getDate()}`
})

const dayOfYear = computed(() => {
  const d = selectedDate.value
  const start = new Date(d.getFullYear(), 0, 0)
  const diff = d.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  return Math.floor(diff / oneDay)
})

// Midnight update timer to roll over day with 0% CPU at idle
let midnightTimeout: ReturnType<typeof setTimeout> | null = null

function scheduleMidnightUpdate() {
  if (midnightTimeout) clearTimeout(midnightTimeout)
  const current = new Date()
  const tomorrow = new Date(
    current.getFullYear(),
    current.getMonth(),
    current.getDate() + 1,
    0,
    0,
    5
  )
  const msUntilMidnight = tomorrow.getTime() - current.getTime()

  midnightTimeout = setTimeout(() => {
    now.value = new Date()
    scheduleMidnightUpdate()
  }, Math.max(1000, msUntilMidnight))
}

function onVisibilityChange() {
  if (!document.hidden) {
    now.value = new Date()
  }
}

onMounted(() => {
  scheduleMidnightUpdate()
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(() => {
  if (midnightTimeout) clearTimeout(midnightTimeout)
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>

<template>
  <!-- COMPACT MINI VIEW ("something small") -->
  <div
    v-if="props.isSmall"
    class="gpu-card group/mini relative flex cursor-pointer items-center justify-between rounded-xl border border-white/[0.08] dark:border-white/[0.08] light:border-black/[0.08] bg-white/[0.04] dark:bg-white/[0.04] light:bg-black/[0.03] px-3.5 py-2.5 shadow-md shadow-black/20 backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:scale-[1.01] hover:border-white/20 hover:bg-white/[0.08] active:scale-[0.99]"
    title="Click to expand calendar to full size"
    @click="emit('toggleSmall')"
  >
    <div class="flex items-center gap-2.5 min-w-0">
      <!-- Calendar Icon / Date Tear-off Badge -->
      <div
        class="flex h-7 w-7 shrink-0 flex-col items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5 shadow-sm"
        :style="{ borderColor: `${props.accentColor}40` }"
      >
        <span
          class="w-full text-center text-[7px] font-bold uppercase leading-none py-0.5 text-white"
          :style="{ backgroundColor: props.accentColor }"
        >
          {{ now.toLocaleDateString(undefined, { month: 'short' }) }}
        </span>
        <span class="flex-1 flex items-center justify-center text-[11px] font-bold text-white font-mono leading-none">
          {{ now.getDate() }}
        </span>
      </div>
      <div class="flex flex-col min-w-0">
        <span class="text-xs font-semibold text-white truncate">
          {{ now.toLocaleDateString(undefined, { weekday: 'short' }) }}, {{ now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }}
        </span>
        <span class="text-[9.5px] text-white/45 truncate">
          {{ currentMonthLabel }}
        </span>
      </div>
    </div>

    <!-- Expand hint icon button -->
    <button
      type="button"
      title="Expand calendar (full size)"
      class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white/40 transition-all hover:bg-white/10 hover:text-white"
      @click.stop="emit('toggleSmall')"
    >
      <Maximize2 class="h-3.5 w-3.5" />
    </button>
  </div>

  <!-- FULL DEFAULT VIEW -->
  <div
    v-else
    class="gpu-card group/cal relative flex w-full flex-col rounded-2xl border border-black/10 dark:border-white/10 bg-slate-900/40 dark:bg-black/40 p-3 shadow-lg shadow-black/20 backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-white/20 select-none overflow-hidden"
    :class="[
      isLight ? 'bg-white/80 border-slate-200/80 text-slate-900' : 'text-white',
    ]"
    aria-label="Calendar Widget"
  >
    <!-- Header: Month & Year Title with Navigation Arrows -->
    <div class="flex items-center justify-between pb-2 border-b border-white/10">
      <div class="flex items-center gap-1.5 min-w-0 pr-1">
        <CalendarIcon
          class="h-3.5 w-3.5 shrink-0 opacity-80"
          :style="{ color: props.accentColor }"
        />
        <span
          class="text-xs font-semibold tracking-wide truncate"
          :class="isLight ? 'text-slate-800' : 'text-white/90'"
        >
          {{ currentMonthLabel }}
        </span>
      </div>

      <div class="flex items-center gap-1 shrink-0">
        <!-- Return to Today Pill Button -->
        <button
          v-if="!isViewingCurrentMonth"
          type="button"
          title="Return to current month"
          class="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-medium transition-all hover:scale-105 active:scale-95 cursor-pointer"
          :style="{
            backgroundColor: `${props.accentColor}25`,
            color: props.accentColor,
          }"
          @click.stop="goToToday"
        >
          <RotateCcw class="h-2.5 w-2.5" />
          <span>Today</span>
        </button>

        <!-- Previous Month -->
        <button
          type="button"
          title="Previous month"
          class="flex h-5 w-5 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/70 transition-all hover:bg-white/15 hover:text-white active:scale-90 cursor-pointer"
          :class="isLight ? 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200' : ''"
          @click.stop="prevMonth"
        >
          <ChevronLeft class="h-3 w-3" />
        </button>

        <!-- Next Month -->
        <button
          type="button"
          title="Next month"
          class="flex h-5 w-5 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/70 transition-all hover:bg-white/15 hover:text-white active:scale-90 cursor-pointer"
          :class="isLight ? 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200' : ''"
          @click.stop="nextMonth"
        >
          <ChevronRight class="h-3 w-3" />
        </button>

        <!-- Make Small Button on hover -->
        <button
          type="button"
          title="Make small (compact view)"
          class="flex h-5 w-5 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/50 transition-all hover:bg-white/15 hover:text-white active:scale-90 cursor-pointer"
          @click.stop="emit('toggleSmall')"
        >
          <Minimize2 class="h-2.5 w-2.5" />
        </button>
      </div>
    </div>

    <!-- Weekday Column Headers -->
    <div class="grid grid-cols-7 pt-2 pb-1 text-center">
      <span
        v-for="wd in WEEKDAYS"
        :key="wd"
        class="text-[9.5px] font-semibold uppercase tracking-wider"
        :class="isLight ? 'text-slate-400' : 'text-white/40'"
      >
        {{ wd }}
      </span>
    </div>

    <!-- Days Grid -->
    <div class="grid grid-cols-7 gap-y-0.5 gap-x-0.5 text-center text-xs">
      <button
        v-for="day in calendarDays"
        :key="day.key"
        type="button"
        class="relative flex h-6 w-full items-center justify-center rounded-md text-[11px] font-medium transition-all duration-150 active:scale-90 cursor-pointer"
        :class="[
          day.isToday
            ? 'font-bold shadow-sm'
            : day.isSelected && !day.isToday
              ? 'ring-1 ring-white/40 font-semibold'
              : '',
          !day.isCurrentMonth
            ? isLight ? 'text-slate-300' : 'text-white/20'
            : isLight ? 'text-slate-700 hover:bg-slate-200/80' : 'text-white/80 hover:bg-white/15 hover:text-white',
        ]"
        :style="day.isToday ? {
          backgroundColor: props.accentColor,
          color: 'var(--accent-contrast, #0f172a)',
          boxShadow: `0 0 10px 0 ${props.accentColor}50`,
        } : (day.isSelected ? {
          borderColor: props.accentColor,
          backgroundColor: `${props.accentColor}15`,
        } : undefined)"
        @click="selectDay(day)"
      >
        <span>{{ day.dayNumber }}</span>
      </button>
    </div>

    <!-- Footer Date Pill Bar -->
    <div
      class="mt-2.5 flex items-center justify-between border-t border-white/10 pt-1.5 px-0.5 text-[10px]"
      :class="isLight ? 'text-slate-500' : 'text-white/50'"
    >
      <span class="font-medium" :style="{ color: isLight ? undefined : 'var(--accent)' }">
        {{ formattedSelectedDate }}
      </span>
      <span class="font-mono text-[9px] opacity-70">
        Day {{ dayOfYear }} of 365
      </span>
    </div>
  </div>
</template>

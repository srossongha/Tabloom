<!--
  SortModeBar component providing secondary pill switcher for ordering active tiles.
  Allows toggling between Default, Alphabetical Name, and Most Used frequency sorting
  with an animated sliding mask indicator.
-->
<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { ArrowDownAZ, Flame, LayoutGrid } from 'lucide-vue-next'
import type { SortMode } from '../../../1-domain/entities/BrowserItem'
import { isColorBright, parseHexOrRgb } from '../../../2-application/services/colorUtils'

interface Props {
  modelValue: SortMode
  accentColor?: string
  gridCols?: number
}

const props = withDefaults(defineProps<Props>(), {
  accentColor: '#10b981',
  gridCols: 6,
})

const emit = defineEmits<{
  (e: 'update:modelValue', mode: SortMode): void
}>()

const MODES: Array<{ id: SortMode; label: string; icon: unknown }> = [
  { id: 'default', label: 'Default', icon: LayoutGrid },
  { id: 'name', label: 'Name', icon: ArrowDownAZ },
  { id: 'mostUsed', label: 'Most used', icon: Flame },
]

const activeAccent = computed(() => props.accentColor || '#10b981')
const activeTextColor = computed(() => (isColorBright(activeAccent.value) ? '#0f172a' : '#ffffff'))
const accentGlow = computed(() => {
  const rgb = parseHexOrRgb(activeAccent.value)
  if (!rgb) return 'rgba(16, 185, 129, 0.40)'
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.38)`
})

const containerRef = ref<HTMLElement | null>(null)
const modeRefs = ref<Record<string, HTMLElement | null>>({})
const pillLeft = ref(0)
const pillTop = ref(0)
const pillWidth = ref(0)
const pillHeight = ref(0)
const pillReady = ref(false)

function setModeRef(id: SortMode, el: any) {
  if (el) {
    modeRefs.value[id] = el as HTMLElement
    if (id === props.modelValue) {
      nextTick(() => {
        updatePillPosition()
      })
    }
  }
}

function updatePillPosition() {
  const activeEl = modeRefs.value[props.modelValue]
  const contEl = containerRef.value
  if (!activeEl || !contEl) return

  const left = activeEl.offsetLeft
  const top = activeEl.offsetTop
  const width = activeEl.offsetWidth
  const height = activeEl.offsetHeight

  if (width === 0) {
    requestAnimationFrame(updatePillPosition)
    return
  }

  pillLeft.value = left
  pillTop.value = top
  pillWidth.value = width
  pillHeight.value = height
  pillReady.value = true
}

function handleModeClick(mode: SortMode) {
  emit('update:modelValue', mode)
  nextTick(() => {
    updatePillPosition()
  })
}

watch(
  () => [props.modelValue, props.accentColor],
  async () => {
    await nextTick()
    requestAnimationFrame(updatePillPosition)
  }
)

onMounted(() => {
  window.addEventListener('resize', updatePillPosition)
  nextTick(() => {
    updatePillPosition()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', updatePillPosition)
})

const containerMaxWidth = computed(() => {
  if (props.gridCols <= 3) return 'max-w-3xl'
  if (props.gridCols === 4) return 'max-w-4xl'
  if (props.gridCols === 5) return 'max-w-5xl'
  if (props.gridCols === 6) return 'max-w-6xl'
  return 'max-w-7xl'
})
</script>

<template>
  <div
    class="relative z-10 mx-auto flex w-full items-center justify-end px-6 pb-3 transition-all duration-300"
    :class="containerMaxWidth"
  >
    <div
      ref="containerRef"
      class="relative flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] p-1 shadow-lg shadow-black/20 backdrop-blur-xl"
      role="group"
      aria-label="Tile sort modes"
    >
      <!-- Animated Sliding Mask Indicator (Smooth deceleration, zero jitter) -->
      <div
        class="pointer-events-none absolute top-0 left-0 rounded-full will-change-[transform,width,height,opacity]"
        :style="{
          transform: `translate3d(${pillLeft}px, ${pillTop}px, 0)`,
          width: `${pillWidth}px`,
          height: `${pillHeight}px`,
          transition: pillReady
            ? 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1), width 260ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease'
            : 'opacity 180ms ease',
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
        class="relative z-10 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors duration-200 select-none cursor-pointer bg-transparent"
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
        <component :is="item.icon" class="h-3 w-3" />
        <span>{{ item.label }}</span>
      </button>
    </div>
  </div>
</template>

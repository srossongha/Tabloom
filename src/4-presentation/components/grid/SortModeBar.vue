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

const modeRefs = ref<Record<string, HTMLElement | null>>({})
const pillLeft = ref(0)
const pillWidth = ref(0)
const pillReady = ref(false)

function setModeRef(id: SortMode, el: any) {
  if (el) {
    modeRefs.value[id] = el as HTMLElement
    if (id === props.modelValue) {
      pillLeft.value = (el as HTMLElement).offsetLeft
      pillWidth.value = (el as HTMLElement).offsetWidth
      pillReady.value = true
    }
  }
}

function updatePillPosition() {
  const activeEl = modeRefs.value[props.modelValue]
  if (!activeEl) return
  pillLeft.value = activeEl.offsetLeft
  pillWidth.value = activeEl.offsetWidth
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
      class="relative flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] p-1 shadow-lg shadow-black/20 backdrop-blur-xl"
      role="group"
      aria-label="Tile sort modes"
    >
      <!-- Animated Sliding Mask Indicator -->
      <div
        class="pointer-events-none absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[transform,width,opacity]"
        :style="{
          transform: `translateX(${pillLeft}px)`,
          width: `${pillWidth}px`,
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
        class="relative z-10 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105 active:scale-95 select-none cursor-pointer"
        :class="[
          props.modelValue === item.id
            ? 'shadow-none'
            : 'text-white/60 hover:bg-white/10 hover:text-white',
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

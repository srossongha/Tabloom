<!--
  SortModeBar component providing secondary pill switcher for ordering active tiles.
  Allows toggling between Default, Alphabetical Name, and Most Used frequency sorting.
-->
<script setup lang="ts">
import { ArrowDownAZ, Flame, LayoutGrid } from 'lucide-vue-next'
import type { SortMode } from '../../../1-domain/entities/BrowserItem'

interface Props {
  modelValue: SortMode
}
const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', mode: SortMode): void
}>()

const MODES: Array<{ id: SortMode; label: string; icon: unknown }> = [
  { id: 'default', label: 'Default', icon: LayoutGrid },
  { id: 'name', label: 'Name', icon: ArrowDownAZ },
  { id: 'mostUsed', label: 'Most used', icon: Flame },
]
</script>

<template>
  <div class="relative z-10 flex w-full max-w-6xl items-center justify-end px-6 pb-4">
    <div
      class="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] p-1 shadow-lg shadow-black/20 backdrop-blur-xl"
      role="group"
      aria-label="Tile sort modes"
    >
      <button
        v-for="item in MODES"
        :key="item.id"
        type="button"
        class="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200"
        :class="[
          props.modelValue === item.id
            ? 'bg-[#10b981] text-white shadow-sm shadow-emerald-950/40'
            : 'text-white/60 hover:bg-white/10 hover:text-white',
        ]"
        @click="emit('update:modelValue', item.id)"
      >
        <component :is="item.icon" class="h-3 w-3" />
        <span>{{ item.label }}</span>
      </button>
    </div>
  </div>
</template>


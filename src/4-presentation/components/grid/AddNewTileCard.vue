<!--
  AddNewTileCard component displaying the dashed-border translucent add tile slot.
  Triggers the tile creation modal when clicked within the bookmarks view.
-->
<script setup lang="ts">
import { Plus } from 'lucide-vue-next'

interface Props {
  showLabels?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showLabels: true,
})

const emit = defineEmits<{
  (e: 'add'): void
}>()
</script>

<template>
  <div class="group flex flex-col items-center justify-start gap-2 select-none">
    <button
      type="button"
      aria-label="Add shortcut"
      class="gpu-card flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-4 shadow-sm shadow-black/10 backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:scale-[1.02] hover:border-emerald-400/50 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-black/20 active:scale-[0.98]"
      :style="{ height: 'var(--card-height, 120px)' }"
      @click="emit('add')"
    >
      <div
        class="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/40 transition-colors group-hover:border-emerald-400/30 group-hover:bg-emerald-500/10 group-hover:text-emerald-400"
      >
        <Plus class="h-5 w-5" />
      </div>
    </button>
    <!-- Matched label height to eliminate layout variance -->
    <div v-if="props.showLabels" class="flex h-5 w-full items-center justify-center px-1">
      <span class="w-full truncate text-center text-xs font-medium text-white/50 transition-colors group-hover:text-emerald-400">
        Add shortcut
      </span>
    </div>
  </div>
</template>

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
      class="gpu-card flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-white/[0.03] p-4 shadow-sm shadow-black/10 transition-all duration-200 ease-out hover:-translate-y-1 hover:border-emerald-400/60 hover:bg-white/[0.08] hover:shadow-lg hover:shadow-emerald-950/20"
      :style="{ height: 'var(--card-height, 120px)' }"
      @click="emit('add')"
    >
      <div
        class="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 transition-colors group-hover:border-emerald-400/40 group-hover:bg-emerald-500/10 group-hover:text-emerald-400"
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

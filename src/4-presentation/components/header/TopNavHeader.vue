<!--
  TopNavHeader component displaying the brand badge, view switcher pill, and settings trigger.
  Coordinates navigation between Bookmarks, Open Tabs, Most Visited, and Last Session views.
-->
<script setup lang="ts">
import { Settings, Bookmark, Layers, Sparkles, Clock } from 'lucide-vue-next'
import type { NavigationTab } from '../../../1-domain/entities/BrowserItem'

interface Props {
  appName: string
  activeView: NavigationTab
  showLogo?: boolean
  showNavTabs?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showLogo: true,
  showNavTabs: true,
})

const emit = defineEmits<{
  (e: 'selectView', view: NavigationTab): void
  (e: 'openSettings'): void
}>()

const TABS: Array<{ id: NavigationTab; label: string; icon: unknown }> = [
  { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
  { id: 'openTabs', label: 'Open tabs', icon: Layers },
  { id: 'mostVisited', label: 'Most visited', icon: Sparkles },
  { id: 'lastSession', label: 'Last session', icon: Clock },
]
</script>

<template>
  <header class="relative z-10 flex w-full items-center justify-between px-8 py-5 select-none">
    <!-- Brand Logo in top-left header if enabled -->
    <div v-if="props.showLogo" class="flex items-center gap-2.5">
      <img src="/icons/icon.svg" :alt="props.appName" class="h-7 w-7 object-contain drop-shadow" />
      <span class="text-sm font-semibold tracking-wide text-white/90">{{ props.appName }}</span>
    </div>
    <div v-else />

    <!-- Center/Right view switcher pill & settings button -->
    <div class="flex items-center gap-3">
      <nav
        v-if="props.showNavTabs"
        class="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] p-1.5 shadow-xl shadow-black/20 backdrop-blur-xl"
        role="tablist"
      >
        <button
          v-for="tab in TABS"
          :key="tab.id"
          role="tab"
          :aria-selected="props.activeView === tab.id"
          class="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95 cursor-pointer"
          :class="[
            props.activeView === tab.id
              ? 'bg-[#10b981] text-white shadow-md shadow-emerald-950/30'
              : 'text-white/70 hover:bg-white/10 hover:text-white',
          ]"
          @click="emit('selectView', tab.id)"
        >
          <component :is="tab.icon" class="h-3.5 w-3.5" />
          <span>{{ tab.label }}</span>
        </button>
      </nav>

      <!-- Settings gear button (always stays accessible so users can re-enable features) -->
      <button
        aria-label="Customize settings"
        title="Customize Tabloom"
        class="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/80 shadow-lg transition-all duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] hover:scale-110 hover:rotate-45 hover:bg-white/15 hover:text-white active:scale-90 cursor-pointer backdrop-blur-xl"
        @click="emit('openSettings')"
      >
        <Settings class="h-4 w-4" />
      </button>
    </div>
  </header>
</template>

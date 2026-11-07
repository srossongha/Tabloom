<!--
  TopNavHeader component displaying the brand badge, view switcher pill, and settings trigger.
  Coordinates navigation between Bookmarks, Open Tabs, Most Visited, and Last Session views
  with a fluid sliding mask animation and customizable active accent color.
-->
<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import {
  Settings,
  Bookmark,
  Layers,
  Sparkles,
  Clock,
  SlidersHorizontal,
} from "lucide-vue-next";
import type { NavigationTab } from "../../../1-domain/entities/BrowserItem";
import {
  isColorBright,
  parseHexOrRgb,
} from "../../../2-application/services/colorUtils";

interface Props {
  appName: string;
  activeView: NavigationTab;
  accentColor?: string;
  showLogo?: boolean;
  showNavTabs?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  accentColor: "#10b981",
  showLogo: true,
  showNavTabs: true,
});

const emit = defineEmits<{
  (e: "selectView", view: NavigationTab): void;
  (e: "openSettings"): void;
}>();

const isNavExpanded = ref(false);

function toggleNav() {
  isNavExpanded.value = !isNavExpanded.value;
}

const TABS: Array<{ id: NavigationTab; label: string; icon: unknown }> = [
  { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
  { id: "openTabs", label: "Open tabs", icon: Layers },
  { id: "mostVisited", label: "Most visited", icon: Sparkles },
  { id: "lastSession", label: "Last session", icon: Clock },
];

const activeAccent = computed(() => props.accentColor || "#10b981");

const activeTextColor = computed(() => {
  return isColorBright(activeAccent.value) ? "#0f172a" : "#ffffff";
});

const accentGlow = computed(() => {
  const rgb = parseHexOrRgb(activeAccent.value);
  if (!rgb) return "rgba(16, 185, 129, 0.40)";
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.38)`;
});

const tabRefs = ref<Record<string, HTMLElement | null>>({});
const pillLeft = ref(0);
const pillWidth = ref(0);
const pillReady = ref(false);

function setTabRef(id: NavigationTab, el: any) {
  if (el) {
    tabRefs.value[id] = el as HTMLElement;
    if (id === props.activeView) {
      pillLeft.value = (el as HTMLElement).offsetLeft;
      pillWidth.value = (el as HTMLElement).offsetWidth;
      pillReady.value = true;
    }
  }
}

function updatePillPosition() {
  const activeEl = tabRefs.value[props.activeView];
  if (!activeEl) return;
  pillLeft.value = activeEl.offsetLeft;
  pillWidth.value = activeEl.offsetWidth;
  pillReady.value = true;
}

function handleTabClick(view: NavigationTab) {
  emit("selectView", view);
  nextTick(() => {
    updatePillPosition();
  });
}

watch(
  () => [props.activeView, isNavExpanded.value, props.accentColor],
  async () => {
    if (!isNavExpanded.value) return;
    await nextTick();
    requestAnimationFrame(updatePillPosition);
  },
  { deep: true },
);

onMounted(() => {
  window.addEventListener("resize", updatePillPosition);
});

onUnmounted(() => {
  window.removeEventListener("resize", updatePillPosition);
});
</script>

<template>
  <header
    class="relative z-10 flex w-full items-center justify-between px-8 py-5 select-none"
  >
    <!-- Brand Logo in top-left header if enabled -->
    <div v-if="props.showLogo" class="flex items-center gap-2.5">
      <img
        src="/icons/icon.svg"
        :alt="props.appName"
        class="h-7 w-7 object-contain drop-shadow"
      />
      <span class="text-sm font-semibold tracking-wide text-white/90">{{
        props.appName
      }}</span>
    </div>
    <div v-else />

    <!-- Center/Right view switcher pill & action buttons -->
    <div class="flex items-center gap-2.5">
      <!-- Collapsible Navigation Tabs Pill with Fluid Expand Transition -->
      <Transition name="nav-expand" @after-enter="updatePillPosition">
        <nav
          v-if="props.showNavTabs && isNavExpanded"
          class="relative flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] p-1.5 shadow-xl shadow-black/20 backdrop-blur-xl"
          role="tablist"
        >
          <!-- Animated Sliding Mask Indicator (moves between tabs like a physical sliding pill) -->
          <div
            class="pointer-events-none absolute top-1.5 bottom-1.5 rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[transform,width,opacity]"
            :style="{
              transform: `translateX(${pillLeft}px)`,
              width: `${pillWidth}px`,
              opacity: pillReady ? 1 : 0,
              backgroundColor: activeAccent,
              boxShadow: `0 4px 14px 0 ${accentGlow}`,
            }"
          />

          <button
            v-for="tab in TABS"
            :key="tab.id"
            :ref="(el) => setTabRef(tab.id, el)"
            role="tab"
            :aria-selected="props.activeView === tab.id"
            class="relative z-10 flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 active:scale-95 cursor-pointer select-none"
            :class="[
              props.activeView === tab.id
                ? 'shadow-none'
                : 'text-white/70 hover:bg-white/10 hover:text-white',
            ]"
            :style="{
              color: props.activeView === tab.id ? activeTextColor : undefined,
            }"
            @click="handleTabClick(tab.id)"
          >
            <component
              :is="tab.icon"
              class="h-3.5 w-3.5 transition-transform duration-200"
              :class="{ 'scale-110': props.activeView === tab.id }"
            />
            <span>{{ tab.label }}</span>
          </button>
        </nav>
      </Transition>

      <!-- Toggle Navigation Button: Gear rotates smoothly and reveals the navigation tabs pill -->
      <button
        type="button"
        aria-label="Toggle navigation tabs"
        :title="
          isNavExpanded ? 'Hide navigation views' : 'Show navigation views'
        "
        class="flex h-10 w-10 items-center justify-center rounded-full border shadow-lg transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-110 active:scale-90 cursor-pointer backdrop-blur-xl"
        :class="[
          isNavExpanded
            ? 'bg-white/15'
            : 'border-white/10 bg-white/[0.06] text-white/80 hover:text-white hover:bg-white/15',
        ]"
        :style="{
          borderColor: isNavExpanded ? `${activeAccent}66` : undefined,
          boxShadow: isNavExpanded ? `0 4px 14px 0 ${accentGlow}` : undefined,
        }"
        @click="toggleNav"
      >
        <Settings
          class="h-4 w-4 transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]"
          :class="[isNavExpanded ? 'rotate-180' : 'rotate-0 text-white/80']"
          :style="{
            color: isNavExpanded ? activeAccent : undefined,
          }"
        />
      </button>

      <!-- Dedicated Settings button: Opens Customize Tabloom settings drawer -->
      <button
        type="button"
        aria-label="Customize settings"
        title="Customize Tabloom (Settings)"
        class="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/80 shadow-lg transition-all duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)] hover:scale-110 hover:bg-white/15 hover:text-white active:scale-90 cursor-pointer backdrop-blur-xl"
        @click="emit('openSettings')"
      >
        <SlidersHorizontal class="h-4 w-4" />
      </button>
    </div>
  </header>
</template>

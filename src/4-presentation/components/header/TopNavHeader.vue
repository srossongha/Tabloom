<!--
  TopNavHeader component displaying the brand badge, view switcher pill, and single gear settings trigger.
  Coordinates navigation between Bookmarks, Open Tabs, Most Visited, and Last Session views
  with a fluid sliding curve mask animation, and single gear button for opening settings.
-->
<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import {
  Settings,
  Bookmark,
  Layers,
  Sparkles,
  Clock,
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
  isSettingsOpen?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  accentColor: "#10b981",
  showLogo: true,
  showNavTabs: true,
  isSettingsOpen: false,
});

const emit = defineEmits<{
  (e: "selectView", view: NavigationTab): void;
  (e: "openSettings"): void;
}>();

const TABS: Array<{ id: NavigationTab; label: string; icon: unknown }> = [
  { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
  { id: "openTabs", label: "Open tabs", icon: Layers },
  { id: "mostVisited", label: "Most visited", icon: Sparkles },
  { id: "lastSession", label: "Last session", icon: Clock },
];

const TAB_ORDER: Record<NavigationTab, number> = {
  bookmarks: 0,
  openTabs: 1,
  mostVisited: 2,
  lastSession: 3,
};

const activeAccent = computed(() => props.accentColor || "#10b981");

const activeTextColor = computed(() => {
  return isColorBright(activeAccent.value) ? "#0f172a" : "#ffffff";
});

const accentGlow = computed(() => {
  const rgb = parseHexOrRgb(activeAccent.value);
  if (!rgb) return "rgba(16, 185, 129, 0.40)";
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.38)`;
});

const navRef = ref<HTMLElement | null>(null);
const tabRefs = ref<Record<string, HTMLElement | null>>({});
const pillLeft = ref(0);
const pillTop = ref(0);
const pillWidth = ref(0);
const pillHeight = ref(0);
const pillReady = ref(false);

const optimisticActiveView = ref<NavigationTab>(props.activeView);
watch(
  () => props.activeView,
  (val) => {
    optimisticActiveView.value = val;
    moveToTab(val, true);
  },
);

const isSliding = ref(false);
const slideDuration = ref(380);
let slideTimer: number | undefined;

function setTabRef(id: NavigationTab, el: any) {
  if (el) {
    tabRefs.value[id] = el as HTMLElement;
    if (id === optimisticActiveView.value) {
      nextTick(() => {
        moveToTab(id, false);
      });
    }
  }
}

function moveToTab(view: NavigationTab, animated = true) {
  const targetEl = tabRefs.value[view];
  const navEl = navRef.value;
  if (!targetEl || !navEl) return;

  const targetRect = targetEl.getBoundingClientRect();
  const navRect = navEl.getBoundingClientRect();

  const relLeft = Math.round(targetRect.left - navRect.left);
  const relTop = Math.round(targetRect.top - navRect.top);
  const relWidth = Math.round(targetRect.width);
  const relHeight = Math.round(targetRect.height);

  if (animated && pillReady.value) {
    const currentIdx = TAB_ORDER[optimisticActiveView.value] ?? 0;
    const targetIdx = TAB_ORDER[view] ?? 0;
    const dist = Math.abs(targetIdx - currentIdx);

    // Dynamic speed curve duration proportional to distance:
    // 1 tab jump: 300ms, 2 tabs jump: 380ms, 3 tabs jump (e.g. Bookmarks -> Last session): 440ms
    slideDuration.value = dist <= 1 ? 300 : dist === 2 ? 380 : 440;
    isSliding.value = true;

    if (slideTimer) clearTimeout(slideTimer);
    slideTimer = window.setTimeout(() => {
      isSliding.value = false;
    }, slideDuration.value);
  } else {
    slideDuration.value = 0;
    isSliding.value = false;
  }

  pillLeft.value = relLeft;
  pillTop.value = relTop;
  pillWidth.value = relWidth;
  pillHeight.value = relHeight;
  pillReady.value = true;
}

function handleTabClick(view: NavigationTab) {
  if (view === optimisticActiveView.value) return;
  optimisticActiveView.value = view;
  moveToTab(view, true);
  emit("selectView", view);
}

function updatePillPosition() {
  moveToTab(props.activeView, false);
}

watch(
  () => props.accentColor,
  async () => {
    await nextTick();
    requestAnimationFrame(updatePillPosition);
  },
);

onMounted(() => {
  window.addEventListener("resize", updatePillPosition);
  nextTick(() => {
    updatePillPosition();
  });
});

onUnmounted(() => {
  if (slideTimer) clearTimeout(slideTimer);
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

    <!-- Center/Right view switcher pill & single gear button -->
    <div class="flex items-center gap-3">
      <!-- Navigation Tabs Pill (The Bar) -->
      <nav
        v-if="props.showNavTabs"
        ref="navRef"
        class="relative flex items-center gap-1 rounded-full border border-white/10 dark:border-white/10 light:border-black/10 bg-white/[0.06] dark:bg-white/[0.06] light:bg-black/[0.04] p-1.5 shadow-xl shadow-black/20 backdrop-blur-xl"
        role="tablist"
      >
        <!-- Animated Sliding Mask Indicator (moves between tabs with smooth curved speed and uniform concentric padding) -->
        <div
          class="pointer-events-none absolute top-0 left-0 rounded-full will-change-[transform,width,height,opacity]"
          :style="{
            transform: `translate3d(${pillLeft}px, ${pillTop}px, 0)`,
            width: `${pillWidth}px`,
            height: `${pillHeight}px`,
            transitionProperty: 'transform, width, height, opacity, box-shadow',
            transitionDuration: `${slideDuration}ms`,
            transitionTimingFunction: 'cubic-bezier(0.34, 1.36, 0.64, 1)',
            opacity: pillReady ? 1 : 0,
            backgroundColor: activeAccent,
            boxShadow: isSliding
              ? `0 6px 20px 0 ${accentGlow}, 0 0 14px 2px ${activeAccent}44`
              : `0 4px 14px 0 ${accentGlow}`,
          }"
        />

        <button
          v-for="tab in TABS"
          :key="tab.id"
          :ref="(el) => setTabRef(tab.id, el)"
          role="tab"
          :aria-selected="optimisticActiveView === tab.id"
          class="relative z-10 flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300 ease-[cubic-bezier(0.34,1.36,0.64,1)] hover:-translate-y-0.5 active:scale-95 cursor-pointer select-none bg-transparent"
          :class="[
            optimisticActiveView === tab.id
              ? 'shadow-none'
              : 'text-white/70 hover:text-white dark:text-white/70 dark:hover:text-white light:text-slate-600 light:hover:text-slate-900',
          ]"
          :style="{
            color: optimisticActiveView === tab.id ? activeTextColor : undefined,
          }"
          @click="handleTabClick(tab.id)"
        >
          <component
            :is="tab.icon"
            class="h-3.5 w-3.5 transition-transform duration-300 ease-[cubic-bezier(0.34,1.36,0.64,1)]"
            :class="{ 'scale-110': optimisticActiveView === tab.id }"
          />
          <span>{{ tab.label }}</span>
        </button>
      </nav>

      <!-- The Gear Button (Alone - Single Circle) -->
      <button
        type="button"
        aria-label="Customize settings"
        :title="props.isSettingsOpen ? 'Close settings' : 'Customize Tabloom (Settings)'"
        class="group flex h-10 w-10 items-center justify-center rounded-full border shadow-lg transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-110 active:scale-90 cursor-pointer backdrop-blur-xl"
        :class="[
          props.isSettingsOpen
            ? 'bg-white/15'
            : 'border-white/10 bg-white/[0.06] text-white/80 hover:text-white hover:bg-white/15',
        ]"
        :style="{
          borderColor: props.isSettingsOpen ? `${activeAccent}66` : undefined,
          boxShadow: props.isSettingsOpen ? `0 4px 14px 0 ${accentGlow}` : undefined,
        }"
        @click="emit('openSettings')"
      >
        <Settings
          class="h-4 w-4 transition-transform duration-400 ease-[cubic-bezier(0.34,1.4,0.64,1)]"
          :class="[
            props.isSettingsOpen
              ? 'rotate-90'
              : 'rotate-0 text-white/80 group-hover:rotate-45 group-hover:text-white',
          ]"
          :style="{
            color: props.isSettingsOpen ? activeAccent : undefined,
          }"
        />
      </button>
    </div>
  </header>
</template>

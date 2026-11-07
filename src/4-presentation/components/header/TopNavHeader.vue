<!--
  TopNavHeader component displaying the brand badge, expandable view switcher pill, and setting circle.
  - Idle state: Displays ONLY the single Gear circle button in the top right.
  - Interaction: Clicking the gear slides out the 4-tab navigation pill and the setting circle button.
  - Clicking the setting circle opens/closes the Customize settings drawer.
  - Clicking the gear button again smoothly slides them back into hiding.
-->
<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import {
  Settings,
  SlidersHorizontal,
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

const activeAccent = computed(() => props.accentColor || "#10b981");

const activeTextColor = computed(() => {
  return isColorBright(activeAccent.value) ? "#0f172a" : "#ffffff";
});

const accentGlow = computed(() => {
  const rgb = parseHexOrRgb(activeAccent.value);
  if (!rgb) return "rgba(16, 185, 129, 0.40)";
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.38)`;
});

// Expandable slide-out state: defaults to false (gear only)
const isExpanded = ref(false);

function toggleExpanded() {
  isExpanded.value = !isExpanded.value;
  try {
    localStorage.setItem(
      "tabloom_nav_expanded",
      isExpanded.value ? "true" : "false",
    );
  } catch {}

  if (isExpanded.value) {
    nextTick(() => {
      updatePillPosition();
    });
  }
}

watch(
  () => props.isSettingsOpen,
  (open) => {
    if (open) isExpanded.value = true;
  },
);

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
const slideDuration = ref(260);
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

  // Use offsetLeft/offsetTop/offsetWidth/offsetHeight for 100% stable,
  // transform-independent layout coordinates relative to navRef.
  const left = targetEl.offsetLeft;
  const top = targetEl.offsetTop;
  const width = targetEl.offsetWidth;
  const height = targetEl.offsetHeight;

  if (width === 0) {
    requestAnimationFrame(() => moveToTab(view, false));
    return;
  }

  if (animated && pillReady.value) {
    slideDuration.value = 260;
    isSliding.value = true;

    if (slideTimer) clearTimeout(slideTimer);
    slideTimer = window.setTimeout(() => {
      isSliding.value = false;
    }, 260);
  } else {
    slideDuration.value = 0;
    isSliding.value = false;
  }

  pillLeft.value = left;
  pillTop.value = top;
  pillWidth.value = width;
  pillHeight.value = height;
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

function onKeyDown(e: KeyboardEvent) {
  if (e.key === "Escape" && isExpanded.value && !props.isSettingsOpen) {
    isExpanded.value = false;
  }
}

watch(
  () => props.accentColor,
  async () => {
    await nextTick();
    requestAnimationFrame(updatePillPosition);
  },
);

onMounted(() => {
  try {
    const saved = localStorage.getItem("tabloom_nav_expanded");
    if (saved === "true") {
      isExpanded.value = true;
    }
  } catch {}

  window.addEventListener("resize", updatePillPosition);
  window.addEventListener("keydown", onKeyDown);
  if (isExpanded.value) {
    nextTick(() => {
      updatePillPosition();
    });
  }
});

onUnmounted(() => {
  if (slideTimer) clearTimeout(slideTimer);
  window.removeEventListener("resize", updatePillPosition);
  window.removeEventListener("keydown", onKeyDown);
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

    <!-- Center/Right: Gear alone by default; slides out the 4-bar and setting circle when clicked -->
    <div class="relative flex items-center justify-end gap-2.5">
      <!-- Sliding Out Elements (The 4-bar pill & The Setting Circle) -->
      <Transition name="header-expand">
        <div
          v-if="isExpanded && props.showNavTabs"
          class="flex shrink-0 items-center gap-2.5 origin-right whitespace-nowrap"
        >
          <!-- Navigation Tabs Pill (The Bar for the 4) -->
          <nav
            ref="navRef"
            class="relative flex items-center gap-1 rounded-full border border-white/10 dark:border-white/10 light:border-black/10 bg-white/[0.06] dark:bg-white/[0.06] light:bg-black/[0.04] p-1.5 shadow-xl shadow-black/20 backdrop-blur-xl"
            role="tablist"
          >
            <!-- Animated Sliding Mask Indicator (Fluid Apple-style glide, zero overshoot) -->
            <div
              class="pointer-events-none absolute top-0 left-0 rounded-full will-change-[transform,width,height,opacity]"
              :style="{
                transform: `translate3d(${pillLeft}px, ${pillTop}px, 0)`,
                width: `${pillWidth}px`,
                height: `${pillHeight}px`,
                transitionProperty: 'transform, width, height, opacity, box-shadow',
                transitionDuration: `${slideDuration}ms`,
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                opacity: pillReady ? 1 : 0,
                backgroundColor: activeAccent,
                boxShadow: isSliding
                  ? `0 4px 16px 0 ${accentGlow}`
                  : `0 2px 10px 0 ${accentGlow}`,
              }"
            />

            <button
              v-for="tab in TABS"
              :key="tab.id"
              :ref="(el) => setTabRef(tab.id, el)"
              role="tab"
              :aria-selected="optimisticActiveView === tab.id"
              class="relative z-10 flex h-7.5 items-center justify-center gap-1.5 rounded-full pl-3.5 pr-4 text-xs font-medium leading-none transition-colors duration-200 select-none bg-transparent cursor-pointer"
              :class="[
                optimisticActiveView === tab.id
                  ? 'shadow-none'
                  : 'text-white/70 hover:text-white dark:text-white/70 dark:hover:text-white light:text-slate-600 light:hover:text-slate-900',
              ]"
              :style="{
                color:
                  optimisticActiveView === tab.id ? activeTextColor : undefined,
              }"
              @click="handleTabClick(tab.id)"
            >
              <component
                :is="tab.icon"
                class="h-3.5 w-3.5 shrink-0 transition-transform duration-200 ease-out"
                :class="{ 'scale-105': optimisticActiveView === tab.id }"
              />
              <span class="inline-flex items-center leading-none -translate-y-[0.5px]">{{ tab.label }}</span>
            </button>
          </nav>

          <!-- One Circle for Setting (Sliders / Customize Drawer) -->
          <button
            type="button"
            aria-label="Customize settings"
            :title="
              props.isSettingsOpen
                ? 'Close Customize'
                : 'Customize Tabloom (Settings)'
            "
            class="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-lg transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-110 active:scale-90 cursor-pointer backdrop-blur-xl"
            :class="[
              props.isSettingsOpen
                ? 'bg-white/15 border-white/20'
                : 'border-white/10 dark:border-white/10 light:border-black/10 bg-white/[0.06] dark:bg-white/[0.06] light:bg-black/[0.04] text-white/80 hover:text-white hover:bg-white/15 light:text-slate-700 light:hover:text-slate-900',
            ]"
            :style="{
              borderColor: props.isSettingsOpen ? `${activeAccent}66` : undefined,
              boxShadow: props.isSettingsOpen
                ? `0 4px 14px 0 ${accentGlow}`
                : undefined,
            }"
            @click="emit('openSettings')"
          >
            <SlidersHorizontal
              class="h-4 w-4 transition-transform duration-300 group-hover:scale-110"
              :style="{
                color: props.isSettingsOpen ? activeAccent : undefined,
              }"
            />
          </button>
        </div>
      </Transition>

      <!-- The Gear Button (Alone Initially - Click to Slide Out / Slide In) -->
      <button
        type="button"
        aria-label="Toggle navigation and settings"
        :title="
          isExpanded
            ? 'Collapse navigation'
            : 'Expand navigation & settings'
        "
        class="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-lg transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-110 active:scale-90 cursor-pointer backdrop-blur-xl"
        :class="[
          isExpanded
            ? 'border-white/20 bg-white/15'
            : 'border-white/10 dark:border-white/10 light:border-black/10 bg-white/[0.06] dark:bg-white/[0.06] light:bg-black/[0.04] text-white/80 hover:text-white hover:bg-white/15 light:text-slate-700 light:hover:text-slate-900',
        ]"
        :style="{
          borderColor: isExpanded ? `${activeAccent}66` : undefined,
          boxShadow: isExpanded ? `0 4px 14px 0 ${accentGlow}` : undefined,
        }"
        @click="toggleExpanded"
      >
        <Settings
          class="h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          :class="[
            isExpanded
              ? 'rotate-90'
              : 'rotate-0 text-white/80 group-hover:rotate-45 group-hover:text-white light:text-slate-700 light:group-hover:text-slate-900',
          ]"
          :style="{
            color: isExpanded ? activeAccent : undefined,
          }"
        />
      </button>
    </div>
  </header>
</template>

<style scoped>
/* Fluid Slide-out & Collapse Animation (Zero squish, crisp reveal) */
.header-expand-enter-active {
  transition:
    max-width 320ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 240ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 320ms cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.header-expand-leave-active {
  transition:
    max-width 240ms cubic-bezier(0.2, 0, 0, 1),
    opacity 180ms ease,
    transform 240ms cubic-bezier(0.2, 0, 0, 1);
  overflow: hidden;
}

.header-expand-enter-from,
.header-expand-leave-to {
  opacity: 0;
  transform: translateX(18px);
  max-width: 0px;
}

.header-expand-enter-to,
.header-expand-leave-from {
  opacity: 1;
  transform: translateX(0);
  max-width: 580px;
}
</style>

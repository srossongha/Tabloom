<!--
  Reusable Segmented Pill Control with fluid sliding motion indicator.
  Follows Clean Architecture (Presentation Layer Common Component).
  - Uses CSS translate3d + width animation with organic cubic-bezier easing.
  - Automatically handles high-contrast active text color based on accent brightness.
  - Supported across any generic value type (string, number, enum).
  - Responsive with ResizeObserver support for drawer and modal transitions.
-->
<script setup lang="ts" generic="T extends string | number">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";
import {
  isColorBright,
  parseHexOrRgb,
} from "../../../2-application/services/colorUtils";

export interface SegmentedOption<V = string | number> {
  id: V;
  label: string;
  icon?: any;
}

interface Props {
  modelValue: T;
  options: Array<SegmentedOption<T>>;
  accentColor?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  containerClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  accentColor: "#10b981",
  disabled: false,
  size: "md",
  containerClass: "",
});

const emit = defineEmits<{
  (e: "update:modelValue", val: T): void;
  (e: "change", val: T): void;
}>();

const containerRef = ref<HTMLElement | null>(null);
const optionRefs = ref<Record<string, HTMLElement | null>>({});

const pillLeft = ref(0);
const pillWidth = ref(0);
const pillReady = ref(false);
const isSliding = ref(false);

const activeAccent = computed(() => props.accentColor || "#10b981");

const activeTextColor = computed(() => {
  return isColorBright(activeAccent.value) ? "#0f172a" : "#ffffff";
});

const accentGlow = computed(() => {
  const rgb = parseHexOrRgb(activeAccent.value);
  if (!rgb) return "rgba(16, 185, 129, 0.40)";
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`;
});

let slideTimer: number | undefined;
let resizeObserver: ResizeObserver | null = null;

function setOptionRef(id: T, el: any) {
  if (el) {
    optionRefs.value[String(id)] = el as HTMLElement;
    if (id === props.modelValue) {
      nextTick(() => {
        moveToOption(id, false);
      });
    }
  }
}

function moveToOption(val: T, animated = true) {
  const targetEl = optionRefs.value[String(val)];
  const contEl = containerRef.value;
  if (!targetEl || !contEl) return;

  const left = targetEl.offsetLeft;
  const width = targetEl.offsetWidth;

  if (width === 0) {
    requestAnimationFrame(() => moveToOption(val, false));
    return;
  }

  if (animated && pillReady.value) {
    isSliding.value = true;
    if (slideTimer) clearTimeout(slideTimer);
    slideTimer = window.setTimeout(() => {
      isSliding.value = false;
    }, 420);
  }

  pillLeft.value = left;
  pillWidth.value = width;
  pillReady.value = true;
}

function selectOption(val: T) {
  if (props.disabled || val === props.modelValue) return;
  moveToOption(val, true);
  emit("update:modelValue", val);
  emit("change", val);
}

watch(
  () => props.modelValue,
  (val) => {
    moveToOption(val, true);
  },
);

watch(
  () => props.accentColor,
  async () => {
    await nextTick();
    moveToOption(props.modelValue, false);
  },
);

onMounted(() => {
  nextTick(() => {
    moveToOption(props.modelValue, false);
    // Double check after fonts and drawer animations settle
    window.setTimeout(() => moveToOption(props.modelValue, false), 150);
  });

  if (typeof ResizeObserver !== "undefined" && containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      moveToOption(props.modelValue, false);
    });
    resizeObserver.observe(containerRef.value);
  }
});

onUnmounted(() => {
  if (slideTimer) clearTimeout(slideTimer);
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});
</script>

<template>
  <div
    ref="containerRef"
    class="relative flex items-center rounded-xl border border-white/10 dark:border-white/10 light:border-black/10 bg-white/[0.04] dark:bg-white/[0.04] light:bg-black/[0.03] p-1 select-none backdrop-blur-md w-full"
    :class="[
      props.disabled ? 'opacity-50 pointer-events-none' : '',
      props.containerClass,
    ]"
    role="tablist"
  >
    <!-- Animated Sliding Capsule Mask -->
    <div
      class="pointer-events-none absolute inset-y-1 left-0 rounded-lg will-change-[transform,width,opacity]"
      :style="{
        transform: `translate3d(${pillLeft}px, 0, 0)`,
        width: `${pillWidth}px`,
        transition: pillReady
          ? 'transform 420ms cubic-bezier(0.16, 1, 0.3, 1), width 420ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease, box-shadow 300ms ease'
          : 'opacity 200ms ease',
        opacity: pillReady ? 1 : 0,
        backgroundColor: activeAccent,
        boxShadow: isSliding
          ? `0 4px 16px 0 ${accentGlow}`
          : `0 2px 10px 0 ${accentGlow}`,
      }"
    />

    <!-- Option Buttons -->
    <button
      v-for="opt in props.options"
      :key="String(opt.id)"
      :ref="(el) => setOptionRef(opt.id, el)"
      type="button"
      role="tab"
      :aria-selected="props.modelValue === opt.id"
      class="relative z-10 flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-colors duration-200 select-none bg-transparent cursor-pointer"
      :class="[
        props.size === 'sm' ? 'py-1 px-1.5 text-[11px]' : 'py-1.5 px-2.5 text-xs',
        props.modelValue === opt.id
          ? 'font-semibold shadow-none'
          : 'text-white/60 hover:text-white dark:text-white/60 dark:hover:text-white light:text-slate-600 light:hover:text-slate-900',
      ]"
      :style="{
        color: props.modelValue === opt.id ? activeTextColor : undefined,
      }"
      @click="selectOption(opt.id)"
    >
      <component
        :is="opt.icon"
        v-if="opt.icon"
        class="h-3.5 w-3.5 shrink-0 transition-transform duration-200 ease-out"
        :class="{ 'scale-105': props.modelValue === opt.id }"
      />
      <span class="truncate">{{ opt.label }}</span>
    </button>
  </div>
</template>

<!--
  WebSearchBar component rendering the centered pill search input.
  Simultaneously filters on-screen tiles and executes web search queries upon Enter keypress.
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Search, X } from 'lucide-vue-next'
import { buildSearchUrl } from '../../../2-application/services/tileEngine'

interface Props {
  modelValue: string
  searchEngine?: string
  openInNewTab?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  searchEngine: 'google',
  openInNewTab: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'search', query: string): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

function onClear() {
  emit('update:modelValue', '')
  inputRef.value?.focus()
}

function onSubmit() {
  const q = props.modelValue.trim()
  if (!q) return
  emit('search', q)
  const url = buildSearchUrl(props.searchEngine, q)
  if (props.openInNewTab) {
    window.open(url, '_blank')
  } else {
    if (typeof chrome !== 'undefined' && chrome.tabs?.update) {
      chrome.tabs.update({ url })
    } else {
      window.location.href = url
    }
  }
}

function onGlobalKeydown(e: KeyboardEvent) {
  if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) && document.activeElement !== inputRef.value) {
    e.preventDefault()
    inputRef.value?.focus()
  } else if (e.key === 'Escape' && document.activeElement === inputRef.value) {
    inputRef.value?.blur()
  }
}

onMounted(() => window.addEventListener('keydown', onGlobalKeydown))
onUnmounted(() => window.removeEventListener('keydown', onGlobalKeydown))
</script>

<template>
  <div class="relative z-10 mx-auto w-full max-w-xl px-4 pt-2 pb-5">
    <div
      class="group relative flex items-center rounded-full border border-white/10 bg-white/[0.05] px-5 py-2.5 shadow-xl shadow-black/25 backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus-within:scale-[1.01] focus-within:border-emerald-400/50 focus-within:bg-white/[0.09] focus-within:ring-2 focus-within:ring-emerald-400/20"
    >
      <Search class="mr-3 h-4 w-4 text-white/40 transition-colors group-focus-within:text-emerald-400" />
      <input
        ref="inputRef"
        type="text"
        :value="props.modelValue"
        placeholder="Search the web or filter shortcuts"
        class="w-full bg-transparent text-sm font-normal text-white placeholder-white/35 outline-none"
        @input="onInput"
        @keydown.enter="onSubmit"
      />
      <button
        v-if="props.modelValue"
        aria-label="Clear search"
        class="ml-2 rounded-full p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
        @click="onClear"
      >
        <X class="h-4 w-4" />
      </button>
      <kbd
        v-else
        class="ml-2 hidden rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40 select-none group-focus-within:hidden sm:inline-block"
      >
        /
      </kbd>
    </div>
  </div>
</template>

<!--
  BackgroundMedia component rendering custom wallpapers (images, animated GIFs, MP4/WebM videos)
  and handling ambient background audio (MP3/WAV/OGG) with a minimalist floating player pill.
  Media is loaded from local IndexedDB for instant, stutter-free performance, or synced URLs.
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Volume2, VolumeX, Play, Pause } from 'lucide-vue-next'
import type { WallpaperType } from '../../../1-domain/entities/AppSettings'
import { mediaStorageService } from '../../../3-infrastructure/storage/mediaStorageService'

interface Props {
  wallpaper: string
  wallpaperType?: WallpaperType
  wallpaperBlur?: number
  wallpaperDim?: number
  showCustomWallpaper?: boolean
  showAudioPlayer?: boolean
  audioUrl?: string
  audioName?: string
  audioVolume?: number
  audioAutoplay?: boolean
  audioLoop?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  wallpaperType: 'auto',
  wallpaperBlur: 0,
  wallpaperDim: 30,
  showCustomWallpaper: true,
  showAudioPlayer: true,
  audioUrl: '',
  audioName: '',
  audioVolume: 50,
  audioAutoplay: false,
  audioLoop: true,
})

const emit = defineEmits<{
  (e: 'updateVolume', volume: number): void
}>()

// --- Wallpaper Resolution ---
const videoRef = ref<HTMLVideoElement | null>(null)
const resolvedWallpaperUrl = ref('')
const resolvedWallpaperMime = ref('')

async function resolveWallpaper() {
  if (!props.wallpaper) {
    resolvedWallpaperUrl.value = ''
    resolvedWallpaperMime.value = ''
    return
  }

  if (props.wallpaper === 'local:wallpaper') {
    const res = await mediaStorageService.getMedia('wallpaper')
    if (res) {
      resolvedWallpaperUrl.value = res.url
      resolvedWallpaperMime.value = res.record.mimeType
      return
    }
  }

  resolvedWallpaperUrl.value = props.wallpaper
  resolvedWallpaperMime.value = ''
}

const isVideo = computed(() => {
  if (props.wallpaperType === 'video') return true
  if (props.wallpaperType === 'image') return false

  // Auto-detection
  if (resolvedWallpaperMime.value.startsWith('video/')) return true
  const lower = resolvedWallpaperUrl.value.toLowerCase()
  return (
    lower.includes('.mp4') ||
    lower.includes('.webm') ||
    lower.includes('.ogg') ||
    lower.startsWith('data:video/')
  )
})

watch(() => [props.wallpaper, props.wallpaperType], resolveWallpaper, {
  immediate: true,
})

// --- Background Audio Resolution & Playback ---
const audioRef = ref<HTMLAudioElement | null>(null)
const resolvedAudioUrl = ref('')
const isPlaying = ref(false)
const isMuted = ref(false)
const isHoveringPlayer = ref(false)
const localVolume = ref(props.audioVolume)

async function resolveAudio() {
  if (!props.audioUrl) {
    resolvedAudioUrl.value = ''
    isPlaying.value = false
    return
  }

  if (props.audioUrl === 'local:audio') {
    const res = await mediaStorageService.getMedia('audio')
    if (res) {
      resolvedAudioUrl.value = res.url
      return
    }
  }

  resolvedAudioUrl.value = props.audioUrl
}

watch(() => props.audioUrl, resolveAudio, { immediate: true })

watch(
  () => props.audioVolume,
  (vol) => {
    localVolume.value = vol
    if (audioRef.value) {
      audioRef.value.volume = isMuted.value ? 0 : vol / 100
    }
  }
)

function togglePlay() {
  if (!audioRef.value) return
  if (isPlaying.value) {
    audioRef.value.pause()
    isPlaying.value = false
  } else {
    audioRef.value
      .play()
      .then(() => {
        isPlaying.value = true
      })
      .catch(() => {
        isPlaying.value = false
      })
  }
}

function toggleMute() {
  if (!audioRef.value) return
  isMuted.value = !isMuted.value
  audioRef.value.volume = isMuted.value ? 0 : localVolume.value / 100
}

function onVolumeInput(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  localVolume.value = val
  if (audioRef.value) {
    audioRef.value.volume = val / 100
    if (val > 0) isMuted.value = false
  }
  emit('updateVolume', val)
}

function onAudioEnded() {
  if (!props.audioLoop) {
    isPlaying.value = false
  }
}

function onMediaUpdated(e: Event) {
  const detail = (e as CustomEvent<{ id: string }>).detail
  if (detail?.id === 'wallpaper') resolveWallpaper()
  if (detail?.id === 'audio') resolveAudio()
}

function handleVisibility() {
  if (typeof document === 'undefined') return
  if (document.hidden) {
    if (videoRef.value && !videoRef.value.paused) {
      videoRef.value.pause()
    }
  } else {
    if (videoRef.value && videoRef.value.paused && isVideo.value) {
      videoRef.value.play().catch(() => {})
    }
  }
}

onMounted(() => {
  resolveWallpaper()
  resolveAudio()

  window.addEventListener('tabloom:mediaUpdated', onMediaUpdated)
  document.addEventListener('visibilitychange', handleVisibility, { passive: true })

  // Autoplay attempt if configured
  if (props.audioAutoplay && resolvedAudioUrl.value) {
    setTimeout(() => {
      if (audioRef.value) {
        audioRef.value.volume = localVolume.value / 100
        audioRef.value
          .play()
          .then(() => {
            isPlaying.value = true
          })
          .catch(() => {
            // Browser autoplay policy requires user interaction first
            isPlaying.value = false
          })
      }
    }, 500)
  }
})

onUnmounted(() => {
  window.removeEventListener('tabloom:mediaUpdated', onMediaUpdated)
  document.removeEventListener('visibilitychange', handleVisibility)
  if (audioRef.value) {
    audioRef.value.pause()
  }
})
</script>

<template>
  <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
    <!-- Video Wallpaper (Looping MP4/WebM) - Paused in background tabs -->
    <video
      v-if="props.showCustomWallpaper && resolvedWallpaperUrl && isVideo"
      ref="videoRef"
      :src="resolvedWallpaperUrl"
      autoplay
      loop
      muted
      playsinline
      class="h-full w-full object-cover transition-all duration-500"
      :style="{
        filter: props.wallpaperBlur > 0 ? `blur(${props.wallpaperBlur}px)` : undefined,
        opacity: 1 - props.wallpaperDim / 100,
        transform: 'translate3d(0, 0, 0)',
        willChange: props.wallpaperBlur > 0 ? 'transform, filter' : 'auto',
        contain: 'strict',
      }"
    />

    <!-- Image or Animated GIF Wallpaper -->
    <div
      v-else-if="props.showCustomWallpaper && resolvedWallpaperUrl"
      class="h-full w-full bg-cover bg-center transition-all duration-500"
      :style="{
        backgroundImage: `url(${resolvedWallpaperUrl})`,
        filter: props.wallpaperBlur > 0 ? `blur(${props.wallpaperBlur}px)` : undefined,
        opacity: 1 - props.wallpaperDim / 100,
        transform: 'translate3d(0, 0, 0)',
        willChange: props.wallpaperBlur > 0 ? 'transform, filter' : 'auto',
        contain: 'strict',
      }"
    />

    <!-- Hidden HTML5 Audio Element for Background Sound -->
    <audio
      v-if="props.showAudioPlayer && resolvedAudioUrl"
      ref="audioRef"
      :src="resolvedAudioUrl"
      :loop="props.audioLoop"
      preload="auto"
      @ended="onAudioEnded"
      @pause="isPlaying = false"
      @play="isPlaying = true"
    />

    <!-- Minimalist Ambient Audio Controller Pill (Floating in bottom-right) -->
    <div
      v-if="props.showAudioPlayer && resolvedAudioUrl"
      class="pointer-events-auto fixed bottom-5 right-6 z-40 flex items-center select-none"
      @mouseenter="isHoveringPlayer = true"
      @mouseleave="isHoveringPlayer = false"
    >
      <div
        class="gpu-card group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] p-1.5 shadow-xl shadow-black/30 backdrop-blur-xl transition-all duration-200 hover:border-white/20 hover:bg-white/[0.10]"
      >
        <!-- Play / Pause Button -->
        <button
          type="button"
          :title="isPlaying ? 'Pause ambient audio' : 'Play ambient audio'"
          aria-label="Toggle ambient audio playback"
          class="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 transition-all hover:scale-105 hover:bg-emerald-500/30 hover:text-white"
          @click="togglePlay"
        >
          <Pause v-if="isPlaying" class="h-3.5 w-3.5" />
          <Play v-else class="h-3.5 w-3.5 translate-x-0.5" />
        </button>

        <!-- Track Info & Visualizer Waves -->
        <div class="flex items-center gap-1.5 px-1 max-w-[150px]">
          <div class="flex items-center gap-0.5">
            <span
              class="h-2.5 w-0.5 rounded-full bg-emerald-400 transition-all duration-150"
              :class="{ 'animate-pulse': isPlaying, 'opacity-40': !isPlaying }"
            />
            <span
              class="h-4 w-0.5 rounded-full bg-emerald-400 transition-all duration-300"
              :class="{ 'animate-pulse delay-75': isPlaying, 'opacity-40': !isPlaying }"
            />
            <span
              class="h-2 w-0.5 rounded-full bg-emerald-400 transition-all duration-200"
              :class="{ 'animate-pulse delay-150': isPlaying, 'opacity-40': !isPlaying }"
            />
          </div>
          <span
            class="truncate text-[11px] font-medium text-white/70"
            :title="props.audioName || 'Ambient Track'"
          >
            {{ props.audioName || 'Ambient Audio' }}
          </span>
        </div>

        <!-- Volume & Mute Controls (Smoothly expand on hover) -->
        <div class="flex items-center gap-1.5 pr-1">
          <button
            type="button"
            :title="isMuted ? 'Unmute' : 'Mute'"
            aria-label="Toggle mute"
            class="rounded-full p-1 text-white/50 transition-colors hover:text-white"
            @click="toggleMute"
          >
            <VolumeX v-if="isMuted || localVolume === 0" class="h-3.5 w-3.5 text-rose-400" />
            <Volume2 v-else class="h-3.5 w-3.5" />
          </button>

          <!-- Collapsible Volume Slider -->
          <div
            class="overflow-hidden transition-all duration-200"
            :class="isHoveringPlayer ? 'w-16 opacity-100' : 'w-0 opacity-0 pointer-events-none'"
          >
            <input
              type="range"
              min="0"
              max="100"
              :value="isMuted ? 0 : localVolume"
              aria-label="Volume"
              class="h-1 w-16 cursor-pointer accent-emerald-400 bg-white/20 rounded-full"
              @input="onVolumeInput"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<!--
  CosmicCanvas background component providing ultra-lightweight particle animations.
  Optimized for low-end devices: zero full-screen backdrop filter overhead, throttled 50fps rendering,
  automatic pause on background tabs (document.hidden) and prefers-reduced-motion detection.
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { ParticleMode } from '../../../1-domain/entities/AppSettings'

interface Props {
  mode?: ParticleMode
  density?: number
}
const props = withDefaults(defineProps<Props>(), {
  mode: 'cosmic-dust',
  density: 40,
})

const canvasRef = ref<HTMLCanvasElement | null>(null)
let animId = 0
let isRunning = false
let lastTime = 0
let resizeTimeout: number | undefined

interface Particle {
  x: number
  y: number
  size: number
  vx: number
  vy: number
  alpha: number
  color: string
}
let particles: Particle[] = []

function initParticles(w: number, h: number) {
  particles = []
  if (props.mode === 'off' || w <= 0 || h <= 0) return
  // Reduced particle count ceiling (max 28 particles) for negligible CPU/GPU impact
  const count = Math.min(28, Math.max(8, Math.floor((props.density / 100) * 32)))

  for (let i = 0; i < count; i++) {
    const isBottom = props.mode === 'sakura-horizon' && Math.random() > 0.4
    particles.push({
      x: Math.random() * w,
      y: isBottom ? h - Math.random() * (h * 0.35) : Math.random() * h,
      size: Math.random() * 2 + 0.8,
      vx: (Math.random() - 0.5) * 0.22,
      vy: props.mode === 'starfield' ? -(Math.random() * 0.3 + 0.1) : (Math.random() - 0.5) * 0.22,
      alpha: Math.random() * 0.45 + 0.2,
      color: isBottom ? 'rgba(244, 63, 94, ' : Math.random() > 0.5 ? 'rgba(168, 85, 247, ' : 'rgba(56, 189, 248, ',
    })
  }
}

function render(now: number) {
  if (!isRunning || !canvasRef.value) return
  // Cap at ~50fps (20ms threshold) to prevent high CPU/battery draw on low-end systems
  if (now - lastTime < 20) {
    animId = requestAnimationFrame(render)
    return
  }
  lastTime = now

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true })
  if (!ctx) return
  const w = canvas.width
  const h = canvas.height
  ctx.clearRect(0, 0, w, h)

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]
    p.x += p.vx
    p.y += p.vy
    if (p.x < 0) p.x = w
    else if (p.x > w) p.x = 0
    if (p.y < 0) p.y = h
    else if (p.y > h) p.y = 0

    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fillStyle = `${p.color}${p.alpha})`
    ctx.fill()
  }

  animId = requestAnimationFrame(render)
}

function start() {
  if (isRunning || props.mode === 'off' || typeof document === 'undefined' || document.hidden) return
  // Respect system reduced-motion preference
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }
  isRunning = true
  lastTime = performance.now()
  animId = requestAnimationFrame(render)
}

function stop() {
  isRunning = false
  if (animId) {
    cancelAnimationFrame(animId)
    animId = 0
  }
}

function handleVisibility() {
  if (typeof document !== 'undefined' && document.hidden) stop()
  else start()
}

function handleResize() {
  if (resizeTimeout) clearTimeout(resizeTimeout)
  resizeTimeout = window.setTimeout(() => {
    if (!canvasRef.value) return
    canvasRef.value.width = window.innerWidth
    canvasRef.value.height = window.innerHeight
    initParticles(window.innerWidth, window.innerHeight)
  }, 100)
}

onMounted(() => {
  if (canvasRef.value) {
    canvasRef.value.width = window.innerWidth
    canvasRef.value.height = window.innerHeight
    initParticles(window.innerWidth, window.innerHeight)
  }
  start()
  window.addEventListener('resize', handleResize, { passive: true })
  document.addEventListener('visibilitychange', handleVisibility, { passive: true })
})

onUnmounted(() => {
  stop()
  if (resizeTimeout) clearTimeout(resizeTimeout)
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('visibilitychange', handleVisibility)
})

watch(() => [props.mode, props.density], () => {
  if (!canvasRef.value) return
  initParticles(canvasRef.value.width, canvasRef.value.height)
  if (props.mode === 'off') stop()
  else start()
})
</script>

<template>
  <!-- Pure transparent particle overlay without expensive full-screen backdrop filters -->
  <canvas
    v-if="props.mode !== 'off'"
    ref="canvasRef"
    class="pointer-events-none fixed inset-0 z-0 h-full w-full select-none"
  />
</template>

<!--
  CosmicCanvas background component providing GPU-efficient particle animations.
  Automatically pauses on tab visibility change to eliminate idle CPU and GPU consumption.
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
  if (props.mode === 'off') return
  const count = Math.floor((props.density / 100) * 45)

  for (let i = 0; i < count; i++) {
    const isBottom = props.mode === 'sakura-horizon' && Math.random() > 0.4
    particles.push({
      x: Math.random() * w,
      y: isBottom ? h - Math.random() * (h * 0.35) : Math.random() * h,
      size: Math.random() * 2.2 + 0.8,
      vx: (Math.random() - 0.5) * 0.25,
      vy: props.mode === 'starfield' ? -(Math.random() * 0.35 + 0.1) : (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.5 + 0.2,
      color: isBottom ? 'rgba(244, 63, 94, ' : Math.random() > 0.5 ? 'rgba(168, 85, 247, ' : 'rgba(56, 189, 248, ',
    })
  }
}

function render(now: number) {
  if (!isRunning || !canvasRef.value) return
  if (now - lastTime < 16) {
    animId = requestAnimationFrame(render)
    return
  }
  lastTime = now

  const ctx = canvasRef.value.getContext('2d')
  if (!ctx) return
  const w = canvasRef.value.width
  const h = canvasRef.value.height
  ctx.clearRect(0, 0, w, h)

  for (const p of particles) {
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
  if (isRunning || props.mode === 'off' || document.hidden) return
  isRunning = true
  lastTime = performance.now()
  animId = requestAnimationFrame(render)
}

function stop() {
  isRunning = false
  if (animId) cancelAnimationFrame(animId)
}

function handleVisibility() {
  if (document.hidden) stop()
  else start()
}

function handleResize() {
  if (!canvasRef.value) return
  canvasRef.value.width = window.innerWidth
  canvasRef.value.height = window.innerHeight
  initParticles(window.innerWidth, window.innerHeight)
}

onMounted(() => {
  handleResize()
  start()
  window.addEventListener('resize', handleResize, { passive: true })
  document.addEventListener('visibilitychange', handleVisibility)
})

onUnmounted(() => {
  stop()
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
  <canvas ref="canvasRef" class="pointer-events-none fixed inset-0 z-0 h-full w-full gpu-card" />
</template>

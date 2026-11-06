<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

type TimeBucket = 'morning' | 'afternoon' | 'evening' | 'night' | 'lateNight'

// Configurable greeting pools by time of day
// Use {name} for dynamic personalized insertion (about half use {name})
const GREETING_POOLS: Record<TimeBucket, { line1: string[]; line2: string[] }> = {
  morning: {
    line1: [
      'Morning, how are things?',
      'Rise and shine, {name}',
      'Coffee first, then code?',
      'Good morning, {name}',
      'A fresh start today',
    ],
    line2: [
      'What are we building today?',
      'Small steps still count, {name}.',
      'Take a deep breath and start fresh.',
      'Drink some water and conquer the day.',
    ],
  },
  afternoon: {
    line1: [
      "Afternoon, how's it going?",
      "Hey {name}, how's the day?",
      'Back at it?',
      'Good afternoon, {name}',
      'Making steady progress?',
    ],
    line2: [
      'Keep the momentum going.',
      "Don't forget to take a quick stretch, {name}.",
      "You're doing great.",
      'Halfway through, finish strong, {name}.',
    ],
  },
  evening: {
    line1: [
      'Evening, how are things?',
      'Good evening, {name}',
      'Winding down or leveling up?',
      'Hey {name}, wrap up or keep going?',
      'Golden hour energy',
    ],
    line2: [
      'Time to reflect on what you accomplished.',
      'Great work today, {name}.',
      "Relax a bit, you've earned it.",
      'Almost done with the day, {name}.',
    ],
  },
  night: {
    line1: [
      'Night owl mode?',
      'Still up, {name}?',
      'Burning the midnight oil?',
      'Evening vibes, {name}',
      'Quiet hours, deep focus',
    ],
    line2: [
      'Dim the lights and unwind.',
      'Quiet thoughts lead to great ideas, {name}.',
      'Save some energy for tomorrow.',
      'Still got some ideas brewing, {name}?',
    ],
  },
  lateNight: {
    line1: [
      'Night owl, huh?',
      "It's late, {name}",
      'The world is asleep, you are not',
      'Late night hustle, {name}',
      'Quiet hours, deep thoughts',
    ],
    line2: [
      "Don't forget to catch some sleep.",
      'Sleep helps code compile better, {name}.',
      'Taking care of yourself tonight?',
      'Rest up so you can bloom tomorrow, {name}.',
    ],
  },
}

function getTimeBucket(hours = new Date().getHours()): TimeBucket {
  if (hours >= 5 && hours <= 11) return 'morning'
  if (hours >= 12 && hours <= 16) return 'afternoon'
  if (hours >= 17 && hours <= 20) return 'evening'
  if (hours >= 21 && hours <= 23) return 'night'
  return 'lateNight'
}

function pickLine1(bucket: TimeBucket): string {
  const pool = GREETING_POOLS[bucket].line1
  if (pool.length <= 1) return pool[0]

  const storageKey = `tabloom_last_line1_${bucket}`
  const lastIndex = Number(localStorage.getItem(storageKey))
  let idx = Math.floor(Math.random() * pool.length)

  if (!isNaN(lastIndex) && idx === lastIndex) {
    idx = (idx + 1 + Math.floor(Math.random() * (pool.length - 1))) % pool.length
  }

  try {
    localStorage.setItem(storageKey, String(idx))
  } catch {}

  return pool[idx]
}

function pickLine2(bucket: TimeBucket): string {
  const pool = GREETING_POOLS[bucket].line2
  const idx = Math.floor(Math.random() * pool.length)
  return pool[idx]
}

const currentBucket = ref<TimeBucket>(getTimeBucket())
const rawLine1 = ref(pickLine1(currentBucket.value))
const rawLine2 = ref(pickLine2(currentBucket.value))
const userName = ref('User')

async function fetchUserName(): Promise<string> {
  if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
    try {
      const res = await new Promise<{ userName?: string }>((resolve) => {
        chrome.storage.sync.get(['userName'], resolve)
      })
      if (res && typeof res.userName === 'string' && res.userName.trim()) {
        return res.userName.trim().slice(0, 30)
      }
    } catch {}
  }
  const local = localStorage.getItem('userName')
  if (local && local.trim()) {
    return local.trim().slice(0, 30)
  }
  return 'User'
}

function updateName(val?: string) {
  userName.value = val && val.trim() ? val.trim().slice(0, 30) : 'User'
}

function checkBucket() {
  const newBucket = getTimeBucket()
  if (newBucket !== currentBucket.value) {
    currentBucket.value = newBucket
    rawLine1.value = pickLine1(newBucket)
    rawLine2.value = pickLine2(newBucket)
  }
}

const displayLine1 = computed(() => {
  return rawLine1.value.replace(/\{name\}/g, userName.value)
})

const displayLine2 = computed(() => {
  return rawLine2.value.replace(/\{name\}/g, userName.value)
})

let timer: number | undefined

function onCustomUserNameChanged(e: Event) {
  const detail = (e as CustomEvent<string>).detail
  updateName(detail)
}

function onStorageEvent(e: StorageEvent) {
  if (e.key === 'userName') {
    updateName(e.newValue || undefined)
  }
}

function onChromeStorageChanged(changes: { [key: string]: chrome.storage.StorageChange }, area: string) {
  if (area === 'sync' && changes.userName) {
    updateName(changes.userName.newValue as string | undefined)
  }
}

onMounted(async () => {
  userName.value = await fetchUserName()

  window.addEventListener('tabloom:userNameChanged', onCustomUserNameChanged)
  window.addEventListener('storage', onStorageEvent)

  if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener(onChromeStorageChanged)
  }

  timer = window.setInterval(checkBucket, 60000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  window.removeEventListener('tabloom:userNameChanged', onCustomUserNameChanged)
  window.removeEventListener('storage', onStorageEvent)
  if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
    chrome.storage.onChanged.removeListener(onChromeStorageChanged)
  }
})
</script>

<template>
  <div class="greeting-container relative z-10 flex min-h-[76px] flex-col items-center justify-center text-center px-4 pt-5 pb-1 select-none">
    <h1 class="font-serif font-light text-2xl sm:text-3xl md:text-4xl text-white/90 tracking-tight drop-shadow-sm">
      {{ displayLine1 }}
    </h1>
    <p class="mt-1.5 text-xs sm:text-sm text-white/50 tracking-wide font-normal">
      {{ displayLine2 }}
    </p>
  </div>
</template>

<style scoped>
.greeting-container {
  animation: greetingFade 250ms ease-out forwards;
}

@keyframes greetingFade {
  from {
    opacity: 0;
    transform: translateY(3px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

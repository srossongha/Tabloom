/**
 * Pure domain theme presets and color configurations.
 * Maps visual palettes for instant zero-latency theme switching.
 */
import type { ThemePreset } from './AppSettings'

export const PRESET_COLORS: Record<
  ThemePreset,
  { bgStart: string; bgEnd: string; tileBg: string; accent: string; text: string; mode: 'dark' | 'light' }
> = {
  // Dark Mode Presets
  'cosmic-purple': { bgStart: '#2b1055', bgEnd: '#090314', tileBg: 'rgba(43, 16, 85, 0.45)', accent: '#a855f7', text: '#ffffff', mode: 'dark' },
  'oled-black': { bgStart: '#000000', bgEnd: '#050505', tileBg: 'rgba(25, 25, 25, 0.75)', accent: '#38bdf8', text: '#ffffff', mode: 'dark' },
  'tokyo-night': { bgStart: '#1a1b26', bgEnd: '#0f0f17', tileBg: 'rgba(36, 40, 59, 0.65)', accent: '#7aa2f7', text: '#c0caf5', mode: 'dark' },
  'emerald-aurora': { bgStart: '#064e3b', bgEnd: '#022c22', tileBg: 'rgba(6, 78, 59, 0.55)', accent: '#10b981', text: '#ecfdf5', mode: 'dark' },
  'cyberpunk-neon': { bgStart: '#240046', bgEnd: '#10002b', tileBg: 'rgba(60, 9, 108, 0.6)', accent: '#f72585', text: '#ffffff', mode: 'dark' },
  'frosted-minimal': { bgStart: '#1e293b', bgEnd: '#0f172a', tileBg: 'rgba(51, 65, 85, 0.55)', accent: '#38bdf8', text: '#f8fafc', mode: 'dark' },

  // Light Mode Presets (High-contrast, luminous frosted cards, deep slate text)
  'cotton-white': { bgStart: '#ffffff', bgEnd: '#f1f5f9', tileBg: 'rgba(255, 255, 255, 0.78)', accent: '#059669', text: '#0f172a', mode: 'light' },
  'sakura-day': { bgStart: '#fff1f2', bgEnd: '#ffe4e6', tileBg: 'rgba(255, 255, 255, 0.82)', accent: '#e11d48', text: '#1e293b', mode: 'light' },
  'nordic-light': { bgStart: '#f0f9ff', bgEnd: '#e0f2fe', tileBg: 'rgba(255, 255, 255, 0.80)', accent: '#0284c7', text: '#0f172a', mode: 'light' },
  'cream-latte': { bgStart: '#fef3c7', bgEnd: '#fde68a', tileBg: 'rgba(255, 255, 255, 0.82)', accent: '#d97706', text: '#1c1917', mode: 'light' },
}


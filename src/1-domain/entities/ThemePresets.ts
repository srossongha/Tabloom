/**
 * Pure domain theme presets and color configurations.
 * Maps visual palettes for instant zero-latency theme switching.
 */
import type { ThemePreset } from './AppSettings'

export const PRESET_COLORS: Record<
  ThemePreset,
  { bgStart: string; bgEnd: string; tileBg: string; accent: string; text: string }
> = {
  'cosmic-purple': { bgStart: '#2b1055', bgEnd: '#090314', tileBg: 'rgba(43, 16, 85, 0.45)', accent: '#10b981', text: '#ffffff' },
  'oled-black': { bgStart: '#000000', bgEnd: '#050505', tileBg: 'rgba(25, 25, 25, 0.75)', accent: '#10b981', text: '#ffffff' },
  'tokyo-night': { bgStart: '#1a1b26', bgEnd: '#0f0f17', tileBg: 'rgba(36, 40, 59, 0.65)', accent: '#7aa2f7', text: '#c0caf5' },
  'emerald-aurora': { bgStart: '#064e3b', bgEnd: '#022c22', tileBg: 'rgba(6, 78, 59, 0.55)', accent: '#34d399', text: '#ecfdf5' },
  'cyberpunk-neon': { bgStart: '#240046', bgEnd: '#10002b', tileBg: 'rgba(60, 9, 108, 0.6)', accent: '#f72585', text: '#ffffff' },
  'frosted-minimal': { bgStart: '#1e293b', bgEnd: '#0f172a', tileBg: 'rgba(51, 65, 85, 0.55)', accent: '#38bdf8', text: '#f8fafc' },
}


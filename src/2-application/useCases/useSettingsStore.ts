/**
 * Composable store managing application settings, presets, and dynamic CSS variable injection.
 * Handles persistence, theme switching, import/export validation, and DOM root styling.
 */
import { ref } from 'vue'
import {
  DEFAULT_APP_SETTINGS,
  sanitizeAppSettings,
  type AppSettings,
  type ThemePreset,
  type SideWidgetId,
} from '../../1-domain/entities/AppSettings'
import { PRESET_COLORS } from '../../1-domain/entities/ThemePresets'
import type { IStoragePort } from '../../1-domain/ports/IStoragePort'
import { defaultStorageAdapter } from '../../3-infrastructure/storage/storageAdapter'
import { isColorBright, parseHexOrRgb } from '../services/colorUtils'

const SETTINGS_KEY = 'tabloom_app_settings'
const LEGACY_SETTINGS_KEY = 'home_tiles_app_settings'

function loadInitialSettings(): AppSettings {
  let raw = defaultStorageAdapter.getSync<any>(SETTINGS_KEY, null)
  if (!raw) {
    const legacy = defaultStorageAdapter.getSync<any>(LEGACY_SETTINGS_KEY, null)
    if (legacy) {
      raw = { ...legacy, openInNewTab: false }
    }
  }
  if (raw && raw.dataSourceMode === 'smart-blend') {
    raw.dataSourceMode = 'bookmarks-only'
  }
  if (raw && typeof raw === 'object' && !raw.userName) {
    try {
      const localName = localStorage.getItem('userName')
      if (localName) raw.userName = localName
    } catch {}
  }
  return sanitizeAppSettings(raw)
}

const settings = ref<AppSettings>(loadInitialSettings())
let storagePort: IStoragePort = defaultStorageAdapter

function applyCssVariables(cfg: AppSettings) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const accent = cfg.accentColor || '#10b981'
  const isBright = isColorBright(accent)
  const rgb = parseHexOrRgb(accent) || { r: 16, g: 185, b: 129 }

  root.style.setProperty('--bg-start', cfg.bgStart)
  root.style.setProperty('--bg-end', cfg.bgEnd)
  root.style.setProperty('--tile-bg', cfg.tileBg)
  root.style.setProperty('--accent', accent)
  root.style.setProperty('--accent-contrast', isBright ? '#0f172a' : '#ffffff')
  root.style.setProperty('--accent-glow', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.38)`)
  root.style.setProperty('--accent-15', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`)
  root.style.setProperty('--accent-20', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.20)`)
  root.style.setProperty('--accent-25', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`)
  root.style.setProperty('--accent-30', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.30)`)
  root.style.setProperty('--text-main', cfg.textColor)
  root.style.setProperty('--grid-cols', String(cfg.gridCols))
  root.style.setProperty('--tile-radius', `${cfg.tileRadius}px`)
  root.style.setProperty('--tile-gap', `${cfg.tileGap}px`)
  root.style.setProperty('--grid-padding', `${cfg.gridPadding ?? 24}px`)
  root.style.setProperty('--tile-padding', `${cfg.tilePadding ?? 16}px`)
  root.style.setProperty('--card-height', `${cfg.cardHeight}px`)
  root.style.setProperty('--card-opacity', String(cfg.cardOpacity / 100))
  root.setAttribute('data-tile-style', cfg.tileStyle || 'glassmorphic')
}

// Synchronous application on load to eliminate flash
if (typeof document !== 'undefined') applyCssVariables(settings.value)

// Real-time listener for cross-device/cross-tab sync updates
if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes) => {
    if (changes[SETTINGS_KEY]?.newValue) {
      const rawNew = changes[SETTINGS_KEY].newValue
      const newVal =
        rawNew && typeof rawNew === 'object' && '__tabloom_val' in rawNew
          ? rawNew.__tabloom_val
          : rawNew
      if (newVal && typeof newVal === 'object') {
        const obj = newVal as Record<string, unknown>
        // Never wipe out local-only wallpaper if cloud payload stripped it
        if (!obj.customWallpaper && settings.value.customWallpaper) {
          obj.customWallpaper = settings.value.customWallpaper
        }
        settings.value = sanitizeAppSettings(obj)
        applyCssVariables(settings.value)
      }
    }
  })
}

// Browser window storage event listener for instantaneous cross-tab updates (e.g. Cmd+T or multiple tabs)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === SETTINGS_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue)
        const val =
          parsed && typeof parsed === 'object' && '__tabloom_val' in parsed
            ? parsed.__tabloom_val
            : parsed
        if (val && typeof val === 'object') {
          const obj = val as Record<string, unknown>
          if (!obj.customWallpaper && settings.value.customWallpaper) {
            obj.customWallpaper = settings.value.customWallpaper
          }
          settings.value = sanitizeAppSettings(obj)
          applyCssVariables(settings.value)
        }
      } catch {}
    }
  })
}

export function useSettingsStore(storage?: IStoragePort) {
  if (storage) storagePort = storage

  async function init() {
    let raw = await storagePort.get<any>(SETTINGS_KEY, null)
    if (!raw) {
      const legacy = await storagePort.get<any>(LEGACY_SETTINGS_KEY, null)
      if (legacy) {
        raw = { ...legacy, openInNewTab: false }
        await storagePort.set(SETTINGS_KEY, raw)
      }
    }
    if (raw && raw.dataSourceMode === 'smart-blend') {
      raw.dataSourceMode = 'bookmarks-only'
      await storagePort.set(SETTINGS_KEY, raw)
    }
    if (raw && typeof raw === 'object' && !raw.userName) {
      try {
        const localName = localStorage.getItem('userName')
        if (localName) raw.userName = localName
      } catch {}
    }
    const sanitized = sanitizeAppSettings(raw ?? settings.value)
    // If local wallpaper exists, ensure customWallpaper is not accidentally blanked
    if (!sanitized.customWallpaper && settings.value.customWallpaper) {
      sanitized.customWallpaper = settings.value.customWallpaper
    }
    settings.value = sanitized
    applyCssVariables(settings.value)
  }

  async function updateSettings(partial: Partial<AppSettings>) {
    const merged = sanitizeAppSettings({ ...settings.value, ...partial })
    settings.value = merged
    applyCssVariables(settings.value)

    if (partial.userName !== undefined) {
      try {
        localStorage.setItem('userName', partial.userName)
      } catch {}
      if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
        try {
          chrome.storage.sync.set({ userName: partial.userName })
        } catch {}
      }
      window.dispatchEvent(
        new CustomEvent('tabloom:userNameChanged', { detail: partial.userName })
      )
    }

    await storagePort.set(SETTINGS_KEY, settings.value)
  }

  function applyThemePreset(preset: ThemePreset) {
    const p = PRESET_COLORS[preset]
    updateSettings({
      themePreset: preset,
      themeMode: p.mode,
      bgStart: p.bgStart,
      bgEnd: p.bgEnd,
      tileBg: p.tileBg,
      accentColor: p.accent,
      textColor: p.text,
      showCustomWallpaper: false,
    })
  }

  function exportConfigJson(): string {
    return JSON.stringify(settings.value, null, 2)
  }

  function importConfigJson(jsonText: string): boolean {
    try {
      const obj = JSON.parse(jsonText)
      const sanitized = sanitizeAppSettings(obj)
      updateSettings(sanitized)
      return true
    } catch {
      return false
    }
  }

  function resetDefaults() {
    updateSettings({ ...DEFAULT_APP_SETTINGS })
  }

  function unhideUrl(url: string) {
    const list = settings.value.hiddenUrls.filter((u) => u !== url)
    updateSettings({ hiddenUrls: list })
  }

  function clearHiddenUrls() {
    updateSettings({ hiddenUrls: [] })
  }

  function moveSideWidget(widgetId: SideWidgetId, direction: 'up' | 'down') {
    const list = [...(settings.value.sideWidgetsOrder || ['clock', 'calendar', 'notes'])]
    const idx = list.indexOf(widgetId)
    if (idx === -1) return
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= list.length) return
    const temp = list[idx]
    list[idx] = list[targetIdx]
    list[targetIdx] = temp
    updateSettings({ sideWidgetsOrder: list })
  }

  return {
    settings,
    init,
    updateSettings,
    moveSideWidget,
    applyThemePreset,
    exportConfigJson,
    importConfigJson,
    resetDefaults,
    unhideUrl,
    clearHiddenUrls,
  }
}

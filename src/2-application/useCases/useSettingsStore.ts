/**
 * Composable store managing application settings, presets, and dynamic CSS variable injection.
 * Handles persistence, theme switching, import/export validation, and DOM root styling.
 */
import { ref } from 'vue'
import {
  AppSettingsSchema,
  DEFAULT_APP_SETTINGS,
  type AppSettings,
  type ThemePreset,
} from '../../1-domain/entities/AppSettings'
import { PRESET_COLORS } from '../../1-domain/entities/ThemePresets'
import type { IStoragePort } from '../../1-domain/ports/IStoragePort'
import { defaultStorageAdapter } from '../../3-infrastructure/storage/storageAdapter'

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
  const parsed = AppSettingsSchema.safeParse(raw ?? DEFAULT_APP_SETTINGS)
  return parsed.success ? parsed.data : { ...DEFAULT_APP_SETTINGS }
}

const settings = ref<AppSettings>(loadInitialSettings())
let storagePort: IStoragePort = defaultStorageAdapter

function applyCssVariables(cfg: AppSettings) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.style.setProperty('--bg-start', cfg.bgStart)
  root.style.setProperty('--bg-end', cfg.bgEnd)
  root.style.setProperty('--tile-bg', cfg.tileBg)
  root.style.setProperty('--accent', cfg.accentColor)
  root.style.setProperty('--text-main', cfg.textColor)
  root.style.setProperty('--grid-cols', String(cfg.gridCols))
  root.style.setProperty('--tile-radius', `${cfg.tileRadius}px`)
  root.style.setProperty('--tile-gap', `${cfg.tileGap}px`)
  root.style.setProperty('--card-height', `${cfg.cardHeight}px`)
  root.style.setProperty('--card-opacity', String(cfg.cardOpacity / 100))
}

// Synchronous application on load to eliminate flash
if (typeof document !== 'undefined') applyCssVariables(settings.value)

// Real-time listener for cross-device/cross-tab sync updates
if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if ((area === 'sync' || area === 'local') && changes[SETTINGS_KEY]) {
      const parsed = AppSettingsSchema.safeParse(changes[SETTINGS_KEY].newValue)
      if (parsed.success) {
        settings.value = parsed.data
        applyCssVariables(settings.value)
      }
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
    const parsed = AppSettingsSchema.safeParse(raw ?? settings.value)
    if (parsed.success) {
      settings.value = parsed.data
      applyCssVariables(settings.value)
    }
  }

  async function updateSettings(partial: Partial<AppSettings>) {
    settings.value = { ...settings.value, ...partial }
    applyCssVariables(settings.value)
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
    })
  }

  function exportConfigJson(): string {
    return JSON.stringify(settings.value, null, 2)
  }

  function importConfigJson(jsonText: string): boolean {
    try {
      const obj = JSON.parse(jsonText)
      const parsed = AppSettingsSchema.safeParse(obj)
      if (parsed.success) {
        updateSettings(parsed.data)
        return true
      }
      return false
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

  return {
    settings,
    init,
    updateSettings,
    applyThemePreset,
    exportConfigJson,
    importConfigJson,
    resetDefaults,
    unhideUrl,
    clearHiddenUrls,
  }
}

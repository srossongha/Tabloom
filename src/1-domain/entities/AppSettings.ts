/**
 * Pure domain entity and Zod schema for application settings and appearance configurations.
 * Governs user preferences, themes, grid dimensions, and search providers.
 */
import { z } from 'zod'

export const ThemePresetSchema = z.enum([
  'cosmic-purple',
  'oled-black',
  'tokyo-night',
  'emerald-aurora',
  'cyberpunk-neon',
  'frosted-minimal',
  'cotton-white',
  'sakura-day',
  'nordic-light',
  'cream-latte',
]).catch('cosmic-purple')
export type ThemePreset = z.infer<typeof ThemePresetSchema>

export const ThemeModeSchema = z.enum(['dark', 'light', 'auto']).default('auto').catch('auto')
export type ThemeMode = z.infer<typeof ThemeModeSchema>

export const SearchEngineSchema = z.enum([
  'google',
  'duckduckgo',
  'brave',
  'youtube',
  'perplexity',
  'chatgpt',
]).default('google').catch('google')
export type SearchEngine = z.infer<typeof SearchEngineSchema>

export const ParticleModeSchema = z.enum(['off', 'cosmic-dust', 'sakura-horizon', 'starfield']).default('cosmic-dust').catch('cosmic-dust')
export type ParticleMode = z.infer<typeof ParticleModeSchema>

export const DataSourceModeSchema = z.enum([
  'bookmarks-only',
  'smart-blend',
  'history-only',
  'manual-only',
]).default('bookmarks-only').catch('bookmarks-only')
export type DataSourceMode = z.infer<typeof DataSourceModeSchema>

export const WallpaperTypeSchema = z.enum(['image', 'video', 'auto']).default('auto').catch('auto')
export type WallpaperType = z.infer<typeof WallpaperTypeSchema>

export const ClockThemeSchema = z.enum([
  'minimal',
  'digital-lcd',
  'digital-clean',
  'clock-tower',
]).default('digital-lcd').catch('digital-lcd')
export type ClockTheme = z.infer<typeof ClockThemeSchema>

export const SideWidgetIdSchema = z.enum(['clock', 'calendar', 'notes'])
export type SideWidgetId = z.infer<typeof SideWidgetIdSchema>

export const SideWidgetsLeftSchema = z.array(SideWidgetIdSchema).default(['clock', 'calendar']).catch(['clock', 'calendar'])
export const SideWidgetsRightSchema = z.array(SideWidgetIdSchema).default(['notes']).catch(['notes'])

export const SidePanelPositionSchema = z.enum(['left', 'right', 'both']).default('both').catch('both')
export type SidePanelPosition = z.infer<typeof SidePanelPositionSchema>

export const TileStyleSchema = z.enum([
  'glassmorphic',
  'minecraft-2d',
  'retro-pixel',
  'minimal-flat',
]).default('glassmorphic').catch('glassmorphic')
export type TileStyle = z.infer<typeof TileStyleSchema>

export const AppSettingsSchema = z.object({
  appName: z.string().default('Tabloom').catch('Tabloom'),
  appIcon: z.string().default('/icons/icon.svg').catch('/icons/icon.svg'),
  userName: z.string().default('User').catch('User'),
  themePreset: ThemePresetSchema.default('cosmic-purple'),
  themeMode: ThemeModeSchema,
  clockTheme: ClockThemeSchema,
  tileStyle: TileStyleSchema.default('glassmorphic'),
  bgStart: z.string().default('#2b1055').catch('#2b1055'),
  bgEnd: z.string().default('#090314').catch('#090314'),
  tileBg: z.string().default('rgba(43, 16, 85, 0.45)').catch('rgba(43, 16, 85, 0.45)'),
  accentColor: z.string().default('#10b981').catch('#10b981'),
  textColor: z.string().default('#ffffff').catch('#ffffff'),
  customWallpaper: z.string().default('').catch(''),
  wallpaperType: WallpaperTypeSchema,
  wallpaperBlur: z.number().min(0).max(24).default(0).catch(0),
  wallpaperDim: z.number().min(0).max(90).default(30).catch(30),
  backgroundAudio: z.string().default('').catch(''),
  backgroundAudioName: z.string().default('').catch(''),
  backgroundAudioVolume: z.number().min(0).max(100).default(50).catch(50),
  backgroundAudioAutoplay: z.boolean().default(false).catch(false),
  backgroundAudioLoop: z.boolean().default(true).catch(true),
  gridCols: z.number().min(2).max(10).default(6).catch(6),
  tileRadius: z.number().min(0).max(32).default(16).catch(16),
  tileGap: z.number().min(4).max(48).default(20).catch(20),
  gridPadding: z.number().min(0).max(64).default(24).catch(24),
  tilePadding: z.number().min(4).max(32).default(16).catch(16),
  cardHeight: z.number().min(70).max(220).default(120).catch(120),
  cardOpacity: z.number().min(10).max(100).default(65).catch(65),
  glassBlur: z.boolean().default(true).catch(true),
  showLogo: z.boolean().default(true).catch(true),
  showGreeting: z.boolean().default(true).catch(true),
  showSearch: z.boolean().default(true).catch(true),
  showSortBar: z.boolean().default(true).catch(true),
  showNavTabs: z.boolean().default(true).catch(true),
  showTileGrid: z.boolean().default(true).catch(true),
  showLabels: z.boolean().default(true).catch(true),
  showAddCard: z.boolean().default(true).catch(true),
  showSideClock: z.boolean().default(true).catch(true),
  showCalendar: z.boolean().default(true).catch(true),
  showYearProgress: z.boolean().default(true).catch(true),
  showStickyNote: z.boolean().default(true).catch(true),
  clockTimeOnly: z.boolean().default(false).catch(false),
  clockShowDate: z.boolean().default(true).catch(true),
  sideWidgetsLeft: SideWidgetsLeftSchema,
  sideWidgetsRight: SideWidgetsRightSchema,
  sidePanelPosition: SidePanelPositionSchema,
  sideWidgetsOrder: z.array(SideWidgetIdSchema).default(['clock', 'calendar', 'notes']).catch(['clock', 'calendar', 'notes']),
  showCustomWallpaper: z.boolean().default(true).catch(true),
  showAudioPlayer: z.boolean().default(true).catch(true),
  showScrollProgress: z.boolean().default(true).catch(true),
  clock24h: z.boolean().default(true).catch(true),
  particleMode: ParticleModeSchema.default('cosmic-dust'),
  particleDensity: z.number().min(10).max(100).default(40).catch(40),
  searchEngine: SearchEngineSchema.default('google'),
  openInNewTab: z.boolean().default(false).catch(false),
  dataSourceMode: DataSourceModeSchema.default('bookmarks-only'),
  bookmarkFolder: z.string().default('all').catch('all'),
  maxDiscoveredTiles: z.number().min(6).max(60).default(24).catch(24),
  hiddenUrls: z.array(z.string()).default([]).catch([]),
  activeView: z.enum(['bookmarks', 'frequent', 'recent', 'openTabs']).default('bookmarks').catch('bookmarks'),
  sortMode: z.enum(['default', 'name', 'mostUsed']).default('default').catch('default'),
}).passthrough()

export type AppSettings = z.infer<typeof AppSettingsSchema>

export const DEFAULT_APP_SETTINGS: AppSettings = AppSettingsSchema.parse({})

/**
 * Defensively sanitizes and merges raw settings data against the domain schema.
 * Guarantees that individual invalid fields never discard or reset valid user preferences.
 */
export function sanitizeAppSettings(raw: unknown): AppSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_APP_SETTINGS }
  }

  const rawObj = raw as Record<string, unknown>
  const result: Record<string, unknown> = { ...DEFAULT_APP_SETTINGS }

  // Field-by-field validation and fallback
  const shape = AppSettingsSchema.shape as Record<string, z.ZodTypeAny>
  const defaultMap = DEFAULT_APP_SETTINGS as Record<string, unknown>
  for (const key of Object.keys(shape)) {
    if (key in rawObj && rawObj[key] !== undefined && rawObj[key] !== null) {
      const fieldSchema = shape[key]
      if (fieldSchema) {
        const parseResult = fieldSchema.safeParse(rawObj[key])
        if (parseResult.success) {
          result[key] = parseResult.data
        } else {
          result[key] = defaultMap[key]
        }
      }
    }
  }

  // Preserve any extra custom attributes safely
  for (const [k, v] of Object.entries(rawObj)) {
    if (!(k in result) && v !== undefined && v !== null) {
      result[k] = v
    }
  }

  // Ensure all side widget IDs are present in sideWidgetsOrder
  const allSideIds: SideWidgetId[] = ['clock', 'calendar', 'notes']
  const currentOrder = Array.isArray(result.sideWidgetsOrder)
    ? (result.sideWidgetsOrder as SideWidgetId[])
    : allSideIds
  const validOrder = currentOrder.filter((id) => allSideIds.includes(id))
  for (const id of allSideIds) {
    if (!validOrder.includes(id)) {
      validOrder.push(id)
    }
  }
  result.sideWidgetsOrder = validOrder

  // Ensure every widget belongs to either left or right dock without duplicates
  let leftWidgets: SideWidgetId[] = Array.isArray(result.sideWidgetsLeft)
    ? (result.sideWidgetsLeft as SideWidgetId[]).filter((id) => allSideIds.includes(id))
    : []
  let rightWidgets: SideWidgetId[] = Array.isArray(result.sideWidgetsRight)
    ? (result.sideWidgetsRight as SideWidgetId[]).filter((id) => allSideIds.includes(id))
    : []

  // If both left and right are empty (e.g. legacy config)
  if (leftWidgets.length === 0 && rightWidgets.length === 0) {
    if (result.sidePanelPosition === 'right') {
      rightWidgets = [...validOrder]
    } else if (result.sidePanelPosition === 'left') {
      leftWidgets = [...validOrder]
    } else {
      leftWidgets = ['clock', 'calendar']
      rightWidgets = ['notes']
    }
  }

  // Deduplicate between left and right (left takes priority if duplicated)
  const seenWidgets = new Set<SideWidgetId>()
  leftWidgets = leftWidgets.filter((id) => {
    if (seenWidgets.has(id)) return false
    seenWidgets.add(id)
    return true
  })
  rightWidgets = rightWidgets.filter((id) => {
    if (seenWidgets.has(id)) return false
    seenWidgets.add(id)
    return true
  })

  // Ensure any missing widget is placed in left or right
  for (const id of allSideIds) {
    if (!seenWidgets.has(id)) {
      if (id === 'notes') {
        rightWidgets.push(id)
      } else {
        leftWidgets.push(id)
      }
      seenWidgets.add(id)
    }
  }

  result.sideWidgetsLeft = leftWidgets
  result.sideWidgetsRight = rightWidgets

  return result as AppSettings
}


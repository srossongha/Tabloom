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
])
export type ThemePreset = z.infer<typeof ThemePresetSchema>

export const SearchEngineSchema = z.enum([
  'google',
  'duckduckgo',
  'brave',
  'youtube',
  'perplexity',
  'chatgpt',
])
export type SearchEngine = z.infer<typeof SearchEngineSchema>

export const ParticleModeSchema = z.enum(['off', 'cosmic-dust', 'sakura-horizon', 'starfield'])
export type ParticleMode = z.infer<typeof ParticleModeSchema>

export const DataSourceModeSchema = z.enum([
  'smart-blend',
  'bookmarks-only',
  'history-only',
  'manual-only',
])
export type DataSourceMode = z.infer<typeof DataSourceModeSchema>

export const AppSettingsSchema = z.object({
  appName: z.string().default('Tabloom'),
  themePreset: ThemePresetSchema.default('cosmic-purple'),
  bgStart: z.string().default('#2b1055'),
  bgEnd: z.string().default('#090314'),
  tileBg: z.string().default('rgba(43, 16, 85, 0.45)'),
  accentColor: z.string().default('#10b981'),
  textColor: z.string().default('#ffffff'),
  customWallpaper: z.string().default(''),
  wallpaperBlur: z.number().min(0).max(24).default(0),
  wallpaperDim: z.number().min(0).max(90).default(30),
  gridCols: z.number().min(3).max(10).default(6),
  tileRadius: z.number().min(0).max(32).default(16),
  tileGap: z.number().min(8).max(36).default(20),
  cardHeight: z.number().min(80).max(180).default(120),
  cardOpacity: z.number().min(10).max(100).default(65),
  glassBlur: z.boolean().default(true),
  showLogo: z.boolean().default(true),
  showSearch: z.boolean().default(true),
  showSortBar: z.boolean().default(true),
  showLabels: z.boolean().default(true),
  showAddCard: z.boolean().default(true),
  particleMode: ParticleModeSchema.default('cosmic-dust'),
  particleDensity: z.number().min(10).max(100).default(40),
  searchEngine: SearchEngineSchema.default('google'),
  openInNewTab: z.boolean().default(false),
  dataSourceMode: DataSourceModeSchema.default('smart-blend'),
  bookmarkFolder: z.string().default('all'),
  maxDiscoveredTiles: z.number().min(6).max(60).default(24),
  hiddenUrls: z.array(z.string()).default([]),
})

export type AppSettings = z.infer<typeof AppSettingsSchema>

export const DEFAULT_APP_SETTINGS: AppSettings = AppSettingsSchema.parse({})


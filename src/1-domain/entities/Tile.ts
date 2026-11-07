/**
 * Pure domain entity and Zod schema for Tabloom.
 * Defines the structure, validation, and serialization rules for individual tiles.
 */
import { z } from 'zod'

export const TileSourceSchema = z.enum(['history', 'bookmark', 'topSite', 'custom'])
export type TileSource = z.infer<typeof TileSourceSchema>

export const IconModeSchema = z.enum(['auto', 'custom-url', 'upload', 'monogram'])
export type IconMode = z.infer<typeof IconModeSchema>

export const TileDisplayModeSchema = z.enum(['icon', 'full-cover']).default('icon')
export type TileDisplayMode = z.infer<typeof TileDisplayModeSchema>

export const TileSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  url: z.string(),
  iconMode: IconModeSchema.default('auto'),
  displayMode: TileDisplayModeSchema.default('icon').optional(),
  customIcon: z.string().optional(),
  tintColor: z.string().optional(),
  pinned: z.boolean().default(false),
  useCount: z.number().int().nonnegative().default(0),
  lastUsedAt: z.number().int().nonnegative().default(0),
  order: z.number().int().default(0),
  source: TileSourceSchema.default('custom'),
  tabId: z.number().optional(),
  windowId: z.number().optional(),
  sessionId: z.string().optional(),
})

export type Tile = z.infer<typeof TileSchema>

export interface TileOverride {
  title?: string
  url?: string
  iconMode?: IconMode
  displayMode?: TileDisplayMode
  customIcon?: string
  tintColor?: string
  pinned?: boolean
  order?: number
}


/**
/**
 * Tab icon presets and helpers for custom browser tab branding.
 * Provides self-contained SVG data URIs that work offline in browser extensions.
 */

export interface TabIconPreset {
  id: string
  name: string
  category: 'default' | 'disguise' | 'minimal' | 'aesthetic'
  iconUrl: string
  suggestedName?: string
}

// Crisp inline SVGs encoded as Data URIs for offline, zero-network instant rendering
const GOOGLE_G_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
</svg>`)

const GITHUB_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffffff">
  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
</svg>`)

const NOTION_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="20" fill="#000000"/>
  <path fill="#ffffff" d="M26.5 25.5c3.2.3 5.4.3 8.3 0l27.8 38.3V29.2c0-3.3-1.8-4.2-6.5-4.5l-2.4-.2v-3.5h20.6v3.5l-2.8.2c-4.4.4-5.9 1.5-5.9 4.8v47.5h-5.2L49.8 44.5v32.2c0 3.7 2 4.4 7.2 4.7l2.8.2v3.5H38.5v-3.5l2.7-.2c4.8-.4 6-1.5 6-4.9V37.7L31 29.5c-3.1 4.5-4.5 12.3-4.5 22.8 0 14.2 3.4 20.3 8.2 24.5l-2.5 3.3C24.5 73.5 20 63.8 20 50.8c0-14.7 4.5-23.7 6.5-25.3z"/>
</svg>`)

const MINECRAFT_GRASS_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">
  <rect width="16" height="16" fill="#866043"/>
  <rect y="0" width="16" height="5" fill="#5b8c32"/>
  <rect x="2" y="5" width="2" height="2" fill="#5b8c32"/>
  <rect x="6" y="5" width="3" height="3" fill="#5b8c32"/>
  <rect x="11" y="5" width="2" height="2" fill="#5b8c32"/>
  <rect x="14" y="5" width="2" height="1" fill="#5b8c32"/>
  <rect x="0" y="0" width="16" height="2" fill="#71a742"/>
  <rect x="3" y="2" width="2" height="1" fill="#476e27"/>
  <rect x="9" y="2" width="3" height="1" fill="#476e27"/>
  <rect x="2" y="9" width="2" height="2" fill="#5c3f28"/>
  <rect x="7" y="11" width="2" height="2" fill="#5c3f28"/>
  <rect x="12" y="8" width="2" height="2" fill="#5c3f28"/>
  <rect x="4" y="13" width="2" height="1" fill="#a07452"/>
  <rect x="10" y="13" width="2" height="1" fill="#a07452"/>
</svg>`)

const LEAF_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
</svg>`)

const SPARKLES_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
  <path d="M5 3v4"/>
  <path d="M19 17v4"/>
  <path d="M3 5h4"/>
  <path d="M17 19h4"/>
</svg>`)

const TERMINAL_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="4 17 10 11 4 5"/>
  <line x1="12" x2="20" y1="19" y2="19"/>
</svg>`)

const COMPASS_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"/>
  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
</svg>`)

const COFFEE_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#fb923c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M10 2v2"/>
  <path d="M14 2v2"/>
  <path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h12Z"/>
  <path d="M6 2v2"/>
  <path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/>
</svg>`)

export const TAB_ICON_PRESETS: TabIconPreset[] = [
  {
    id: 'tabloom',
    name: 'Tabloom Flower',
    category: 'default',
    iconUrl: '/icons/icon.svg',
    suggestedName: 'Tabloom',
  },
  {
    id: 'google',
    name: 'Google',
    category: 'disguise',
    iconUrl: GOOGLE_G_SVG,
    suggestedName: 'Google',
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'disguise',
    iconUrl: GITHUB_SVG,
    suggestedName: 'GitHub',
  },
  {
    id: 'notion',
    name: 'Notion',
    category: 'disguise',
    iconUrl: NOTION_SVG,
    suggestedName: 'Notion',
  },
  {
    id: 'minecraft',
    name: 'Minecraft Block',
    category: 'aesthetic',
    iconUrl: MINECRAFT_GRASS_SVG,
    suggestedName: 'Minecraft Home',
  },
  {
    id: 'leaf',
    name: 'Minimal Leaf',
    category: 'minimal',
    iconUrl: LEAF_SVG,
    suggestedName: 'Calm Sanctuary',
  },
  {
    id: 'sparkles',
    name: 'Sparkles',
    category: 'aesthetic',
    iconUrl: SPARKLES_SVG,
    suggestedName: 'Dreamspace',
  },
  {
    id: 'terminal',
    name: 'Terminal',
    category: 'disguise',
    iconUrl: TERMINAL_SVG,
    suggestedName: 'Terminal',
  },
  {
    id: 'compass',
    name: 'Compass',
    category: 'minimal',
    iconUrl: COMPASS_SVG,
    suggestedName: 'Explorer',
  },
  {
    id: 'coffee',
    name: 'Warm Coffee',
    category: 'aesthetic',
    iconUrl: COFFEE_SVG,
    suggestedName: 'Coffee & Code',
  },
]

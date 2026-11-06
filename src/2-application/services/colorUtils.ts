/**
 * Color and luminance utilities for dynamic theme contrast and automatic dark/light mode switching.
 */

export function parseHexOrRgb(color: string): { r: number; g: number; b: number } | null {
  if (!color) return null
  const trimmed = color.trim()
  if (trimmed.startsWith('#')) {
    let hex = trimmed.slice(1)
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('')
    }
    if (hex.length >= 6) {
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16),
      }
    }
  }
  const rgbMatch = trimmed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    }
  }
  return null
}

export function getRelativeLuminance(color: string): number {
  const rgb = parseHexOrRgb(color)
  if (!rgb) return 0
  // Standard ITU-R BT.601 relative luminance formula
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
}

export function isColorBright(color: string): boolean {
  return getRelativeLuminance(color) > 0.58
}

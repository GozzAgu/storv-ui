/** Deterministic visual identity for storefront items without photos. */

const PLACEHOLDER_PALETTES = [
  { from: '#1a1523', to: '#3d3550', ink: '#f4f1ea' },
  { from: '#143f8d', to: '#2a5fad', ink: '#eef3fb' },
  { from: '#0f5c4c', to: '#1a7a66', ink: '#e8f6f1' },
  { from: '#7a3e12', to: '#a85a22', ink: '#fff4e8' },
  { from: '#4a1d4e', to: '#6e3a72', ink: '#f8eef9' },
  { from: '#1e3a4c', to: '#2f5a6e', ink: '#eaf3f7' },
  { from: '#5c1f2e', to: '#8a3348', ink: '#fceef1' },
  { from: '#2f3d1f', to: '#4d6433', ink: '#f0f5e8' },
] as const

export type StorefrontPlaceholderPalette = (typeof PLACEHOLDER_PALETTES)[number]

function hashString(input: string): number {
  let hash = 0
  const s = String(input || '')
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0
  }
  return hash
}

/**
 * Leaf category for placeholders: subcategory when nested, else top-level category.
 * Prefers `categoryName`; falls back to the last segment of `categoryPath`.
 */
export function storefrontCategoryLabel(
  categoryName?: string | null,
  categoryPath?: string | null
): string {
  const name = String(categoryName || '').trim()
  if (name) return name
  const path = String(categoryPath || '').trim()
  if (!path) return ''
  const parts = path
    .split('/')
    .map((p) => p.trim())
    .filter(Boolean)
  return parts[parts.length - 1] || parts[0] || ''
}

export function storefrontPlaceholderPalette(
  seed: string
): StorefrontPlaceholderPalette {
  const idx = hashString(seed || 'item') % PLACEHOLDER_PALETTES.length
  return PLACEHOLDER_PALETTES[idx]
}

export function storefrontPlaceholderStyle(seed: string): Record<string, string> {
  const palette = storefrontPlaceholderPalette(seed)
  return {
    backgroundImage: `linear-gradient(145deg, ${palette.from} 0%, ${palette.to} 100%)`,
    color: palette.ink,
  }
}

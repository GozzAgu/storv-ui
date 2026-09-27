/**
 * Width-based layout tiers for the iOS shell. Tiers follow the window width, not the
 * device model, so iPad Split View / Stage Manager windows get the layout that fits.
 */
export type IosSizeTier =
  | 'phone-sm'
  | 'phone'
  | 'phone-lg'
  | 'tablet-sm'
  | 'tablet'
  | 'tablet-lg'

export const IOS_SIZE_TIERS: readonly IosSizeTier[] = [
  'phone-sm',
  'phone',
  'phone-lg',
  'tablet-sm',
  'tablet',
  'tablet-lg',
]

export function resolveIosSizeTier(width: number): IosSizeTier {
  if (width < 375) return 'phone-sm'
  if (width < 430) return 'phone'
  if (width < 744) return 'phone-lg'
  if (width < 834) return 'tablet-sm'
  if (width < 1024) return 'tablet'
  return 'tablet-lg'
}

export function isTabletTier(tier: IosSizeTier): boolean {
  return tier.startsWith('tablet')
}

const TIER_CLASSES = IOS_SIZE_TIERS.map((tier) => `ios-size-${tier}`)

export function applyIosSizeTier(): IosSizeTier {
  const tier = resolveIosSizeTier(window.innerWidth)
  const html = document.documentElement
  const tierClass = `ios-size-${tier}`
  if (!html.classList.contains(tierClass)) {
    html.classList.remove(...TIER_CLASSES)
    html.classList.add(tierClass)
  }
  html.classList.toggle('capacitor-ipad', isTabletTier(tier))
  html.classList.toggle('ios-landscape', window.innerWidth > window.innerHeight)
  return tier
}

let listening = false

export function startIosSizeTierTracking(onChange?: (tier: IosSizeTier) => void): void {
  if (typeof window === 'undefined' || listening) return
  listening = true
  let frame = 0
  const update = () => {
    frame = 0
    const tier = applyIosSizeTier()
    onChange?.(tier)
  }
  update()
  window.addEventListener('resize', () => {
    if (!frame) frame = requestAnimationFrame(update)
  })
  window.addEventListener('orientationchange', update)
}

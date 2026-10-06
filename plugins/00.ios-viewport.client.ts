/**
 * iOS (Safari and the Capacitor app) zooms the page into any focused field whose text is
 * under 16px. `maximum-scale=1` stops that; Safari still allows pinch-zoom for accessibility.
 * Limited to iOS because on Android it would disable pinch-zoom, and Android doesn't
 * zoom on focus anyway.
 */
export default defineNuxtPlugin(() => {
  const ua = navigator.userAgent
  const isIOS =
    /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  if (!isIOS) return

  useHead({
    meta: [
      {
        name: 'viewport',
        content:
          'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, interactive-widget=overlays-content',
      },
    ],
  })
})

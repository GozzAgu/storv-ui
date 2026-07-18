import { isDemoRoutePath } from '~/utils/demo-mode'

/**
 * Resolves dashboard URLs for both production (`/dashboard`) and demo (`/demo/dashboard`) shells.
 */
export function useDashboardPaths() {
  const route = useRoute()

  const isDemoDashboard = computed(() => isDemoRoutePath(route.path))

  const basePath = computed(() => (isDemoDashboard.value ? '/demo/dashboard' : '/dashboard'))

  function dashPath(subpath = ''): string {
    const base = basePath.value
    if (!subpath) return base
    let suffix = subpath
    if (suffix.startsWith('/dashboard')) {
      suffix = suffix.slice('/dashboard'.length) || ''
    }
    if (!suffix.startsWith('/')) suffix = `/${suffix}`
    return suffix === '/' ? base : `${base}${suffix}`
  }

  function matchesDashboardPath(path: string, segment: string): boolean {
    const normalized = segment.startsWith('/') ? segment : `/${segment}`
    return (
      path === `${basePath.value}${normalized}` ||
      path.startsWith(`${basePath.value}${normalized}/`)
    )
  }

  return {
    basePath,
    isDemoDashboard,
    dashPath,
    matchesDashboardPath,
  }
}

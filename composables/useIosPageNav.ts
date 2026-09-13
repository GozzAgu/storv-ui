import { ref, readonly } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

export type IosPageNavState = {
  title: string
  showBack: boolean
  backTo: RouteLocationRaw | null
  backLabel: string
  fallbackTo: RouteLocationRaw
  hasTrailing: boolean
}

const title = ref('')
const showBack = ref(false)
const backTo = ref<RouteLocationRaw | null>(null)
const backLabel = ref('Back')
const fallbackTo = ref<RouteLocationRaw>('/dashboard')
const hasTrailing = ref(false)
let ownerId = 0
let activeOwner = 0

/**
 * Shared iOS page title chrome. Pages register via IosPageNavBar;
 * the dashboard layout renders the title inside the fixed global top bar.
 */
export function useIosPageNav() {
  function setPageNav(
    options: Partial<IosPageNavState> & { title: string },
    owner?: number
  ): number {
    const nextOwner = owner && owner > 0 ? owner : ++ownerId
    activeOwner = nextOwner
    title.value = options.title
    showBack.value = options.showBack === true
    backTo.value = options.backTo ?? null
    backLabel.value = options.backLabel ?? 'Back'
    fallbackTo.value = options.fallbackTo ?? '/dashboard'
    hasTrailing.value = options.hasTrailing === true
    return nextOwner
  }

  function clearPageNav(owner?: number) {
    if (owner != null && owner !== activeOwner) return
    title.value = ''
    showBack.value = false
    backTo.value = null
    backLabel.value = 'Back'
    fallbackTo.value = '/dashboard'
    hasTrailing.value = false
    if (owner == null || owner === activeOwner) {
      activeOwner = 0
    }
  }

  return {
    title: readonly(title),
    showBack: readonly(showBack),
    backTo: readonly(backTo),
    backLabel: readonly(backLabel),
    fallbackTo: readonly(fallbackTo),
    hasTrailing: readonly(hasTrailing),
    setPageNav,
    clearPageNav,
  }
}

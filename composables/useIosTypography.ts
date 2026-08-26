import { computed } from 'vue'
import {
  IOS_TYPOGRAPHY_CLASS,
  IOS_TYPOGRAPHY_ROLES,
  IOS_TYPOGRAPHY_TABULAR_CLASS,
  type IosTypographyRole,
} from '~/types/ios-typography'
import { useIsCapacitorIos } from '~/composables/useNativeTableLayout'

export type IosTextClassOptions = {
  /** Apply tabular numerals (currency, counts). */
  tabular?: boolean
  /** Muted secondary label color (meta, captions). */
  secondary?: boolean
}

/** Pure helper - safe to unit test without Nuxt runtime. */
export function buildIosTextClass(
  role: IosTypographyRole,
  options?: IosTextClassOptions
): string {
  const parts = [IOS_TYPOGRAPHY_CLASS[role]]
  if (options?.tabular) parts.push(IOS_TYPOGRAPHY_TABULAR_CLASS)
  if (options?.secondary) parts.push('ios-type-secondary')
  return parts.join(' ')
}

/**
 * Central iOS typography API. Returns scoped class names; styles apply only on
 * html.capacitor-ios.capacitor-native (see assets/css/ios-typography.css).
 */
export function useIosTypography() {
  const { isCapacitorIos } = useIsCapacitorIos()

  const isActive = computed(() => isCapacitorIos.value)

  function textClass(role: IosTypographyRole, options?: IosTextClassOptions): string {
    return buildIosTextClass(role, options)
  }

  /** Prefer iOS token on native; optional web fallback Tailwind class. */
  function textClassOr(
    role: IosTypographyRole,
    webFallback: string,
    options?: IosTextClassOptions
  ): string {
    if (isCapacitorIos.value) return textClass(role, options)
    return webFallback
  }

  const roles = computed(() => {
    const map = {} as Record<IosTypographyRole, string>
    for (const role of IOS_TYPOGRAPHY_ROLES) {
      map[role] = IOS_TYPOGRAPHY_CLASS[role]
    }
    return map
  })

  return {
    isActive,
    textClass,
    textClassOr,
    roles,
    tabularClass: IOS_TYPOGRAPHY_TABULAR_CLASS,
    secondaryClass: 'ios-type-secondary',
    inputClass: 'text-ios-input',
    /** All role → class mappings for reference / Storybook. */
    classMap: IOS_TYPOGRAPHY_CLASS,
  }
}

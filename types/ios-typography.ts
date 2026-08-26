/**
 * Storvv iOS typography roles — Apple semantic scale.
 * Use via `useIosTypography()`; styles apply only under html.capacitor-ios.capacitor-native.
 * @see assets/css/ios-typography.css
 */

export const IOS_TYPOGRAPHY_ROLES = [
  'display',
  'large-title',
  'title',
  'title2',
  'title3',
  'headline',
  'body',
  'body-emphasized',
  'callout',
  'subheadline',
  'footnote',
  'caption',
  'caption2',
] as const

export type IosTypographyRole = (typeof IOS_TYPOGRAPHY_ROLES)[number]

/** Maps each role to its scoped utility class (inactive on web until capacitor-ios). */
export const IOS_TYPOGRAPHY_CLASS: Record<IosTypographyRole, string> = {
  display: 'text-ios-display',
  'large-title': 'text-ios-large-title',
  title: 'text-ios-title',
  title2: 'text-ios-title2',
  title3: 'text-ios-title3',
  headline: 'text-ios-headline',
  body: 'text-ios-body',
  'body-emphasized': 'text-ios-body-emphasized',
  callout: 'text-ios-callout',
  subheadline: 'text-ios-subheadline',
  footnote: 'text-ios-footnote',
  caption: 'text-ios-caption',
  caption2: 'text-ios-caption2',
}

/** Tabular numerals for currency, counts, and stat values. */
export const IOS_TYPOGRAPHY_TABULAR_CLASS = 'ios-type-tabular'

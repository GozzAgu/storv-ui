/**
 * Adaptive business experience (Solo vs Business).
 *
 * Layered with subscription plan gates and usePermissions(); never replaces them.
 * Missing configuration must behave exactly like pre-adaptive Storvv (business mode).
 */

export type ExperienceMode = 'solo' | 'business'

/**
 * Product-complexity capabilities (UI / workflow simplification).
 * Subscription and role checks still apply separately.
 */
export type BusinessCapability =
  | 'staffManagement'
  | 'multiLocationAdmin'
  | 'rolesPermissionsAdmin'
  | 'approvalWorkflows'
  | 'paymentLinks'

export const BUSINESS_CAPABILITIES: BusinessCapability[] = [
  'staffManagement',
  'multiLocationAdmin',
  'rolesPermissionsAdmin',
  'approvalWorkflows',
  'paymentLinks',
]

export const EXPERIENCE_MODE_LABELS: Record<ExperienceMode, string> = {
  solo: 'Just me',
  business: 'Growing business',
}

export const BUSINESS_CAPABILITY_LABELS: Record<BusinessCapability, string> = {
  staffManagement: 'Team & staff management',
  multiLocationAdmin: 'Multi-location administration',
  rolesPermissionsAdmin: 'Roles & permissions administration',
  approvalWorkflows: 'Approval workflows',
  paymentLinks: 'Payment links',
}

/** Read-time default for legacy accounts and invalid values. */
export const DEFAULT_EXPERIENCE_MODE: ExperienceMode = 'business'

export interface BusinessExperienceConfig {
  experienceMode?: ExperienceMode | string | null
  enabledCapabilities?: BusinessCapability[] | string[] | null
  onboardingExperienceChosen?: boolean
}

/** Normalize persisted or legacy values. Unknown values → business (safe default). */
export function normalizeExperienceMode(raw: unknown): ExperienceMode {
  if (raw === 'solo') return 'solo'
  if (raw === 'business') return 'business'
  // Future/legacy aliases (e.g. "team") must not simplify existing accounts.
  return DEFAULT_EXPERIENCE_MODE
}

export function resolveExperienceMode(
  config?: BusinessExperienceConfig | null
): ExperienceMode {
  return normalizeExperienceMode(config?.experienceMode)
}

function isBusinessCapability(value: string): value is BusinessCapability {
  return (BUSINESS_CAPABILITIES as readonly string[]).includes(value)
}

/** Progressive unlock list. Only known capability keys are honoured. */
export function normalizeEnabledCapabilities(
  raw: BusinessExperienceConfig['enabledCapabilities']
): BusinessCapability[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((entry): entry is BusinessCapability => {
    return typeof entry === 'string' && isBusinessCapability(entry)
  })
}

/**
 * Default capability availability per experience mode.
 * Business: full Storvv complexity (current behaviour).
 * Solo: hides admin/team complexity and payment links; other commerce features stay available.
 */
export function getDefaultCapabilitiesForMode(
  mode: ExperienceMode
): Record<BusinessCapability, boolean> {
  if (mode === 'business') {
    return {
      staffManagement: true,
      multiLocationAdmin: true,
      rolesPermissionsAdmin: true,
      approvalWorkflows: true,
      paymentLinks: true,
    }
  }
  return {
    staffManagement: false,
    multiLocationAdmin: false,
    rolesPermissionsAdmin: false,
    approvalWorkflows: false,
    paymentLinks: false,
  }
}

export interface BusinessCapabilityContext {
  experienceMode: ExperienceMode
  enabledCapabilities?: BusinessCapability[] | null
}

/**
 * Whether the business experience allows a product-complexity capability.
 * Does not check subscription plan or user role. Compose those at call sites.
 */
export function canUseBusinessCapability(
  capability: BusinessCapability,
  context: BusinessCapabilityContext
): boolean {
  const enabled = normalizeEnabledCapabilities(context.enabledCapabilities)
  if (enabled.includes(capability)) return true
  return getDefaultCapabilitiesForMode(context.experienceMode)[capability]
}

export function buildBusinessCapabilityContext(
  config?: BusinessExperienceConfig | null
): BusinessCapabilityContext {
  return {
    experienceMode: resolveExperienceMode(config),
    enabledCapabilities: normalizeEnabledCapabilities(config?.enabledCapabilities),
  }
}

import { trialEndsAtMs } from '~/types/subscription'

/**
 * Owner uid for a hierarchical staff doc:
 * users/{ownerId}/stores/{storeId}/departments/{deptId}/staff/{staffId}.
 * Returns null for any other shape (e.g. the legacy top-level `staff` collection).
 */
export function resolveStaffWorkspaceOwnerId(staffDocPath: string): string | null {
  const parts = staffDocPath.split('/')
  if (
    parts.length !== 8 ||
    parts[0] !== 'users' ||
    parts[2] !== 'stores' ||
    parts[4] !== 'departments' ||
    parts[6] !== 'staff' ||
    !parts[1]
  ) {
    return null
  }
  return parts[1]
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

/** Staff get the trial end as a string so it survives JSON. */
function trialEndsAtIso(value: unknown): string | undefined {
  const ms = trialEndsAtMs(value)
  return ms === null ? undefined : new Date(ms).toISOString()
}

/**
 * The only owner-doc fields staff may inherit. Allowlist: the owner doc also holds billing
 * references and (on older accounts) a legacy 2FA secret, which must never reach staff.
 */
export function pickOwnerWorkspaceFields(data: Record<string, unknown>) {
  return {
    name: optionalString(data.name),
    subscription: optionalString(data.subscription) || 'storvv_micro',
    subscriptionBillingCycle: optionalString(data.subscriptionBillingCycle),
    subscriptionStatus: optionalString(data.subscriptionStatus),
    subscriptionCurrentPeriodEnd: optionalString(data.subscriptionCurrentPeriodEnd),
    trialEndsAt: trialEndsAtIso(data.trialEndsAt),
    preferences: data.preferences ?? undefined,
    storeDetails: data.storeDetails ?? undefined,
    storeLogoUrl: optionalString(data.storeLogoUrl),
  }
}

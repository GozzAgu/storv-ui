/** Plan-gated feature copy: owners see upgrade paths; staff see neutral text. */
export function planGateMessage(
  isStaff: boolean,
  ownerMessage: string,
  staffMessage = 'This feature is not enabled for your workspace.'
): string {
  return isStaff ? staffMessage : ownerMessage
}

/** Strip upgrade CTAs from API errors shown to staff. */
export function sanitizePlanGateErrorForStaff(message: string, isStaff: boolean): string {
  if (!isStaff) return message
  if (/upgrade|settings\?upgrade/i.test(message)) {
    return 'This feature is not enabled for your workspace.'
  }
  return message
}

export function whatsAppLimitMessage(
  count: number,
  limit: number,
  options?: { forStaff?: boolean; plan?: string }
): string {
  const base = `Monthly WhatsApp limit reached (${count}/${limit}). It resets on the 1st.`
  if (options?.forStaff) {
    // No "upgrade" here: staff errors mentioning it are replaced by a generic line.
    return `${base} This workspace has reached its messaging limit; the account owner can raise it.`
  }
  return options?.plan === 'storvv_medium'
    ? `${base} Upgrade to Storvv Enterprise for unlimited sends.`
    : `${base} Upgrade to Storvv Medium for 50 sends a month, or Enterprise for unlimited.`
}

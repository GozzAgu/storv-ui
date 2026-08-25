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
  options?: { forStaff?: boolean }
): string {
  const base = `Monthly send limit reached (${count}/${limit}).`
  if (options?.forStaff) {
    return `${base} This workspace has reached its messaging limit.`
  }
  return `${base} Upgrade to Storvv Medium for unlimited sends.`
}

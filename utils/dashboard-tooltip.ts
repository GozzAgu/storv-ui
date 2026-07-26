/**
 * Opt-in dashboard tooltip text. Returns undefined when empty so bindings stay off the DOM.
 */
export function dashboardTooltip(text: string | null | undefined): string | undefined {
  const value = text?.trim()
  return value || undefined
}

/**
 * Show full branch name only when the compact nav label differs (e.g. PHC vs "Port Harcourt, GRA").
 */
export function storeBranchNavTooltip(
  branchName: string | null | undefined,
  compactLabel: string
): string | undefined {
  const full = branchName?.trim()
  if (!full || full === compactLabel) return undefined
  return full
}

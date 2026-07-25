/** Dismiss the keyboard when closing native overlays. */
export function blurActiveElementIfNative(native: boolean): void {
  if (!native || !import.meta.client) return
  const active = document.activeElement
  if (active instanceof HTMLElement) {
    active.blur()
  }
}

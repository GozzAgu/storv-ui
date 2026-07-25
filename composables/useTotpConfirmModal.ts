/** Shared promise-based TOTP confirmation modal state. */
export function useTotpConfirmModal() {
  const open = ref(false)
  let resolver: ((code: string | null) => void) | null = null

  function prompt(): Promise<string | null> {
    return new Promise((resolve) => {
      resolver = resolve
      open.value = true
    })
  }

  function confirm(code: string) {
    open.value = false
    resolver?.(code)
    resolver = null
  }

  function cancel() {
    open.value = false
    resolver?.(null)
    resolver = null
  }

  return { open, prompt, confirm, cancel }
}

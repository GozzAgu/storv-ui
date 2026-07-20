/**
 * Resolve when `promise` settles or after `ms` (whichever comes first).
 * On timeout, resolves `undefined` and logs a warning - never blocks the UI forever.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label?: string
): Promise<T | undefined> {
  return Promise.race([
    promise,
    new Promise<undefined>((resolve) => {
      setTimeout(() => {
        if (label) {
          console.warn(`[Timeout] ${label} (${ms}ms)`)
        }
        resolve(undefined)
      }, ms)
    }),
  ])
}

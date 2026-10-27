/**
 * Keeps retrying sales a till queued offline until the server takes them. The browser's
 * `online` event alone isn't enough: a flaky connection or a server error leaves the device
 * "online" with sales still waiting, and nothing else would try them again.
 */

/** First wait after a try that left sales waiting; doubles each time up to the max. */
export const OUTBOX_RETRY_MIN_MS = 30_000
export const OUTBOX_RETRY_MAX_MS = 5 * 60_000
/** Coming back to the app retries straight away, but not more often than this. */
export const OUTBOX_FOCUS_GAP_MS = 10_000

export interface OutboxFlushOutcome {
  recorded: unknown[]
  remaining: number
}

export interface OutboxRetry {
  /** Try now and start over from the shortest wait (sign-in, back online). */
  run(): Promise<void>
  /** The user came back to the app: try now unless a try just happened. */
  nudge(): void
  /** Sales were queued: make sure a try is coming. */
  schedule(): void
  stop(): void
  /** The wait before the next timed try, for tests and diagnostics. */
  readonly delayMs: number
}

export function createOutboxRetry(opts: {
  flush: () => Promise<OutboxFlushOutcome | null>
  hasQueued: () => boolean
  now?: () => number
}): OutboxRetry {
  const now = opts.now ?? Date.now
  let timer: ReturnType<typeof setTimeout> | null = null
  let delay = OUTBOX_RETRY_MIN_MS
  let running: Promise<void> | null = null
  let lastTry = Number.NEGATIVE_INFINITY
  let stopped = false

  function clearTimer() {
    if (timer) clearTimeout(timer)
    timer = null
  }

  function schedule() {
    if (stopped || timer || running || !opts.hasQueued()) return
    timer = setTimeout(() => {
      timer = null
      void attempt()
    }, delay)
  }

  function attempt(): Promise<void> {
    if (running) return running
    clearTimer()
    lastTry = now()
    running = (async () => {
      const outcome = await opts.flush().catch(() => null)
      if (!opts.hasQueued() || (outcome && outcome.recorded.length > 0)) {
        delay = OUTBOX_RETRY_MIN_MS
      } else {
        delay = Math.min(delay * 2, OUTBOX_RETRY_MAX_MS)
      }
    })().finally(() => {
      running = null
      schedule()
    })
    return running
  }

  return {
    run() {
      delay = OUTBOX_RETRY_MIN_MS
      return attempt()
    },
    nudge() {
      if (stopped || !opts.hasQueued() || now() - lastTry < OUTBOX_FOCUS_GAP_MS) return
      void attempt()
    },
    schedule,
    stop() {
      stopped = true
      clearTimer()
    },
    get delayMs() {
      return delay
    },
  }
}

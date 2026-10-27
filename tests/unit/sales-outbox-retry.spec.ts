import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  OUTBOX_FOCUS_GAP_MS,
  OUTBOX_RETRY_MAX_MS,
  OUTBOX_RETRY_MIN_MS,
  createOutboxRetry,
  type OutboxFlushOutcome,
} from '~/utils/sales-outbox-retry'

let waiting = 0
const flush = vi.fn<() => Promise<OutboxFlushOutcome | null>>()

function retry() {
  return createOutboxRetry({ flush, hasQueued: () => waiting > 0 })
}

/** The server keeps failing: nothing recorded, everything still waiting. */
function failing() {
  flush.mockImplementation(async () => ({ recorded: [], remaining: waiting }))
}

describe('offline sales retry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    flush.mockReset()
    waiting = 0
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps trying on a timer while sales wait, backing off up to five minutes', async () => {
    waiting = 2
    failing()
    const r = retry()
    await r.run()
    expect(flush).toHaveBeenCalledTimes(1)
    expect(r.delayMs).toBe(OUTBOX_RETRY_MIN_MS * 2)

    await vi.advanceTimersByTimeAsync(OUTBOX_RETRY_MIN_MS * 2)
    expect(flush).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(OUTBOX_RETRY_MIN_MS * 4)
    expect(flush).toHaveBeenCalledTimes(3)

    for (let i = 0; i < 6; i++) await vi.advanceTimersByTimeAsync(OUTBOX_RETRY_MAX_MS)
    expect(r.delayMs).toBe(OUTBOX_RETRY_MAX_MS)
    r.stop()
  })

  it('stops once everything is recorded', async () => {
    waiting = 1
    flush.mockImplementation(async () => {
      waiting = 0
      return { recorded: [{}], remaining: 0 }
    })
    const r = retry()
    await r.run()
    await vi.advanceTimersByTimeAsync(OUTBOX_RETRY_MAX_MS * 3)
    expect(flush).toHaveBeenCalledTimes(1)
  })

  it('starts the timer when a sale is queued while the device still looks online', async () => {
    failing()
    const r = retry()
    r.schedule()
    await vi.advanceTimersByTimeAsync(OUTBOX_RETRY_MAX_MS)
    expect(flush).not.toHaveBeenCalled()

    waiting = 1
    r.schedule()
    r.schedule()
    await vi.advanceTimersByTimeAsync(OUTBOX_RETRY_MIN_MS)
    expect(flush).toHaveBeenCalledTimes(1)
    r.stop()
  })

  it('retries straight away when the app comes back to the front, but not twice in a row', async () => {
    waiting = 1
    failing()
    const r = retry()
    r.nudge()
    await vi.advanceTimersByTimeAsync(0)
    expect(flush).toHaveBeenCalledTimes(1)

    r.nudge()
    await vi.advanceTimersByTimeAsync(0)
    expect(flush).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(OUTBOX_FOCUS_GAP_MS)
    r.nudge()
    await vi.advanceTimersByTimeAsync(0)
    expect(flush).toHaveBeenCalledTimes(2)
    r.stop()
  })

  it('does not nudge when nothing is waiting', async () => {
    const r = retry()
    r.nudge()
    await vi.advanceTimersByTimeAsync(0)
    expect(flush).not.toHaveBeenCalled()
  })

  it('shares a try already running and starts over from the shortest wait when back online', async () => {
    waiting = 1
    failing()
    const r = retry()
    await r.run()
    await vi.advanceTimersByTimeAsync(OUTBOX_RETRY_MIN_MS * 2)
    expect(r.delayMs).toBe(OUTBOX_RETRY_MIN_MS * 4)

    await Promise.all([r.run(), r.run()])
    expect(flush).toHaveBeenCalledTimes(3)
    expect(r.delayMs).toBe(OUTBOX_RETRY_MIN_MS * 2)
    r.stop()
  })

  it('keeps going after a flush that throws', async () => {
    waiting = 1
    flush.mockRejectedValueOnce(new Error('boom'))
    failing()
    flush.mockRejectedValueOnce(new Error('boom'))
    const r = retry()
    await r.run()
    await vi.advanceTimersByTimeAsync(OUTBOX_RETRY_MIN_MS * 2)
    expect(flush).toHaveBeenCalledTimes(2)
    r.stop()
  })
})

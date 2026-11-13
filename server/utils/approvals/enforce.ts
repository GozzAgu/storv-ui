import { createError } from 'h3'
import { APPROVAL_ERROR_STATUS, type Decision } from '~/utils/approval-decision'

/** Turns a refused policy decision into the matching HTTP error; passes an allowed one through. */
export function enforce<T>(decision: Decision<T>): asserts decision is { ok: true } & T {
  if (decision.ok) return
  throw createError({
    statusCode: APPROVAL_ERROR_STATUS[decision.code],
    message: decision.message,
    data: { code: decision.code },
  })
}

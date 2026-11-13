/**
 * The result of asking a workflow policy "may this person do this now?". Policies are pure and
 * shared: the server enforces them and the UI uses the same answer to decide which actions to
 * offer, so a button never appears for a move the server would refuse.
 */

export type ApprovalErrorCode =
  | 'INVALID_TRANSITION'
  | 'FORBIDDEN'
  | 'SELF_APPROVAL'
  | 'REASON_REQUIRED'

export const APPROVAL_ERROR_STATUS: Record<ApprovalErrorCode, number> = {
  INVALID_TRANSITION: 409,
  FORBIDDEN: 403,
  SELF_APPROVAL: 403,
  REASON_REQUIRED: 400,
}

export type Decision<T> =
  | ({ ok: true } & T)
  | { ok: false; code: ApprovalErrorCode; message: string }

export const deny = (code: ApprovalErrorCode, message: string) =>
  ({ ok: false, code, message } as const)

export const hasReason = (reason?: string | null): boolean =>
  typeof reason === 'string' && reason.trim().length > 0

/** Approval reasons are short notes shown to the requester; cap them like other free text. */
export const normalizeReason = (reason: unknown): string =>
  typeof reason === 'string' ? reason.trim().slice(0, 300) : ''

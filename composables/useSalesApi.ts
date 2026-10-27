import { useAuthenticatedFetch } from '~/composables/useAuthenticatedFetch'
import { getQueryUserId } from '~/composables/useFirestorePaths'
import { getCurrentStoreId } from '~/composables/useCurrentStore'
import { useAuthStore } from '~/stores/auth'
import {
  canSellOffline,
  enqueueSale,
  listQueuedSales,
  markSaleFailed,
  removeQueuedSale,
  updateQueuedSale,
  type QueuedSale,
} from '~/utils/sales-outbox'

/**
 * Client for /api/sales/*, /api/stock-loans/* and /api/customer-accounts/*. The server decides
 * prices, totals and stock; this only says what happened. Sales made with no connection are
 * queued on the device and sent when it comes back (see utils/sales-outbox.ts).
 */

export interface SaleApproval {
  approverUid: string
  pin: string
}

export interface CreateSaleBody {
  saleId: string
  source: 'pos' | 'quick_sale'
  lines: Array<{ itemId: string; quantity: number; discountAmount?: number }>
  customer?: { name?: string; email?: string; phone?: string; address?: string }
  payment: { method: string; split?: Array<{ method: string; amount: number }> }
  settlement?: 'paid_in_full' | 'balance_due'
  deposit?: number
  notes?: string
  discountReason?: string
  swapIn?: { folderId: string; fields: Record<string, unknown>; swapValue?: number }
  commission?: { amount: number; owedToName?: string; owedToUid?: string }
}

export interface CreateSaleResult {
  receiptId: string
  created: boolean
  swapInItemId: string | null
  receipt: Record<string, unknown> & { id: string }
  paymentWarning: string | null
}

export type CreateSaleOutcome =
  | { status: 'recorded'; result: CreateSaleResult }
  | { status: 'queued'; saleId: string }

export class SaleApiError extends Error {
  constructor(message: string, readonly code: string | null, readonly status: number | null) {
    super(message)
    this.name = 'SaleApiError'
  }
}

/** The server's message and code, or null status for a request that never got an answer. */
export function toSaleApiError(err: unknown, fallback = 'Something went wrong'): SaleApiError {
  const e = err as {
    status?: number
    statusCode?: number
    response?: { status?: number }
    data?: { message?: string; data?: { code?: string } }
    statusMessage?: string
    message?: string
  }
  const status = e?.statusCode ?? e?.status ?? e?.response?.status ?? null
  const message = e?.data?.message || e?.statusMessage || e?.message || fallback
  return new SaleApiError(message, e?.data?.data?.code ?? null, status)
}

/** No connection, or the server could not be reached: worth queueing and retrying. */
export function isNetworkFailure(err: SaleApiError): boolean {
  return err.status === null || err.status === 0 || err.status >= 500
}

export function useSalesApi() {
  const { authFetch } = useAuthenticatedFetch()

  async function scope(): Promise<{ ownerUserId: string; storeId: string }> {
    const ownerUserId = await getQueryUserId()
    const storeId = await getCurrentStoreId()
    if (!ownerUserId || !storeId) throw new Error('No store selected')
    return { ownerUserId, storeId }
  }

  async function post<T>(
    path: string,
    body: Record<string, unknown>,
    s?: Awaited<ReturnType<typeof scope>>
  ) {
    try {
      return await authFetch<T>(path, {
        method: 'POST',
        body: { ...(s ?? (await scope())), ...body },
      })
    } catch (err) {
      throw toSaleApiError(err)
    }
  }

  async function get<T>(path: string) {
    try {
      return await authFetch<T>(path, { query: await scope() })
    } catch (err) {
      throw toSaleApiError(err)
    }
  }

  /**
   * Records a sale. With no connection it is queued instead (unless it needs a manager's
   * approval, which can only be checked online). Throws SaleApiError for anything the server
   * refused, including `APPROVAL_REQUIRED`.
   */
  async function createSale(
    body: CreateSaleBody,
    opts: {
      approval?: SaleApproval
      summary: string
      /** The total shown to the customer; if prices change before an offline sale syncs, the sale is flagged. */
      clientTotal?: number
    }
  ): Promise<CreateSaleOutcome> {
    const s = await scope()
    const offline = import.meta.client && navigator.onLine === false
    if (!offline) {
      try {
        const result = await post<CreateSaleResult>(
          '/api/sales/create',
          { ...body, ...(opts.approval && { approval: opts.approval }) },
          s
        )
        void flushQueuedSales(authFetch)
        return { status: 'recorded', result }
      } catch (err) {
        const apiError = err instanceof SaleApiError ? err : toSaleApiError(err)
        if (!isNetworkFailure(apiError) || opts.approval) throw apiError
      }
    } else if (opts.approval) {
      throw new SaleApiError(
        'A manager-approved sale needs an internet connection. Try again once you are back online.',
        'OFFLINE_APPROVAL',
        null
      )
    }

    const uid = useAuthStore().currentUser?.uid
    if (!uid) throw new SaleApiError('Sign in required', null, 401)
    if (!canSellOffline(uid)) {
      throw new SaleApiError(
        'This till hasn’t reached Storvv for more than 3 days, so it can’t save more sales offline. Connect to the internet to keep selling.',
        'OFFLINE_TOO_LONG',
        null
      )
    }
    enqueueSale(uid, {
      saleId: body.saleId,
      ownerUserId: s.ownerUserId,
      storeId: s.storeId,
      body: { ...body },
      queuedAt: new Date().toISOString(),
      summary: opts.summary,
      ...(Number.isFinite(opts.clientTotal) && { clientTotal: opts.clientTotal }),
      attempts: 0,
    })
    return { status: 'queued', saleId: body.saleId }
  }

  return {
    createSale,
    /** Send any sales this device queued offline. */
    flushQueued: () => flushQueuedSales(authFetch),
    recordBalancePayment: (receiptId: string, amount: number, method: string) =>
      post<{ completed: boolean; amountPaid: number; balanceDue: number }>(
        '/api/sales/balance-payment',
        { receiptId, amount, method }
      ),
    cancelSale: (receiptId: string, reason: string) =>
      post<{ status: 'cancelled' }>('/api/sales/cancel', { receiptId, reason }),
    refundSale: (receiptId: string, reason: string) =>
      post<{ status: 'refunded' }>('/api/sales/refund', { receiptId, reason }),
    approvers: () =>
      get<{ approvers: Array<{ uid: string; name: string }> }>('/api/sales/approvers'),
    approvalPinStatus: () =>
      get<{ canApprove: boolean; hasPin: boolean }>('/api/sales/approval-pin'),
    setApprovalPin: (pin: string, totpCode?: string) =>
      post<{ ok: true }>('/api/sales/approval-pin', { pin, ...(totpCode && { totpCode }) }),
    createStockLoan: (input: {
      partyName: string
      partyPhone: string
      partyNotes?: string
      itemIds: string[]
    }) => post<{ loanId: string }>('/api/stock-loans/create', input),
    returnStockLoan: (loanId: string) => post<{ ok: true }>('/api/stock-loans/return', { loanId }),
    markStockLoanSold: (loanId: string) =>
      post<{ ok: true }>('/api/stock-loans/mark-sold', { loanId }),
    applyLedgerEntry: (input: {
      customerName: string
      email?: string
      phone?: string
      type: 'charge' | 'payment' | 'adjustment'
      amount: number
      note?: string
    }) =>
      post<{
        id: string
        contactKey: string
        accountBalance: number
        entry: {
          id: string
          type: string
          amount: number
          note?: string
          createdAt: string
          createdBy: string
        }
      }>('/api/customer-accounts/entry', input),
  }
}

let flushing: Promise<FlushResult> | null = null

export interface FlushResult {
  recorded: QueuedSale[]
  failed: Array<{ sale: QueuedSale; message: string }>
  remaining: number
}

/**
 * Sends sales queued offline. A sale the server refuses (an item sold on another till, too old,
 * ...) moves to the failed list so the owner can re-enter it; network and server errors keep it
 * queued for the next try (see plugins/07.sales-outbox.client.ts).
 */
type AuthFetch = ReturnType<typeof useAuthenticatedFetch>['authFetch']

export function flushQueuedSales(authFetch: AuthFetch): Promise<FlushResult> {
  if (flushing) return flushing
  flushing = (async () => {
    const result: FlushResult = { recorded: [], failed: [], remaining: 0 }
    const uid = useAuthStore().currentUser?.uid
    if (!uid || (import.meta.client && navigator.onLine === false)) {
      result.remaining = uid ? listQueuedSales(uid).length : 0
      return result
    }
    for (const sale of listQueuedSales(uid)) {
      try {
        await authFetch('/api/sales/create', {
          method: 'POST',
          body: {
            ...sale.body,
            ownerUserId: sale.ownerUserId,
            storeId: sale.storeId,
            // Marks this as a replay: only then does the server keep the till's time and total.
            offlineReplay: true,
            clientCreatedAt: sale.queuedAt,
            ...(sale.clientTotal !== undefined && { clientTotal: sale.clientTotal }),
            offlineSummary: sale.summary,
          },
        })
        removeQueuedSale(uid, sale.saleId)
        result.recorded.push(sale)
      } catch (err) {
        const apiError = toSaleApiError(err)
        const noAnswer = apiError.status === null || apiError.status === 0
        // Too many requests: the server is fine but wants a pause, so the sale isn't refused.
        const busy = apiError.status === 429
        if (noAnswer || busy || isNetworkFailure(apiError)) {
          updateQueuedSale(uid, sale.saleId, {
            attempts: sale.attempts + 1,
            // No answer at all (offline, blocked): say so rather than show a technical error.
            lastError: noAnswer ? 'Couldn’t reach Storvv' : apiError.message,
          })
          // Offline or rate limited: the rest would fail the same way, so stop until the next try.
          // A server error may be about this sale only, so the sales behind it still go.
          if (noAnswer || busy) break
          continue
        }
        markSaleFailed(uid, sale, apiError.message)
        result.failed.push({ sale, message: apiError.message })
      }
    }
    result.remaining = listQueuedSales(uid).length
    return result
  })().finally(() => {
    flushing = null
  })
  return flushing
}

import { ref } from 'vue'
import { collection, onSnapshot, query, where, type Unsubscribe } from 'firebase/firestore'
import { getStorage, ref as storageRef, uploadBytes } from 'firebase/storage'
import type {
  CashConfirmationMode,
  PaymentKind,
  PaymentPermissions,
  PaymentRecord,
  PaymentSummary,
} from '~/types/payments-v2'
import { isDemoModeActive } from '~/utils/demo-mode'
import { useFirebase } from '~/composables/useFirebase'
import { useFirestore } from '~/composables/useFirestore'
import { useAppToast } from '~/composables/useAppToast'
import { useAuthenticatedFetch } from '~/composables/useAuthenticatedFetch'
import { getQueryUserId } from '~/composables/useFirestorePaths'
import { getCurrentStoreId } from '~/composables/useCurrentStore'

export interface PaymentsV2Access {
  enabled: boolean
  isOwner: boolean
  canRecord: boolean
  canView: boolean
  canConfirm: boolean
  canRefund: boolean
  settings: {
    cashConfirmation: CashConfirmationMode
    tenderKinds?: Record<string, Exclude<PaymentKind, 'paystack_link'>>
  }
}

export interface AwaitingPayment {
  id: string
  receiptId: string
  kind: PaymentKind
  methodLabel: string
  amountKobo: number
  recordedBy: string
  recordedByName: string
  createdAt: string
  hasProof: boolean
  isOwnEntry: boolean
  confirmViaTillCount: boolean
}

export interface TillLine {
  id: string
  receiptId: string
  amountKobo: number
  recordedBy: string
  recordedByName: string
  createdAt: string
}

export interface RecordResult {
  payments: { paymentId: string; status: PaymentRecord['status']; amountKobo: number }[]
  summary: PaymentSummary
  saleCompleted: boolean
}

export interface PaymentLinkCopy {
  tokenId: string
  status: 'active' | 'revoked' | 'dead'
  createdAt: string
  createdBy: string
}

export interface ReceiptPaymentLink {
  id: string
  receiptId: string
  amountKobo: number
  status: 'active' | 'paid' | 'expired' | 'revoked'
  expiresAt: string
  createdAt: string
  createdBy: string
  linkSale: boolean
  endedAt?: string | null
  endReason?: string | null
  tokens: PaymentLinkCopy[]
}

/** The URL is shown once; only its hash is stored, so it cannot be fetched again. */
export interface SharedLinkUrl {
  url: string
  expiresAt: string
}

const DISABLED: PaymentsV2Access = {
  enabled: false,
  isOwner: false,
  canRecord: false,
  canView: false,
  canConfirm: false,
  canRefund: false,
  settings: { cashConfirmation: 'each' },
}

const PROOF_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}
/** Client-only (loadAccess never runs on the server), so module scope is per browser tab. */
const access = ref<PaymentsV2Access>({ ...DISABLED })
const accessScope = ref('')

export const PROOF_MAX_BYTES = 5 * 1024 * 1024
export const PROOF_ACCEPT = Object.keys(PROOF_TYPES).join(',')

/** The flag only shows the screens; the server gate decides (routes 404 when off). */
export function paymentsV2UiFlag(): boolean {
  if (import.meta.server || isDemoModeActive()) return false
  return useRuntimeConfig().public.paymentsV2 === true
}

function errorStatus(err: unknown): number | undefined {
  const e = err as { statusCode?: number; status?: number; response?: { status?: number } }
  return e?.statusCode ?? e?.status ?? e?.response?.status
}

export function paymentsErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  const e = err as { data?: { message?: string }; statusMessage?: string; message?: string }
  return e?.data?.message || e?.statusMessage || e?.message || fallback
}

/**
 * Client for /api/payments/*. Every money change happens on the server; this only calls the
 * routes and reads what rules allow (the caller's own payments, or all with payments.view).
 */
export function usePaymentsV2() {
  const { authFetch } = useAuthenticatedFetch()

  async function scope(): Promise<{ ownerUserId: string; storeId: string }> {
    const ownerUserId = await getQueryUserId()
    const storeId = await getCurrentStoreId()
    if (!ownerUserId || !storeId) throw new Error('No store selected')
    return { ownerUserId, storeId }
  }

  async function loadAccess(force = false): Promise<PaymentsV2Access> {
    if (!paymentsV2UiFlag()) {
      access.value = { ...DISABLED }
      return access.value
    }
    const s = await scope().catch(() => null)
    if (!s) return { ...DISABLED }
    const key = `${s.ownerUserId}/${s.storeId}`
    if (!force && accessScope.value === key) return access.value
    try {
      const res = await authFetch<PaymentsV2Access>('/api/payments/access', { query: s })
      access.value = { ...DISABLED, ...res, enabled: true }
    } catch (err) {
      if (errorStatus(err) !== 404) console.warn('[payments] access check failed')
      access.value = { ...DISABLED }
    }
    accessScope.value = key
    return access.value
  }

  async function post<T>(
    path: string,
    body: Record<string, unknown> = {},
    headers?: Record<string, string>
  ) {
    return authFetch<T>(path, { method: 'POST', body: { ...(await scope()), ...body }, headers })
  }

  async function get<T>(path: string, params: Record<string, string> = {}) {
    return authFetch<T>(path, { query: { ...(await scope()), ...params } })
  }

  const enc = encodeURIComponent

  return {
    access,
    loadAccess,
    record: (receiptId: string, tenders: { methodLabel: string; amountKobo: number }[]) =>
      post<RecordResult>('/api/payments/record', { receiptId, tenders }),
    confirm: (paymentId: string) =>
      post<{ summary: PaymentSummary }>(`/api/payments/${enc(paymentId)}/confirm`),
    reject: (paymentId: string, reason: string) =>
      post<{ summary: PaymentSummary }>(`/api/payments/${enc(paymentId)}/reject`, { reason }),
    refund: (paymentId: string, amountKobo: number, reason: string) =>
      post<{ summary: PaymentSummary }>(`/api/payments/${enc(paymentId)}/refund`, {
        amountKobo,
        reason,
      }),
    closeSale: (receiptId: string, action: 'cancel' | 'refund', reason: string) =>
      post<{ status: string }>(`/api/payments/sales/${enc(receiptId)}/close`, { action, reason }),
    listAwaiting: async () =>
      (await get<{ payments: AwaitingPayment[] }>('/api/payments/awaiting')).payments,
    tillPreview: (businessDate?: string) =>
      get<{
        businessDate: string
        expectedKobo: number
        lines: TillLine[]
        ownEntries: TillLine[]
      }>('/api/payments/till-count', businessDate ? { businessDate } : {}),
    submitTill: (input: {
      businessDate: string
      countedKobo: number
      confirmIds: string[]
      rejectIds: string[]
      rejectReason?: string
      note?: string
    }) => post<{ id: string; differenceKobo: number }>('/api/payments/till-count', input),
    saveSettings: (input: {
      cashConfirmation: CashConfirmationMode
      tenderKinds: Record<string, string>
    }) => post<{ settings: PaymentsV2Access['settings'] }>('/api/payments/settings', input),
    setMemberPermissions: (memberUid: string, permissions: PaymentPermissions, totpCode?: string) =>
      post<{ permissions: PaymentPermissions }>(
        '/api/payments/permissions',
        { memberUid, permissions },
        totpCode ? { 'x-storvv-totp': totpCode } : undefined
      ),
    /**
     * Record a new sale's tenders. The sale itself is already saved, so a failure must not undo
     * it: warn and leave the money unrecorded (the sale shows "Record payment").
     */
    async recordSaleTenders(
      receiptId: string,
      tenders: { methodLabel: string; amountKobo: number }[]
    ): Promise<RecordResult | null> {
      if (tenders.length === 0) return null
      try {
        return await post<RecordResult>('/api/payments/record', { receiptId, tenders })
      } catch (err) {
        useAppToast().warning(
          `Sale saved, but the payment was not recorded (${paymentsErrorMessage(
            err,
            'network error'
          )}). Open the sale and use Record payment.`,
          10000
        )
        return null
      }
    },
    listLinks: (receiptId: string) =>
      get<ReceiptPaymentLink[]>('/api/payments/links', { receiptId }),
    createLink: (receiptId: string, input: { amountKobo?: number; expiresInHours?: number }) =>
      post<SharedLinkUrl & { linkId: string; amountKobo: number; linkSale: boolean }>(
        '/api/payments/links/create',
        { receiptId, ...input }
      ),
    shareLink: (linkId: string) =>
      post<SharedLinkUrl & { tokenId: string }>(`/api/payments/links/${enc(linkId)}/share`),
    revokeLink: (linkId: string, reason: string) =>
      post(`/api/payments/links/${enc(linkId)}/revoke`, { reason }),
    revokeLinkCopy: (linkId: string, tokenId: string) =>
      post(`/api/payments/links/${enc(linkId)}/tokens/${enc(tokenId)}/revoke`),
    proofUrl: (paymentId: string) =>
      post<{ url: string; expiresAt: string }>(`/api/payments/${enc(paymentId)}/proof-url`),

    /** Upload straight to Storage (rules: recorder only, create once), then let the server link it. */
    async uploadProof(paymentId: string, file: File): Promise<void> {
      const ext = PROOF_TYPES[file.type]
      if (!ext) throw new Error('Proof must be a JPEG, PNG, WebP or PDF')
      if (file.size <= 0 || file.size > PROOF_MAX_BYTES)
        throw new Error('Proof must be 5 MB or smaller')
      const s = await scope()
      const app = useFirebase().getApp()
      if (!app) throw new Error('Storage unavailable')
      const fileName = `proof.${ext}`
      await uploadBytes(
        storageRef(
          getStorage(app),
          `paymentProofs/${s.ownerUserId}/${s.storeId}/${paymentId}/${fileName}`
        ),
        file,
        { contentType: file.type }
      )
      await post(`/api/payments/${enc(paymentId)}/proof`, { fileName })
    },

    /** Live payments for a sale: all of them with payments.view, otherwise the caller's own. */
    async watchReceiptPayments(
      receiptId: string,
      uid: string,
      canView: boolean,
      onChange: (payments: PaymentRecord[]) => void
    ): Promise<Unsubscribe> {
      const s = await scope()
      const db = useFirestore().getFirestoreInstance()
      if (!db) return () => {}
      const base = collection(db, 'users', s.ownerUserId, 'stores', s.storeId, 'payments')
      const q = canView
        ? query(base, where('receiptId', '==', receiptId))
        : query(base, where('receiptId', '==', receiptId), where('recordedBy', '==', uid))
      return onSnapshot(
        q,
        (snap) =>
          onChange(
            snap.docs
              .map((d) => ({ ...(d.data() as PaymentRecord), id: d.id }))
              .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
          ),
        () => onChange([])
      )
    },
  }
}

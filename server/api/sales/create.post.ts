import { defineEventHandler, readBody } from 'h3'
import { getAdminFirestore } from '~/server/utils/firebase-admin'
import { requireAuth } from '~/server/utils/store-auth'
import { assertRateLimit } from '~/server/utils/rate-limit'
import { syncLoyaltyBestEffort } from '~/server/utils/loyalty/sync'
import { resolveStoreActor } from '~/server/utils/sales/actor'
import { createSale, parseCreateSaleRequest } from '~/server/utils/sales/create-sale'
import { recordRefusedOfflineSale } from '~/server/utils/sales/offline-refusal'
import { notifyStore } from '~/server/utils/sales/records'
import { serializeForClient } from '~/server/utils/sales/serialize'
import { buildSaleTenders } from '~/utils/payments-v2-tenders'

/**
 * Records a sale from the New sale or Quick sale screen, or a sale a till queued while offline.
 * Clients can no longer write receipts directly (firestore.rules); see server/utils/sales.
 */
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  await assertRateLimit(event, { id: 'sales:create', limit: 60, windowMs: 60_000, uid: auth.uid })
  const body = ((await readBody<Record<string, unknown>>(event).catch(() => null)) ?? {}) as Record<
    string,
    unknown
  >
  const db = getAdminFirestore()
  let actor: Awaited<ReturnType<typeof resolveStoreActor>>
  let input: ReturnType<typeof parseCreateSaleRequest>
  let sale: Awaited<ReturnType<typeof createSale>>
  try {
    actor = await resolveStoreActor(db, auth.uid, body.ownerUserId, body.storeId)
    input = parseCreateSaleRequest(body)
    sale = await createSale(db, actor, input)
  } catch (err) {
    // A sale the till saved offline and the server now refuses: tell the store, not just the till.
    const status = (err as { statusCode?: number })?.statusCode ?? 500
    if (body.offlineReplay === true && status >= 400 && status < 500 && status !== 429) {
      await recordRefusedOfflineSale(db, {
        authUid: auth.uid,
        ownerUserId: body.ownerUserId,
        storeId: body.storeId,
        saleId: body.saleId,
        message: (err as { message?: string })?.message || 'The sale was refused.',
        code: (err as { data?: { code?: string } })?.data?.code ?? null,
        summary: body.offlineSummary,
        clientCreatedAt: body.clientCreatedAt,
      })
    }
    throw err
  }

  let paymentWarning: string | null = null
  if (sale.created) {
    const receipt = sale.receipt
    if (receipt.paymentsV2 === true) {
      paymentWarning = await recordV2Tenders(
        db,
        auth.uid,
        actor.ownerId,
        actor.storeId,
        sale.receiptId,
        {
          total: Number(receipt.total) || 0,
          isBalanceDue: receipt.status === 'balance_due',
          deposit: input.deposit ?? 0,
          method: input.payment?.method || 'Cash',
          split: input.payment?.split,
        }
      )
    }

    await notifyStore(actor.store, {
      ownerId: actor.ownerId,
      actorUid: auth.uid,
      type: receipt.isSwapIn ? 'swap_in_completed' : 'receipt_created',
      title: receipt.isSwapIn ? 'Swap-in Completed' : 'New Receipt Created',
      message: `${receipt.isSwapIn ? 'Swap-in receipt' : 'Receipt'} #${
        receipt.receiptNumber
      } was recorded by ${actor.displayName}`,
      metadata: { receiptId: sale.receiptId },
    })
    if (sale.unpricedSwapInName && sale.swapInItemId) {
      await notifyStore(actor.store, {
        ownerId: actor.ownerId,
        actorUid: auth.uid,
        type: 'swap_in_needs_price',
        title: 'Swap-in needs a price',
        message: `${sale.unpricedSwapInName} was taken in on receipt #${receipt.receiptNumber} without a Unit Price. Set one so it can be sold.`,
        metadata: {
          itemId: sale.swapInItemId,
          folderId: String(receipt.swapInFolderId || ''),
          receiptId: sale.receiptId,
        },
      })
    }
    await syncLoyaltyBestEffort(
      db,
      { ownerId: actor.ownerId, storeId: actor.storeId, actorUid: auth.uid },
      [sale.receiptId]
    )
  }

  return {
    receiptId: sale.receiptId,
    created: sale.created,
    swapInItemId: sale.swapInItemId,
    receipt: serializeForClient({ id: sale.receiptId, ...sale.receipt }),
    paymentWarning,
  }
})

/** Payments V2 money is recorded by its own service; a failure leaves the sale saved. */
async function recordV2Tenders(
  db: ReturnType<typeof getAdminFirestore>,
  uid: string,
  ownerId: string,
  storeId: string,
  receiptId: string,
  input: Parameters<typeof buildSaleTenders>[0]
): Promise<string | null> {
  const tenders = buildSaleTenders(input)
  if (!tenders.length) return null
  try {
    const { resolvePaymentsAccess } = await import('~/server/utils/payments/access')
    const { recordManualPayments } = await import('~/server/utils/payments/service')
    const access = await resolvePaymentsAccess(db, uid, ownerId, storeId)
    await recordManualPayments(db, access, { receiptId, tenders })
    return null
  } catch (err) {
    console.error('[sales] V2 tenders failed', receiptId, err instanceof Error ? err.message : err)
    return 'Sale saved, but the payment was not recorded. Open the sale and use Record payment.'
  }
}

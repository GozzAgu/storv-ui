#!/usr/bin/env node
/**
 * Correct one receipt that saved with a total of 0 and no item count while its item lines are
 * priced (a Quick sale closed mid-save). Sets total and itemsCount from the lines and records
 * the correction on the receipt. Only acts if the receipt is still in exactly that state.
 *
 * DRY RUN by default; pass --apply to write.
 *
 * Usage:
 *   node --env-file=.env scripts/data/fix-zero-total-receipt.mjs <ownerId> <storeId> <receiptId> [--apply]
 */
import { readFileSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'

function loadCredentials() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  }
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  if (!path) {
    console.error('Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON')
    process.exit(2)
  }
  return JSON.parse(readFileSync(path, 'utf8'))
}

async function main() {
  const [ownerId, storeId, receiptId] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  const apply = process.argv.includes('--apply')
  if (!ownerId || !storeId || !receiptId) {
    console.error('Usage: <ownerId> <storeId> <receiptId> [--apply]')
    process.exit(2)
  }
  initializeApp({ credential: cert(loadCredentials()) })
  const db = getFirestore()
  const ref = db.doc(`users/${ownerId}/stores/${storeId}/receipts/${receiptId}`)

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) return { ok: false, reason: 'receipt not found' }
    const d = snap.data()
    const lines = Array.isArray(d.items) ? d.items : []
    const total = lines.reduce(
      (sum, l) => sum + (Number(l.price) || 0) * (Number(l.quantity) || 0),
      0
    )
    const itemsCount = lines.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0)
    const state = {
      receiptNumber: d.receiptNumber,
      before: { total: d.total, itemsCount: d.itemsCount },
      after: { total, itemsCount },
    }
    if (d.total !== 0 || (d.itemsCount ?? 0) !== 0 || total <= 0) {
      return {
        ok: false,
        reason: 'receipt is not in the zero-total state; nothing changed',
        ...state,
      }
    }
    if (d.commissionAmount || d.isSwapIn || d.paymentsV2) {
      return { ok: false, reason: 'commission, swap-in or Payments V2 sale: fix by hand', ...state }
    }
    if (apply) {
      tx.update(ref, {
        total,
        itemsCount,
        correction: {
          reason: 'Quick sale closed while saving; total and item count restored from its lines',
          previousTotal: d.total,
          previousItemsCount: d.itemsCount ?? 0,
          correctedAt: FieldValue.serverTimestamp(),
        },
      })
    }
    return { ok: true, mode: apply ? 'applied' : 'dry run', ...state }
  })
  console.log(JSON.stringify(result, null, 2))
}

main().catch((err) => {
  console.error('Fix failed:', err?.message || err)
  process.exit(1)
})

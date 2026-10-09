#!/usr/bin/env node
/**
 * READ-ONLY report: legacy `paymentLinks` docs (pre Payments V2), for retiring the old flow.
 * It never writes, updates or deletes.
 *
 * Legacy doc IDs ARE the bearer pay tokens, so they are never printed. Each doc is identified by
 * `fp:` + the first 16 hex chars of sha256(docId); pass `--match <fp>` to print only that doc's
 * status and store (still no token).
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json node scripts/payments/report-legacy-payment-links.mjs
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=<id> node scripts/payments/report-legacy-payment-links.mjs
 *
 * Exit code: 0 on success (whatever the counts), 2 on bad usage.
 * Do not commit the output: it contains owner and store IDs.
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

function initAdmin() {
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'storv-ui-local' })
    return
  }
  let credentials
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    credentials = JSON.parse(readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'))
  } else {
    console.error(
      'Set FIREBASE_SERVICE_ACCOUNT_PATH, FIREBASE_SERVICE_ACCOUNT_JSON or FIRESTORE_EMULATOR_HOST'
    )
    process.exit(2)
  }
  initializeApp({ credential: cert(credentials) })
}

/** Non-reversible short ID for a legacy doc (the doc ID is a pay token). Exported for tests. */
export function fingerprint(docId) {
  return 'fp:' + createHash('sha256').update(String(docId)).digest('hex').slice(0, 16)
}

function toMillis(value) {
  if (!value) return null
  if (typeof value.toMillis === 'function') return value.toMillis()
  const ms = new Date(value).getTime()
  return Number.isFinite(ms) ? ms : null
}

/**
 * Bucket for one legacy link. Exported for tests.
 * - `open`: unpaid and not yet expired (the legacy pay routes are closed, so it cannot be paid)
 * - `paid_needs_review`: paid but stock was not applied or settlement recorded an error
 */
export function classifyLegacyLink(data, nowMs = Date.now()) {
  const status = String(data?.status || 'unknown')
  if (status === 'paid') {
    return data.settleError || data.inventoryApplied === false ? 'paid_needs_review' : 'paid'
  }
  if (status === 'unpaid') {
    const exp = toMillis(data.expiresAt)
    return exp !== null && exp > nowMs ? 'open' : 'unpaid_expired'
  }
  return status
}

async function main() {
  const matchIdx = process.argv.indexOf('--match')
  const match = matchIdx > -1 ? process.argv[matchIdx + 1] : null
  if (matchIdx > -1 && !match) {
    console.error('Usage: --match fp:<16 hex>')
    process.exit(2)
  }

  initAdmin()
  const db = getFirestore()
  const snap = await db
    .collection('paymentLinks')
    .select('status', 'expiresAt', 'settleError', 'inventoryApplied', 'ownerUserId', 'storeId')
    .get()

  const buckets = new Map()
  for (const doc of snap.docs) {
    const data = doc.data()
    const fp = fingerprint(doc.id)
    const bucket = classifyLegacyLink(data)
    if (match) {
      if (fp === match)
        console.log(`${fp} ${bucket} owner=${data.ownerUserId} store=${data.storeId}`)
      continue
    }
    if (!buckets.has(bucket)) buckets.set(bucket, [])
    buckets.get(bucket).push(`${fp} owner=${data.ownerUserId} store=${data.storeId}`)
  }
  if (match) return

  console.log(`paymentLinks scanned: ${snap.size}`)
  for (const [bucket, rows] of [...buckets.entries()].sort()) {
    console.log(`${bucket}: ${rows.length}`)
    if (bucket === 'open' || bucket === 'paid_needs_review') {
      for (const row of rows) console.log(`  ${row}`)
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main()
}

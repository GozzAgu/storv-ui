#!/usr/bin/env node
/**
 * READ-ONLY report: merchantPayouts docs that still hold a full bank account number (written
 * before payments Step 3, which stores the last 4 digits only). It never writes, updates or
 * deletes, and never prints account numbers or names: only the count and document IDs.
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json node scripts/payments/report-payout-account-numbers.mjs
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=<id> node scripts/payments/report-payout-account-numbers.mjs
 *
 * Exit code: 0 on success (whatever the count), 2 on bad usage.
 * Do not commit the output: it contains document IDs.
 */
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

/** True when the field looks like more than a last-4 fragment. Exported for tests. */
export function holdsFullAccountNumber(data) {
  const value = data?.accountNumber
  return typeof value === 'string' && value.replace(/\D/g, '').length > 4
}

async function main() {
  initAdmin()
  const db = getFirestore()
  const snap = await db.collection('merchantPayouts').select('accountNumber').get()
  const ids = snap.docs.filter((d) => holdsFullAccountNumber(d.data())).map((d) => d.id)
  console.log(`merchantPayouts scanned: ${snap.size}`)
  console.log(`docs with a full account number: ${ids.length}`)
  for (const id of ids) console.log(`  ${id}`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main()
}

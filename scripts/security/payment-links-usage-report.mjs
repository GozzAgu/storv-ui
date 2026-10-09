#!/usr/bin/env node
/**
 * READ-ONLY usage report for the legacy `paymentLinks` collection, to decide whether the old
 * public payment-link endpoints can be switched off. Never writes anything.
 *
 * Usage: FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json node scripts/security/payment-links-usage-report.mjs
 */
import { readFileSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

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

function toDate(v) {
  if (!v) return null
  if (typeof v.toDate === 'function') return v.toDate()
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

async function main() {
  initializeApp({ credential: cert(loadCredentials()) })
  const db = getFirestore()
  const now = Date.now()
  const DAY = 86_400_000

  const snap = await db.collection('paymentLinks').get()
  const byStatus = {}
  const bySource = {}
  const merchants = new Set()
  const paidMerchants = new Set()
  let activeUnexpired = 0
  let createdLast30d = 0
  let paidLast90d = 0
  let lastCreatedAt = null
  let lastPaidAt = null

  for (const doc of snap.docs) {
    const d = doc.data()
    const status = d.status || 'unknown'
    byStatus[status] = (byStatus[status] || 0) + 1
    const source = d.source || 'unknown'
    bySource[source] = (bySource[source] || 0) + 1
    if (d.ownerUserId) merchants.add(d.ownerUserId)

    const createdAt = toDate(d.createdAt)
    const paidAt = toDate(d.paidAt)
    const expiresAt = toDate(d.expiresAt)
    if (createdAt && now - createdAt.getTime() < 30 * DAY) createdLast30d += 1
    if (status === 'paid') {
      if (d.ownerUserId) paidMerchants.add(d.ownerUserId)
      if (paidAt && now - paidAt.getTime() < 90 * DAY) paidLast90d += 1
    }
    if (status === 'unpaid' && expiresAt && expiresAt.getTime() > now) activeUnexpired += 1
    if (createdAt && (!lastCreatedAt || createdAt > lastCreatedAt)) lastCreatedAt = createdAt
    if (paidAt && (!lastPaidAt || paidAt > lastPaidAt)) lastPaidAt = paidAt
  }

  const payoutsSnap = await db.collection('merchantPayouts').where('connected', '==', true).get()

  console.log(
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalLinks: snap.size,
        byStatus,
        bySource,
        distinctMerchants: merchants.size,
        merchantsWithPaidLinks: paidMerchants.size,
        activeUnexpiredLinks: activeUnexpired,
        createdLast30Days: createdLast30d,
        paidLast90Days: paidLast90d,
        lastCreatedAt: lastCreatedAt?.toISOString() || null,
        lastPaidAt: lastPaidAt?.toISOString() || null,
        connectedPayoutAccounts: payoutsSnap.size,
      },
      null,
      2
    )
  )
}

main().catch((err) => {
  console.error('Usage report failed:', err?.message || err)
  process.exit(1)
})

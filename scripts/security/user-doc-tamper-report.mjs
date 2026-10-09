#!/usr/bin/env node
/**
 * READ-ONLY report for the user-doc "added/removed field" rules bypass. It never writes,
 * updates or deletes anything; it reads users/* and their subscriptionAddOns, and Auth claims.
 *
 * Flags:
 * - users with no `subscription` or no `role` field (the precondition for the bypass)
 * - paid plan without Paystack evidence
 * - a `subscriptionAddOns` summary not backed by any server-written add-on doc
 * - twoFactorEnabled on the doc without the server-set Auth claim
 * - server-only billing fields present without Paystack evidence
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json node scripts/security/user-doc-tamper-report.mjs
 *
 * Output goes to stdout only. Do not commit the output: it contains document IDs.
 */
import { readFileSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

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

const PAID_EVIDENCE_FIELDS = [
  'paystackSubscriptionCode',
  'paystackCustomerCode',
  'lastPaystackReference',
]
const SERVER_BILLING_FIELDS = [
  'subscriptionStatus',
  'subscriptionCurrentPeriodEnd',
  'subscriptionBillingCycle',
  'subscriptionUpdatedAt',
  'paystackSubscriptionEmailToken',
]
const TFA_ENABLED_CLAIM = 'twoFactorEnabled'

function hasValue(v) {
  if (v == null) return false
  if (Array.isArray(v)) return v.length > 0
  if (typeof v === 'object') return Object.keys(v).length > 0
  return v !== '' && v !== false && v !== 0
}

async function main() {
  initializeApp({ credential: cert(loadCredentials()) })
  const db = getFirestore()
  const auth = getAuth()

  const users = await db.collection('users').get()
  const report = {
    scannedUsers: users.size,
    missingSubscriptionField: [],
    missingRoleField: [],
    paidPlanWithoutPaystack: [],
    addOnSummaryWithoutAddOnDocs: [],
    twoFactorDocWithoutClaim: [],
    twoFactorClaimLookupFailed: [],
    serverBillingFieldsWithoutPaystack: [],
  }

  for (const snap of users.docs) {
    const d = snap.data()
    const id = snap.id
    const hasPaystack = PAID_EVIDENCE_FIELDS.some((f) => hasValue(d[f]))

    if (!('subscription' in d)) report.missingSubscriptionField.push(id)
    if (!('role' in d)) report.missingRoleField.push(id)

    const plan = String(d.subscription || 'storvv_micro')
    if (plan !== 'storvv_micro' && !hasPaystack) {
      report.paidPlanWithoutPaystack.push({ id, plan })
    }

    if (hasValue(d.subscriptionAddOns)) {
      const addOns = await snap.ref.collection('subscriptionAddOns').limit(1).get()
      if (addOns.empty) report.addOnSummaryWithoutAddOnDocs.push(id)
    }

    if (d.twoFactorEnabled === true) {
      try {
        const record = await auth.getUser(id)
        if (record.customClaims?.[TFA_ENABLED_CLAIM] !== true) {
          report.twoFactorDocWithoutClaim.push(id)
        }
      } catch {
        report.twoFactorClaimLookupFailed.push(id)
      }
    }

    const presentServerFields = SERVER_BILLING_FIELDS.filter((f) => hasValue(d[f]))
    if (presentServerFields.length && !hasPaystack) {
      report.serverBillingFieldsWithoutPaystack.push({ id, fields: presentServerFields })
    }
  }

  report.counts = Object.fromEntries(
    Object.entries(report)
      .filter(([, v]) => Array.isArray(v))
      .map(([k, v]) => [k, v.length])
  )
  console.log(JSON.stringify(report, null, 2))
}

main().catch((err) => {
  console.error('Report failed:', err?.message || err)
  process.exit(1)
})

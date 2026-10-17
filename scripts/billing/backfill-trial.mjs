#!/usr/bin/env node
/**
 * One-time: give existing free owner accounts the free trial, starting today.
 *
 * DRY RUN by default: reads users/* and prints counts only (no document IDs). Writes nothing.
 * With --apply it sets `trialEndsAt` (now + 90 days) on each eligible owner doc, and only there.
 *
 * Eligible: role superAdmin, stored plan Micro (or none), and no trialEndsAt yet. Paid accounts,
 * staff and accounts that already had a trial are left alone.
 *
 * Usage:
 *   node --env-file=.env scripts/billing/backfill-trial.mjs            # dry run
 *   node --env-file=.env scripts/billing/backfill-trial.mjs --apply    # writes (needs sign-off)
 */
import { readFileSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

const TRIAL_DAYS = 90
const APPLY = process.argv.includes('--apply')

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

function storedPlan(raw) {
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  if (value === 'storvv_enterprise' || value === 'enterprise') return 'storvv_enterprise'
  if (value === 'storvv_medium' || value === 'medium') return 'storvv_medium'
  return 'storvv_micro'
}

async function main() {
  const credentials = loadCredentials()
  initializeApp({ credential: cert(credentials) })
  const db = getFirestore()

  const users = await db.collection('users').get()
  const counts = {
    project: credentials.project_id,
    mode: APPLY ? 'apply' : 'dry run',
    userDocs: users.size,
    owners: 0,
    notOwners: 0,
    paidOwners: 0,
    alreadyHadTrial: 0,
    eligible: 0,
    eligibleWithMoreThanOneStore: 0,
    written: 0,
  }
  const eligible = []

  for (const snap of users.docs) {
    const data = snap.data()
    if (data.role !== 'superAdmin') {
      counts.notOwners++
      continue
    }
    counts.owners++
    if (storedPlan(data.subscription) !== 'storvv_micro') {
      counts.paidOwners++
      continue
    }
    if (data.trialEndsAt != null) {
      counts.alreadyHadTrial++
      continue
    }
    counts.eligible++
    eligible.push(snap.ref)
    const stores = await snap.ref.collection('stores').count().get()
    if (stores.data().count > 1) counts.eligibleWithMoreThanOneStore++
  }

  if (APPLY) {
    const trialEndsAt = Timestamp.fromMillis(Date.now() + TRIAL_DAYS * 86_400_000)
    for (const ref of eligible) {
      const wrote = await db.runTransaction(async (tx) => {
        const fresh = await tx.get(ref)
        const data = fresh.data() || {}
        if (data.trialEndsAt != null || storedPlan(data.subscription) !== 'storvv_micro') {
          return false
        }
        tx.update(ref, { trialEndsAt })
        return true
      })
      if (wrote) counts.written++
    }
    counts.trialEndsAt = trialEndsAt.toDate().toISOString()
  }

  console.log(JSON.stringify(counts, null, 2))
}

main().catch((err) => {
  console.error('Backfill failed:', err?.message || err)
  process.exit(1)
})

#!/usr/bin/env node
/**
 * READ-ONLY exposure report for the staff `createdBy` workspace takeover and the
 * self-granted plan on user create. It never writes, updates or deletes anything.
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json node scripts/security/takeover-exposure-report.mjs
 *   (or FIREBASE_SERVICE_ACCOUNT_JSON='{...}')
 *
 * Output goes to stdout only. Do not commit the output: it contains document IDs.
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

const PAID_EVIDENCE_FIELDS = [
  'paystackSubscriptionCode',
  'paystackCustomerCode',
  'lastPaystackReference',
]

/** users/{owner}/stores/{store}/departments/{dept}/staff/{id} → owner from the path. */
function ownerFromPath(path) {
  const parts = path.split('/')
  return parts[0] === 'users' ? parts[1] : null
}

async function main() {
  initializeApp({ credential: cert(loadCredentials()) })
  const db = getFirestore()

  /** authUid → owners they are legitimately staff of (path-derived; staff can't move docs). */
  const legitOwnersByAuthUid = new Map()
  const addLegit = (authUid, owner) => {
    if (!authUid || !owner) return
    if (!legitOwnersByAuthUid.has(authUid)) legitOwnersByAuthUid.set(authUid, new Set())
    legitOwnersByAuthUid.get(authUid).add(owner)
  }

  // 1. Staff records whose createdBy does not match the owner path they live under.
  const staffSnap = await db.collectionGroup('staff').get()
  const createdByMismatch = []
  for (const doc of staffSnap.docs) {
    const owner = ownerFromPath(doc.ref.path)
    if (!owner) continue // legacy top-level staff collection
    const data = doc.data()
    addLegit(data.authUid, owner)
    const createdBy = String(data.createdBy || '').trim()
    if (createdBy && createdBy !== owner) {
      createdByMismatch.push({
        path: doc.ref.path,
        authUid: data.authUid || null,
        createdBy,
        pathOwner: owner,
        createdByUserExists: (await db.collection('users').doc(createdBy).get()).exists,
      })
    }
  }

  // Store member docs are owner-written, so they are also legitimate links.
  const membersSnap = await db.collectionGroup('members').get()
  for (const doc of membersSnap.docs) {
    addLegit(doc.id, ownerFromPath(doc.ref.path))
  }

  // 2. workspaceMembers entries pointing at an owner the user is not legitimately staff of.
  const wmSnap = await db.collectionGroup('workspaceMembers').get()
  const illegitimateWorkspaceMembers = []
  for (const doc of wmSnap.docs) {
    const owner = ownerFromPath(doc.ref.path)
    const memberUid = doc.id
    const legit = legitOwnersByAuthUid.get(memberUid)
    if (!legit || !legit.has(owner)) {
      illegitimateWorkspaceMembers.push({
        path: doc.ref.path,
        memberUid,
        owner,
        status: doc.data().status || null,
        legitimateOwners: legit ? [...legit] : [],
      })
    }
  }

  // 3. Owner user docs on a paid plan without any Paystack evidence.
  const usersSnap = await db.collection('users').get()
  const planWithoutPaystack = []
  const unexpectedRole = []
  for (const doc of usersSnap.docs) {
    const data = doc.data()
    const plan = String(data.subscription || 'storvv_micro')
    if (plan !== 'storvv_micro') {
      const hasEvidence = PAID_EVIDENCE_FIELDS.some((f) => Boolean(data[f]))
      if (!hasEvidence) {
        planWithoutPaystack.push({
          uid: doc.id,
          subscription: plan,
          subscriptionStatus: data.subscriptionStatus || null,
          subscriptionUpdatedAt: data.subscriptionUpdatedAt || null,
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || null,
        })
      }
    }
    if (data.role && data.role !== 'superAdmin') {
      unexpectedRole.push({ uid: doc.id, role: data.role })
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    scanned: {
      staffDocs: staffSnap.size,
      memberDocs: membersSnap.size,
      workspaceMemberDocs: wmSnap.size,
      userDocs: usersSnap.size,
    },
    staffCreatedByMismatch: { count: createdByMismatch.length, items: createdByMismatch },
    workspaceMembersWithoutLegitimateStaffLink: {
      count: illegitimateWorkspaceMembers.length,
      items: illegitimateWorkspaceMembers,
    },
    paidPlanWithoutPaystackEvidence: {
      count: planWithoutPaystack.length,
      note: 'Also produced by the dev plan switcher (/api/dev/set-subscription); review each.',
      items: planWithoutPaystack,
    },
    userDocsWithNonOwnerRole: { count: unexpectedRole.length, items: unexpectedRole },
  }
  console.log(JSON.stringify(report, null, 2))
}

main().catch((err) => {
  console.error('Exposure report failed:', err?.message || err)
  process.exit(1)
})

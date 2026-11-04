#!/usr/bin/env node
/**
 * Branch admins used to get every module action no matter what their stored `permissions` map
 * said. Admins now follow that map (so the owner can narrow it), and becoming an admin writes a
 * full one. Run this once before deploying the matching rules so every current admin keeps the
 * access they have today. Financial figures stay as the owner set them.
 *
 * DRY RUN BY DEFAULT: prints counts and staff record paths only, changes nothing. Pass --apply
 * to write the staff record and its member doc.
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json node scripts/security/backfill-admin-permissions.mjs
 *   FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json node scripts/security/backfill-admin-permissions.mjs --apply
 *
 * Output goes to stdout only. Do not commit the output: it contains account IDs.
 */
import { readFileSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'

const APPLY = process.argv.includes('--apply')

// Mirrors utils/staff-permissions.ts#FULL_STAFF_PERMISSIONS (financials are kept per record).
const FULL_ACTIONS = {
  products: { view: true, create: true, edit: true, delete: true },
  receipts: { view: true, create: true, edit: true, delete: true, refund: true },
  leads: { view: true, create: true, edit: true, delete: true },
  buybacks: { view: true, create: true, edit: true, delete: true },
  sellerLoans: { view: true, create: true, edit: true, delete: true },
  multiStoreSync: { view: true, create: true, edit: true, delete: true },
}

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

/** users/{owner}/stores/{store}/departments/{dept}/staff/{id} -> { owner, store } */
function scopeFromPath(path) {
  const parts = path.split('/')
  return parts.length === 8 &&
    parts[0] === 'users' &&
    parts[2] === 'stores' &&
    parts[4] === 'departments' &&
    parts[6] === 'staff'
    ? { owner: parts[1], store: parts[3] }
    : null
}

function financialsOf(permissions) {
  const f = permissions?.financials ?? {}
  return { view: f.view === true, create: false, edit: false, delete: false }
}

function isFull(permissions) {
  return Object.entries(FULL_ACTIONS).every(([module, actions]) =>
    Object.keys(actions).every((action) => permissions?.[module]?.[action] === true)
  )
}

async function main() {
  initializeApp({ credential: cert(loadCredentials()) })
  const db = getFirestore()

  const admins = await db.collectionGroup('staff').where('admin', '==', true).get()
  const report = {
    mode: APPLY ? 'apply' : 'dry-run',
    admins: admins.size,
    update: [],
    already: [],
    skipped: [],
    failed: [],
  }

  for (const doc of admins.docs) {
    const scope = scopeFromPath(doc.ref.path)
    const data = doc.data()
    if (!scope || data.createdBy !== scope.owner) {
      report.skipped.push(doc.ref.path)
      continue
    }
    if (isFull(data.permissions)) {
      report.already.push(doc.ref.path)
      continue
    }

    report.update.push(doc.ref.path)
    if (!APPLY) continue

    const permissions = { ...FULL_ACTIONS, financials: financialsOf(data.permissions) }
    const access = {
      permissions,
      role: FieldValue.delete(),
      canManageInventory: FieldValue.delete(),
      canManageReceipts: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    }
    try {
      const batch = db.batch()
      batch.update(doc.ref, access)
      const authUid = typeof data.authUid === 'string' ? data.authUid.trim() : ''
      if (authUid) {
        batch.set(db.doc(`users/${scope.owner}/stores/${scope.store}/members/${authUid}`), access, {
          merge: true,
        })
      }
      await batch.commit()
    } catch (err) {
      report.failed.push({ path: doc.ref.path, error: err?.code || 'write failed' })
    }
  }

  console.log(
    JSON.stringify(
      {
        ...report,
        counts: {
          update: report.update.length,
          already: report.already.length,
          skipped: report.skipped.length,
          failed: report.failed.length,
        },
      },
      null,
      2
    )
  )
  if (report.failed.length) process.exitCode = 1
}

main().catch((err) => {
  console.error(err?.message || err)
  process.exit(1)
})

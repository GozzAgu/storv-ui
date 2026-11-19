#!/usr/bin/env node
/**
 * Items received by transfer used to be saved with the receiver's UID in `createdBy`. Owner
 * screens only list items whose `createdBy` is the owner, so that stock was invisible to them.
 *
 * They also kept the sending branch's `dateIn`, so the receiving branch showed the date the
 * stock first entered the business rather than the day it arrived there.
 *
 * For every item with `transferredFrom` set, this:
 *   - when `createdBy` isn't the store owner: moves it into `receivedBy` (unless that is already
 *     set), fills `receivedByName` from the matching received transfer, and sets `createdBy` to
 *     the owner's UID
 *   - when it has no `originalDateIn` yet (items received before the fix): keeps the old date
 *     as `originalDateIn` and sets `dateIn` to when the item arrived. Arrival is the item's
 *     `createdAt` (the receiving branch's copy is created on receipt), else `transferredAt`.
 *     `transferredAt` alone moves forward each time bulk stock is topped up, so it comes second.
 *
 * DRY RUN by default; pass --apply to write.
 *
 * Usage:
 *   node --env-file=.env scripts/data/backfill-transfer-item-owner.mjs [ownerId] [--apply]
 *
 * With no ownerId every owner under `users/` is checked. Against the emulator, set
 * FIRESTORE_EMULATOR_HOST (and optionally GCLOUD_PROJECT) instead of service account variables.
 */
import { readFileSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { Timestamp, getFirestore } from 'firebase-admin/firestore'

const BATCH_SIZE = 400

function initApp() {
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'demo-storvv' })
  }
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) })
  }
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  if (!path) {
    console.error('Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON')
    process.exit(2)
  }
  return initializeApp({ credential: cert(JSON.parse(readFileSync(path, 'utf8'))) })
}

/** `${destinationStoreId}:${receiverUid}` -> receiver name, from the owner's received transfers. */
async function receiverNames(ownerRef) {
  const names = new Map()
  const snap = await ownerRef.collection('storeTransfers').get()
  for (const doc of snap.docs) {
    const t = doc.data()
    const uid = String(t.receivedBy || t.completedBy || '')
    const name = String(t.receivedByName || '').trim()
    if (uid && name && t.destinationStoreId) names.set(`${t.destinationStoreId}:${uid}`, name)
  }
  return names
}

/** A Firestore Timestamp, Date or date string as a Timestamp, or null. */
function asTimestamp(value) {
  if (!value) return null
  if (value instanceof Timestamp) return value
  if (typeof value.toDate === 'function') return Timestamp.fromDate(value.toDate())
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : Timestamp.fromDate(d)
}

const day = (ts) => ts?.toDate().toISOString().slice(0, 10) ?? null

async function backfillOwner(db, ownerId, apply) {
  const ownerRef = db.collection('users').doc(ownerId)
  const stores = await ownerRef.collection('stores').get()
  if (stores.empty) return []

  const names = await receiverNames(ownerRef)
  const changes = []
  for (const store of stores.docs) {
    const items = await store.ref
      .collection('inventoryItems')
      .where('transferredFrom', '>', '')
      .get()
    for (const item of items.docs) {
      const d = item.data()
      const previous = String(d.createdBy || '')
      const update = {}

      if (previous !== ownerId) {
        update.createdBy = ownerId
        if (!d.receivedBy && previous) update.receivedBy = previous
        const receiver = String(update.receivedBy || d.receivedBy || '')
        const name = receiver && names.get(`${store.id}:${receiver}`)
        if (!d.receivedByName && name) update.receivedByName = name
      }

      if (d.originalDateIn === undefined) {
        const arrived = asTimestamp(d.createdAt) ?? asTimestamp(d.transferredAt)
        const current = asTimestamp(d.dateIn ?? d.DateIn)
        if (arrived && day(arrived) !== day(current)) {
          update.originalDateIn = d.dateIn ?? d.DateIn ?? null
          update.dateIn = arrived
        }
      }

      if (Object.keys(update).length === 0) continue

      changes.push({
        ref: item.ref,
        update,
        log: {
          ownerId,
          storeId: store.id,
          itemId: item.id,
          name: d.name || d.itemName || '',
          previousCreatedBy: previous || null,
          ...update,
          ...(update.dateIn && {
            dateIn: day(update.dateIn),
            originalDateIn: day(asTimestamp(update.originalDateIn)),
          }),
        },
      })
    }
  }

  if (apply) {
    for (let i = 0; i < changes.length; i += BATCH_SIZE) {
      const batch = db.batch()
      for (const c of changes.slice(i, i + BATCH_SIZE)) batch.update(c.ref, c.update)
      await batch.commit()
    }
  }
  return changes.map((c) => c.log)
}

async function main() {
  const [ownerArg] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  const apply = process.argv.includes('--apply')
  initApp()
  const db = getFirestore()

  const ownerIds = ownerArg
    ? [ownerArg]
    : (await db.collection('users').listDocuments()).map((ref) => ref.id)

  const all = []
  for (const ownerId of ownerIds) all.push(...(await backfillOwner(db, ownerId, apply)))

  for (const row of all) console.log(JSON.stringify(row))
  console.log(
    `\n${apply ? 'Updated' : 'Would update'} ${all.length} item(s) across ${ownerIds.length} owner(s).` +
      (apply ? '' : ' Run again with --apply to write.')
  )
}

main().catch((err) => {
  console.error('Backfill failed:', err?.message || err)
  process.exit(1)
})

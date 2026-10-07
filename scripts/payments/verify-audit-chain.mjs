#!/usr/bin/env node
/**
 * READ-ONLY verifier for the Payments V2 audit hash chain. It never writes, updates or deletes.
 *
 * For each store it recomputes users/{owner}/stores/{store}/paymentEvents in seq order, then checks
 * the chain head (paymentAudit/head) and every daily anchor in paymentAuditAnchors. It prints the
 * first broken link per store. The chain is tamper evident, not tamper proof: someone with Admin
 * access can rewrite events, head and anchors together, so compare anchors with the copies in the
 * server logs (`payments-audit-anchor`) when investigating.
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json node scripts/payments/verify-audit-chain.mjs
 *   ... --owner <uid> --store <storeId>     (one store only)
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=<id> node scripts/payments/verify-audit-chain.mjs
 *
 * Exit code: 0 when every chain verifies, 1 when any chain is broken, 2 on bad usage.
 * Output goes to stdout only. Do not commit the output: it contains document IDs.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const jiti = createJiti(import.meta.url)
const { verifyChain } = await jiti.import(
  fileURLToPath(new URL('../../server/utils/payments/audit-hash.ts', import.meta.url))
)

const ANCHORS_COLLECTION = 'paymentAuditAnchors'

function argValue(name) {
  const i = process.argv.indexOf(name)
  return i === -1 ? undefined : process.argv[i + 1]
}

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

async function verifyStore(db, ownerId, storeId) {
  const store = db.doc(`users/${ownerId}/stores/${storeId}`)
  const [eventsSnap, headSnap, anchorsSnap] = await Promise.all([
    store.collection('paymentEvents').orderBy('seq').get(),
    store.collection('paymentAudit').doc('head').get(),
    db
      .collection(ANCHORS_COLLECTION)
      .where('ownerId', '==', ownerId)
      .where('storeId', '==', storeId)
      .get(),
  ])
  const head = headSnap.exists
    ? { seq: Number(headSnap.get('seq')), hash: String(headSnap.get('hash')) }
    : null
  const result = verifyChain(
    eventsSnap.docs.map((d) => d.data()),
    { head, anchors: anchorsSnap.docs.map((d) => d.data()) }
  )
  return { result, events: eventsSnap.size, anchors: anchorsSnap.size }
}

async function main() {
  initAdmin()
  const db = getFirestore()
  const owner = argValue('--owner')
  const storeArg = argValue('--store')
  if (Boolean(owner) !== Boolean(storeArg)) {
    console.error('Pass both --owner and --store, or neither')
    process.exit(2)
  }

  const stores = []
  if (owner) {
    stores.push({ ownerId: owner, storeId: storeArg })
  } else {
    const heads = await db.collectionGroup('paymentAudit').get()
    for (const d of heads.docs) {
      const storeRef = d.ref.parent.parent
      const ownerRef = storeRef?.parent.parent
      if (d.id !== 'head' || !storeRef || !ownerRef) continue
      stores.push({ ownerId: ownerRef.id, storeId: storeRef.id })
    }
  }

  let broken = 0
  for (const { ownerId, storeId } of stores) {
    const { result, events, anchors } = await verifyStore(db, ownerId, storeId)
    if (result.ok) {
      console.log(`OK      ${ownerId}/${storeId} events=${events} anchors=${anchors}`)
    } else {
      broken += 1
      const b = result.firstBreak
      console.log(
        `BROKEN  ${ownerId}/${storeId} events=${events} anchors=${anchors} reason=${b.reason} seq=${b.seq}`
      )
    }
  }
  console.log(`\nStores checked: ${stores.length}. Broken chains: ${broken}.`)
  process.exit(broken > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(2)
})

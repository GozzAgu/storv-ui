#!/usr/bin/env node
/**
 * READ-ONLY: the form fields (name, label, type) of every category in one store. Writes nothing.
 *
 * Usage:
 *   node --env-file=.env scripts/data/folder-fields-report.mjs <ownerId> <storeId>
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

const [ownerId, storeId] = process.argv.slice(2)
if (!ownerId || !storeId) {
  console.error('Usage: <ownerId> <storeId>')
  process.exit(2)
}
initializeApp({ credential: cert(loadCredentials()) })
const folders = await getFirestore()
  .collection(`users/${ownerId}/stores/${storeId}/inventoryFolders`)
  .get()
console.log(
  JSON.stringify(
    folders.docs.map((f) => ({
      folder: f.data().name,
      fields: (f.data().template?.fields || []).map((x) => ({
        name: x.name,
        label: x.label,
        type: x.type,
        required: !!x.required,
      })),
    })),
    null,
    2
  )
)

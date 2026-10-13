#!/usr/bin/env node
/**
 * Moves a legacy `twoFactorSecret` off users/{uid} into users/{uid}/security/twoFactor (the
 * location server/utils/two-factor.ts reads first), then deletes the legacy field.
 *
 * DRY RUN BY DEFAULT: lists counts and document IDs only, writes nothing. Pass --apply to write.
 * Secrets are never printed.
 *
 * - "move": no secret in security/twoFactor yet. Copy it there, then delete the legacy field.
 * - "drop": security/twoFactor already has a secret (it wins), or the legacy value is empty.
 *   Delete the legacy field only.
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json node scripts/security/migrate-legacy-2fa-secret.mjs
 *   FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json node scripts/security/migrate-legacy-2fa-secret.mjs --apply
 *
 * Output goes to stdout only. Do not commit the output: it contains document IDs.
 */
import { readFileSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'

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

async function main() {
  initializeApp({ credential: cert(loadCredentials()) })
  const db = getFirestore()

  const users = await db.collection('users').get()
  const report = { mode: APPLY ? 'apply' : 'dry-run', scannedUsers: users.size, move: [], drop: [], failed: [] }

  for (const snap of users.docs) {
    const data = snap.data()
    if (!('twoFactorSecret' in data)) continue

    const legacy = data.twoFactorSecret
    const securityRef = snap.ref.collection('security').doc('twoFactor')
    const security = await securityRef.get()
    const hasCurrent =
      security.exists && typeof security.data()?.secret === 'string' && security.data().secret.length > 0
    const action = !hasCurrent && typeof legacy === 'string' && legacy.length > 0 ? 'move' : 'drop'
    report[action].push(snap.id)

    if (!APPLY) continue
    try {
      const batch = db.batch()
      if (action === 'move') {
        batch.set(securityRef, {
          secret: legacy,
          method: data.twoFactorMethod === 'phone' ? 'phone' : 'totp',
          migratedFromUserDoc: true,
          updatedAt: FieldValue.serverTimestamp(),
        })
      }
      batch.update(snap.ref, { twoFactorSecret: FieldValue.delete() })
      await batch.commit()
    } catch (err) {
      report.failed.push({ id: snap.id, error: err?.code || 'write failed' })
    }
  }

  report.counts = { move: report.move.length, drop: report.drop.length, failed: report.failed.length }
  console.log(JSON.stringify(report, null, 2))
}

main().catch((err) => {
  console.error('Migration failed:', err?.message || err)
  process.exit(1)
})

#!/usr/bin/env node
/**
 * Records which business each existing staff login belongs to, as the server-only `staffOwner`
 * custom claim that staff routes and staff sign-in now check (server/utils/staff-login-target.ts).
 * Run once before deploying the rules that make staff records server-written, so no current
 * staff member is refused at sign-in.
 *
 * DRY RUN BY DEFAULT: prints counts and login IDs only, changes nothing. Pass --apply to write.
 *
 * - "stamp": every staff record for the login is under one business. That business is recorded.
 * - "already": the login already has the claim; it is left alone.
 * - "ambiguous": records under several businesses. The one created within 10 minutes of the login
 *   is used if exactly one matches; otherwise nothing is written and the login is listed so you
 *   can decide (the server accepts such a login when the record it acts on was created with it).
 * - "missing": the login no longer exists.
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json node scripts/security/stamp-staff-login-owners.mjs
 *   FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json node scripts/security/stamp-staff-login-owners.mjs --apply
 *
 * Output goes to stdout only. Do not commit the output: it contains login IDs.
 */
import { readFileSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const APPLY = process.argv.includes('--apply')
const CLAIM = 'staffOwner'
const WINDOW_MS = 10 * 60_000

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

/** users/{owner}/stores/{store}/departments/{dept}/staff/{id} -> owner */
function ownerFromPath(path) {
  const parts = path.split('/')
  return parts.length === 8 &&
    parts[0] === 'users' &&
    parts[4] === 'departments' &&
    parts[6] === 'staff'
    ? parts[1]
    : null
}

function millis(value) {
  if (!value) return null
  if (typeof value.toMillis === 'function') return value.toMillis()
  const parsed = Date.parse(String(value))
  return Number.isFinite(parsed) ? parsed : null
}

async function main() {
  initializeApp({ credential: cert(loadCredentials()) })
  const db = getFirestore()
  const auth = getAuth()

  const staff = await db.collectionGroup('staff').get()
  /** authUid -> [{ owner, createdAt }] */
  const byLogin = new Map()
  for (const doc of staff.docs) {
    const authUid = doc.data().authUid
    const owner = ownerFromPath(doc.ref.path)
    if (typeof authUid !== 'string' || !authUid || !owner) continue
    const list = byLogin.get(authUid) ?? []
    list.push({ owner, createdAt: millis(doc.data().createdAt) })
    byLogin.set(authUid, list)
  }

  const report = {
    mode: APPLY ? 'apply' : 'dry-run',
    logins: byLogin.size,
    stamp: [],
    already: [],
    ambiguous: [],
    missing: [],
    failed: [],
  }

  for (const [authUid, records] of byLogin) {
    let user
    try {
      user = await auth.getUser(authUid)
    } catch (err) {
      if (err?.code === 'auth/user-not-found') {
        report.missing.push(authUid)
        continue
      }
      report.failed.push({ authUid, error: err?.code || 'lookup failed' })
      continue
    }
    if (typeof user.customClaims?.[CLAIM] === 'string') {
      report.already.push(authUid)
      continue
    }

    const owners = [...new Set(records.map((r) => r.owner))]
    let owner = owners.length === 1 ? owners[0] : null
    if (!owner) {
      const created = Date.parse(user.metadata.creationTime)
      const matches = [
        ...new Set(
          records
            .filter((r) => r.createdAt !== null && Math.abs(r.createdAt - created) <= WINDOW_MS)
            .map((r) => r.owner)
        ),
      ]
      owner = matches.length === 1 ? matches[0] : null
    }
    if (!owner) {
      report.ambiguous.push({ authUid, owners })
      continue
    }

    report.stamp.push(authUid)
    if (!APPLY) continue
    try {
      await auth.setCustomUserClaims(authUid, { ...(user.customClaims || {}), [CLAIM]: owner })
    } catch (err) {
      report.failed.push({ authUid, error: err?.code || 'write failed' })
    }
  }

  console.log(
    JSON.stringify(
      {
        ...report,
        counts: {
          stamp: report.stamp.length,
          already: report.already.length,
          ambiguous: report.ambiguous.length,
          missing: report.missing.length,
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

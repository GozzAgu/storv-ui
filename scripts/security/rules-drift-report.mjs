#!/usr/bin/env node
/**
 * READ-ONLY: is the deployed Firestore ruleset the same as firestore.rules in this checkout?
 * Reads the live release through the Firebase Rules API; never deploys or changes anything.
 *
 * Usage:
 *   node --env-file=.env scripts/security/rules-drift-report.mjs [rules-file]
 * rules-file defaults to firestore.rules (e.g. pass a copy from an earlier commit).
 */
import { readFileSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'

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

const normalise = (text) => text.replace(/\r\n/g, '\n').trimEnd()

async function main() {
  const credentials = loadCredentials()
  const app = initializeApp({ credential: cert(credentials) })
  const { access_token: token } = await app.options.credential.getAccessToken()
  const api = 'https://firebaserules.googleapis.com/v1'
  const headers = { Authorization: `Bearer ${token}` }

  const releaseRes = await fetch(
    `${api}/projects/${credentials.project_id}/releases/cloud.firestore`,
    { headers }
  )
  if (!releaseRes.ok) throw new Error(`release lookup failed: HTTP ${releaseRes.status}`)
  const release = await releaseRes.json()

  const rulesetRes = await fetch(`${api}/${release.rulesetName}`, { headers })
  if (!rulesetRes.ok) throw new Error(`ruleset lookup failed: HTTP ${rulesetRes.status}`)
  const ruleset = await rulesetRes.json()
  const deployed = normalise(ruleset.source?.files?.[0]?.content || '')
  const local = normalise(readFileSync(process.argv[2] || 'firestore.rules', 'utf8'))

  const deployedLines = new Set(deployed.split('\n'))
  const localLines = new Set(local.split('\n'))
  console.log(
    JSON.stringify(
      {
        project: credentials.project_id,
        deployedAt: release.updateTime,
        matchesLocal: deployed === local,
        linesOnlyInLocal: [...localLines].filter((l) => !deployedLines.has(l)).length,
        linesOnlyDeployed: [...deployedLines].filter((l) => !localLines.has(l)).length,
        deployedHasTrialRules: deployed.includes('ownerTrialActive'),
        deployedHasViewOnlyRules: deployed.includes('planAllowsStoreWrite'),
        deployedHasCategoryAccessRules: deployed.includes('memberCanOpenCategory'),
      },
      null,
      2
    )
  )
}

main().catch((err) => {
  console.error('Rules drift check failed:', err?.message || err)
  process.exit(1)
})

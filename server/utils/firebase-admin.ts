import { initializeApp, cert, type App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let adminApp: App | null = null

/** Resolve JSON string from runtime config, process env, or base64 (common on Vercel for large secrets). */
function resolveServiceAccountJsonString(config: { firebaseServiceAccount?: string }): string {
  const fromConfig = (config.firebaseServiceAccount as string)?.trim() || ''
  const fromNuxtEnv = process.env.NUXT_FIREBASE_SERVICE_ACCOUNT?.trim() || ''
  const fromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() || ''
  const raw = fromConfig || fromNuxtEnv || fromEnv
  if (raw) return raw
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_B64?.trim() || ''
  if (b64) {
    try {
      return Buffer.from(b64, 'base64').toString('utf8')
    } catch {
      return ''
    }
  }
  return ''
}

function getAdminApp(): App {
  if (adminApp) return adminApp
  const config = useRuntimeConfig()
  const serviceAccountJson = resolveServiceAccountJsonString(config)
  const credentialsPath = (config.firebaseServiceAccountPath as string)?.trim() || process.env.GOOGLE_APPLICATION_CREDENTIALS || ''

  let serviceAccount: { project_id?: string; client_email?: string; private_key?: string }
  try {
    if (serviceAccountJson && serviceAccountJson.startsWith('{')) {
      serviceAccount = JSON.parse(serviceAccountJson)
    } else if (credentialsPath) {
      const path = resolve(process.cwd(), credentialsPath)
      const json = readFileSync(path, 'utf8')
      serviceAccount = JSON.parse(json)
    } else {
      throw new Error(
        'Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON (full JSON of your Firebase service account) in your server environment — e.g. Vercel: Project → Settings → Environment Variables. For very large keys, use FIREBASE_SERVICE_ACCOUNT_JSON_B64 (base64 of the JSON). Locally you can use FIREBASE_SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS. See .env.example.'
      )
    }
    adminApp = initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]) })
    return adminApp
  } catch (e: any) {
    if (e?.message?.includes('Firebase Admin not configured')) throw e
    throw new Error(
      'Invalid Firebase service account. Use FIREBASE_SERVICE_ACCOUNT_JSON (full JSON) or a path to the JSON file. ' +
      (e?.message || '')
    )
  }
}

export function getAdminAuth() {
  return getAuth(getAdminApp())
}

export function getAdminFirestore() {
  return getFirestore(getAdminApp())
}

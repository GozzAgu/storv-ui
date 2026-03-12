import { initializeApp, cert, type App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let adminApp: App | null = null

function getAdminApp(): App {
  if (adminApp) return adminApp
  const config = useRuntimeConfig()
  const serviceAccountJson = (config.firebaseServiceAccount as string)?.trim() || ''
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
        'Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON (full JSON) or FIREBASE_SERVICE_ACCOUNT_PATH / GOOGLE_APPLICATION_CREDENTIALS (path to JSON file) in .env. See .env.example.'
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

import { initializeApp, cert, type App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'

let adminApp: App | null = null

/** File-based credentials are local-only; serverless bundles do not include gitignored JSON keys. */
function isServerlessRuntime(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AWSLAMBDA_FUNCTION_NAME)
}

/**
 * Resolve JSON: prefer live `process.env` on serverless (Vercel injects secrets at runtime; build-time
 * nuxt config may have been empty). Locally, runtimeConfig from nuxt.config is fine.
 */
function resolveServiceAccountJsonString(config: { firebaseServiceAccount?: string }): string {
  const fromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() || ''
  const fromNuxtEnv = process.env.NUXT_FIREBASE_SERVICE_ACCOUNT?.trim() || ''
  const fromConfig = (config.firebaseServiceAccount as string)?.trim() || ''
  const order = isServerlessRuntime() ? [fromEnv, fromNuxtEnv, fromConfig] : [fromConfig, fromNuxtEnv, fromEnv]
  const raw = order.find(Boolean) || ''
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

/** Paths are ignored on Vercel/Lambda so a path baked in at build time cannot override JSON env. */
function resolveCredentialPath(config: { firebaseServiceAccountPath?: string }): string {
  if (isServerlessRuntime()) return ''
  return (
    (config.firebaseServiceAccountPath as string)?.trim() ||
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim() ||
    ''
  )
}

const SERVERLESS_USE_JSON_NOT_PATH =
  'On Vercel/Lambda, FIREBASE_SERVICE_ACCOUNT_PATH / GOOGLE_APPLICATION_CREDENTIALS do not work: your key file is not on the server. ' +
  'Remove those from Production environment variables. Set FIREBASE_SERVICE_ACCOUNT_JSON (full JSON, one line) or FIREBASE_SERVICE_ACCOUNT_JSON_B64, then redeploy.'

/**
 * Normalize common .env / dashboard mistakes: BOM, outer '…' or "…" quotes around the whole JSON.
 */
function tryParseServiceAccountJson(raw: string): Record<string, unknown> | null {
  if (!raw) return null
  let s = raw.trim()
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1).trim()
  if (s.length >= 2) {
    const open = s[0]
    const close = s[s.length - 1]
    if ((open === "'" && close === "'") || (open === '"' && close === '"')) {
      s = s.slice(1, -1).trim()
    }
  }
  try {
    const obj = JSON.parse(s) as Record<string, unknown>
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null
    if (obj.type === 'service_account' && typeof obj.private_key === 'string') {
      return obj
    }
  } catch {
    return null
  }
  return null
}

/**
 * Vercel / dotenv often stores PEM newlines as literal backslash-n; Firebase needs real newlines.
 */
function normalizeServiceAccountForCert(account: { private_key?: string }) {
  if (typeof account.private_key === 'string') {
    account.private_key = account.private_key.replace(/\\n/g, '\n')
  }
}

function getAdminApp(): App {
  if (adminApp) return adminApp
  const config = useRuntimeConfig()
  const jsonRaw = resolveServiceAccountJsonString(config)
  const credentialsPath = resolveCredentialPath(config)

  let serviceAccount: { project_id?: string; client_email?: string; private_key?: string }
  try {
    const fromJson = tryParseServiceAccountJson(jsonRaw)
    if (fromJson) {
      serviceAccount = fromJson as typeof serviceAccount
    } else if (jsonRaw) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_JSON is set but is not valid service-account JSON (expected type "service_account" and private_key). ' +
          'Use a single-line object in .env, or FIREBASE_SERVICE_ACCOUNT_PATH=./your-key.json locally. Restart nuxt dev after changing .env.'
      )
    } else if (credentialsPath) {
      const pathToRead = isAbsolute(credentialsPath) ? credentialsPath : resolve(process.cwd(), credentialsPath)
      const fileContent = readFileSync(pathToRead, 'utf8')
      const fromFile = tryParseServiceAccountJson(fileContent)
      if (!fromFile) {
        throw new Error(`Could not parse service account JSON at ${pathToRead}`)
      }
      serviceAccount = fromFile as typeof serviceAccount
    } else {
      throw new Error(
        'Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON (full JSON of your Firebase service account) in your server environment — e.g. Vercel: Project → Settings → Environment Variables. For very large keys, use FIREBASE_SERVICE_ACCOUNT_JSON_B64 (base64 of the JSON). Locally you can use FIREBASE_SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS. See .env.example.'
      )
    }
    normalizeServiceAccountForCert(serviceAccount)
    adminApp = initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]) })
    return adminApp
  } catch (e: any) {
    if (
      e?.message?.includes('Firebase Admin not configured') ||
      e?.message?.includes('FIREBASE_SERVICE_ACCOUNT_JSON is set') ||
      e?.message?.includes('Could not parse service account JSON at') ||
      e?.message?.includes('On Vercel/Lambda, FIREBASE_SERVICE_ACCOUNT_PATH')
    ) {
      throw e
    }
    if (e?.code === 'ENOENT') {
      throw new Error(
        `${SERVERLESS_USE_JSON_NOT_PATH} (Tried to read: ${e.path || credentialsPath})`
      )
    }
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

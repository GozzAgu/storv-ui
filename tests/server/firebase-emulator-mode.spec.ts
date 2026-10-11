// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const m = vi.hoisted(() => ({
  initializeApp: vi.fn((opts: unknown) => ({ opts })),
  cert: vi.fn(),
  readFileSync: vi.fn(),
  config: {} as Record<string, unknown>,
}))

vi.mock('firebase-admin/app', () => ({ initializeApp: m.initializeApp, cert: m.cert }))
vi.mock('firebase-admin/firestore', () => ({ getFirestore: (app: unknown) => ({ app }) }))
vi.mock('firebase-admin/auth', () => ({ getAuth: (app: unknown) => ({ app }) }))
vi.mock('firebase-admin/storage', () => ({
  getStorage: () => ({ bucket: (name: string) => ({ name }) }),
}))
vi.mock('node:fs', () => ({ readFileSync: m.readFileSync }))

const PRODUCTION_PUBLIC = {
  apiKey: 'prod-key',
  authDomain: 'storv-ux.firebaseapp.com',
  projectId: 'storv-ux',
  storageBucket: 'storv-ux.firebasestorage.app',
  messagingSenderId: '1',
  appId: '1:1:web:1',
  measurementId: 'G-1',
}

vi.stubGlobal('useRuntimeConfig', () => m.config)

const ENV_KEYS = [
  'VERCEL',
  'FIRESTORE_EMULATOR_HOST',
  'FIREBASE_AUTH_EMULATOR_HOST',
  'FIREBASE_STORAGE_EMULATOR_HOST',
] as const

describe('Firebase emulator mode', () => {
  const saved: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {}

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    for (const k of ENV_KEYS) {
      saved[k] = process.env[k]
      delete process.env[k]
    }
  })

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k]
      else process.env[k] = saved[k]
    }
  })

  it('uses the offline demo project with no credentials, even with a production key configured', async () => {
    m.config = {
      firebaseServiceAccountPath: './storv-ux-key.json',
      public: { firebaseEmulators: true, firebase: PRODUCTION_PUBLIC },
    }
    const { getAdminFirestore, getAdminStorageBucket } = await import(
      '~/server/utils/firebase-admin'
    )

    getAdminFirestore()

    expect(m.initializeApp).toHaveBeenCalledWith({ projectId: 'demo-storvv' })
    expect(m.cert).not.toHaveBeenCalled()
    expect(m.readFileSync).not.toHaveBeenCalled()
    expect(process.env.FIRESTORE_EMULATOR_HOST).toBe('127.0.0.1:8080')
    expect(process.env.FIREBASE_AUTH_EMULATOR_HOST).toBe('127.0.0.1:9099')
    expect(process.env.FIREBASE_STORAGE_EMULATOR_HOST).toBe('127.0.0.1:9199')
    expect(getAdminStorageBucket()).toEqual({ name: 'demo-storvv.appspot.com' })
  })

  it('accepts the flag as Nuxt hands back env overrides (1)', async () => {
    m.config = { public: { firebaseEmulators: 1, firebase: PRODUCTION_PUBLIC } }
    const { getAdminFirestore } = await import('~/server/utils/firebase-admin')
    getAdminFirestore()
    expect(m.initializeApp).toHaveBeenCalledWith({ projectId: 'demo-storvv' })
  })

  it('refuses emulator mode on Vercel', async () => {
    process.env.VERCEL = '1'
    m.config = { public: { firebaseEmulators: true, firebase: PRODUCTION_PUBLIC } }
    const { getAdminFirestore } = await import('~/server/utils/firebase-admin')
    expect(() => getAdminFirestore()).toThrow(/local development only/)
    expect(m.initializeApp).not.toHaveBeenCalled()
  })

  it('gives the browser the demo project, never the production values from .env', async () => {
    m.config = { public: { firebaseEmulators: true, firebase: PRODUCTION_PUBLIC } }
    const { getFirebaseConfig } = await import('~/config/firebase.config')
    const web = getFirebaseConfig()
    expect(web.projectId).toBe('demo-storvv')
    expect(JSON.stringify(web)).not.toMatch(/storv-ux|prod-key/)
  })

  it('leaves the normal config alone when the flag is off', async () => {
    m.config = { public: { firebaseEmulators: false, firebase: PRODUCTION_PUBLIC } }
    const { getFirebaseConfig } = await import('~/config/firebase.config')
    expect(getFirebaseConfig().projectId).toBe('storv-ux')
  })
})

#!/usr/bin/env node
/**
 * Local development against the Firebase emulators instead of the real project.
 * Starts Auth, Firestore and Storage emulators for the offline `demo-storvv` project, then
 * `nuxi dev` with NUXT_PUBLIC_FIREBASE_EMULATORS=1. Data is kept in .emulator-data between runs.
 * Requires Java (Firebase emulator dependency).
 *
 *   npm run dev:emulators            # app on :3000, emulator UI on :4000
 *   npm run dev:emulators -- --port 3311
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'

const PROJECT_ID = 'demo-storvv'
const DATA_DIR = '.emulator-data'
const JAVA_PATHS = ['/opt/homebrew/opt/openjdk@21/bin', '/usr/local/opt/openjdk@21/bin']

const env = { ...process.env, NUXT_PUBLIC_FIREBASE_EMULATORS: '1' }
for (const dir of JAVA_PATHS) {
  if (existsSync(`${dir}/java`)) {
    env.PATH = `${dir}:${env.PATH || ''}`
    break
  }
}

if (spawnSync('java', ['-version'], { stdio: 'pipe', env }).status !== 0) {
  console.error('Firebase emulators need Java. Install on macOS: brew install openjdk@21')
  process.exit(1)
}

mkdirSync(DATA_DIR, { recursive: true })
const devArgs = process.argv.slice(2).join(' ')
const cmd = [
  'firebase emulators:exec',
  `--project ${PROJECT_ID}`,
  '--only auth,firestore,storage',
  '--ui',
  `--import ${DATA_DIR}`,
  `--export-on-exit ${DATA_DIR}`,
  `"nuxi dev ${devArgs}"`,
].join(' ')

const result = spawnSync(cmd, { stdio: 'inherit', shell: true, env })
process.exit(result.status ?? 1)

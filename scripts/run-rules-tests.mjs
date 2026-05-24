#!/usr/bin/env node
/**
 * Runs Firebase rules tests inside the Firestore + Storage emulators.
 * Requires Java (Firebase emulator dependency).
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const JAVA_PATHS = [
  '/opt/homebrew/opt/openjdk@21/bin',
  '/usr/local/opt/openjdk@21/bin',
]

function envWithJava() {
  const env = { ...process.env }
  for (const dir of JAVA_PATHS) {
    if (existsSync(`${dir}/java`)) {
      env.PATH = `${dir}:${env.PATH || ''}`
      break
    }
  }
  return env
}

function hasJava(env) {
  const result = spawnSync('java', ['-version'], { stdio: 'pipe', env })
  return result.status === 0
}

const env = envWithJava()

if (!hasJava(env)) {
  console.error(
    [
      'Firebase rules tests require Java (Firebase emulators).',
      'Install on macOS: brew install openjdk@21',
      'Then add to PATH: export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"',
      '',
      'To skip rules tests locally: SKIP_FIREBASE_RULES=1 npm run test:rules',
    ].join('\n'),
  )
  process.exit(process.env.SKIP_FIREBASE_RULES === '1' ? 0 : 1)
}

const cmd =
  'firebase emulators:exec --only firestore,storage "vitest run tests/rules --reporter=dot"'

const result = spawnSync(cmd, {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd(),
  env,
})

process.exit(result.status ?? 1)

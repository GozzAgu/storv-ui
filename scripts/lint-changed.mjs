#!/usr/bin/env node
/**
 * Lints only files changed against the base branch (default: main), plus uncommitted changes.
 * The codebase predates ESLint; this keeps new and touched files clean without a mass reformat.
 *
 * Usage: npm run lint  (LINT_BASE=origin/main npm run lint)
 */
import { execSync, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const base = process.env.LINT_BASE || 'main'
const LINTABLE = /\.(ts|mts|js|mjs|vue)$/

function git(args) {
  return execSync(`git ${args}`, { encoding: 'utf8' })
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

const files = [
  ...new Set([
    ...git(`diff --name-only --diff-filter=ACMR ${base}...HEAD`),
    ...git('diff --name-only --diff-filter=ACMR HEAD'),
    ...git('ls-files --others --exclude-standard'),
  ]),
].filter((f) => LINTABLE.test(f) && existsSync(f))

if (files.length === 0) {
  console.log('lint: no changed files')
  process.exit(0)
}

const result = spawnSync('npx', ['eslint', '--max-warnings=0', ...files], { stdio: 'inherit' })
process.exit(result.status ?? 1)

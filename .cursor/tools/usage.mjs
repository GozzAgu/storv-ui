// Usage: node .cursor/tools/usage.mjs <dir-prefix...>  -> "<count> <file>  <users>" for every component under the prefixes
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const prefixes = process.argv.slice(2)
const dts = readFileSync('.nuxt/components.d.ts', 'utf8')
const re = /export const (\w+): typeof import\("\.\.\/(components\/[^"]+)"\)/g
const byFile = new Map()
for (const [, name, file] of dts.matchAll(re)) {
  if (!prefixes.some((p) => file.startsWith(p))) continue
  if (!byFile.has(file)) byFile.set(file, new Set())
  byFile.get(file).add(name)
}
const files = execSync("rg --files components pages layouts composables utils plugins app.vue -g '*.{vue,ts}'", { encoding: 'utf8' }).trim().split('\n')
const sources = files.map((f) => [f, readFileSync(f, 'utf8')])
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
const rows = []
for (const [file, names] of byFile) {
  const base = file.replace(/^components\//, '').replace(/\.vue$/, '')
  const pats = [...names].flatMap((n) => [new RegExp(`<${n}[\\s/>]`), new RegExp(`<${kebab(n)}[\\s/>]`), new RegExp(`\\b${n}\\b`)])
  pats.push(new RegExp(`components/${base.replace(/[/.]/g, '\\$&')}(\\.vue)?['"]`))
  const users = sources.filter(([f, src]) => f !== file && pats.some((p) => p.test(src))).map(([f]) => f)
  rows.push([users.length, file, users])
}
rows.sort((a, b) => a[0] - b[0])
for (const [n, f, u] of rows) console.log(`${n} ${f}  ${u.slice(0, 6).join(' ')}${u.length > 6 ? ' …' : ''}`)

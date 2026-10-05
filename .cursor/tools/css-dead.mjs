// Usage: node .cursor/tools/css-dead.mjs [--write] <css files...>
// Removes rules whose every selector references a class that never appears in app source.
import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import postcss from 'postcss'
import selectorParser from 'postcss-selector-parser'

const args = process.argv.slice(2)
const write = args.includes('--write')
const files = args.filter((a) => a !== '--write')

const srcFiles = execSync(
  "rg --files components pages layouts composables utils plugins stores middleware app.vue -g '*.{vue,ts,js}'",
  { encoding: 'utf8' },
).trim().split('\n')
const tokens = new Set()
const prefixes = new Set()
for (const f of srcFiles) {
  const src = readFileSync(f, 'utf8')
  for (const m of src.matchAll(/[A-Za-z0-9_-]+/g)) tokens.add(m[0])
  // dynamic classes like `dash-${x}` or 'dash-' + x
  for (const m of src.matchAll(/([A-Za-z][A-Za-z0-9_-]*-)(?:\$\{|['"`]\s*\+)/g)) prefixes.add(m[1])
}
const VENDOR = /^(apexcharts|router-link|nuxt|v-|vue-|flatpickr|cropper|swiper|leaflet|ql-|tippy)/
const TRANSITION = /-(enter|leave)(-active|-from|-to)?$|-move$|-appear(-active|-from|-to)?$/
const classUsed = (c) =>
  tokens.has(c) ||
  VENDOR.test(c) ||
  (TRANSITION.test(c) && tokens.has(c.replace(TRANSITION, ''))) ||
  [...prefixes].some((p) => c.startsWith(p))

function selectorLive(sel) {
  let live = true
  try {
    selectorParser((root) => {
      root.walkClasses((n) => {
        if (!classUsed(n.value)) live = false
      })
    }).processSync(sel)
  } catch {
    return true
  }
  return live
}

let totalRemoved = 0
for (const file of files) {
  const css = readFileSync(file, 'utf8')
  const root = postcss.parse(css, { from: file })
  let removed = 0
  let trimmed = 0
  root.walkRules((rule) => {
    if (rule.parent?.type === 'atrule' && /keyframes/i.test(rule.parent.name)) return
    const sels = rule.selectors
    const live = sels.filter(selectorLive)
    if (live.length === 0) {
      removed++
      rule.remove()
    } else if (live.length < sels.length) {
      trimmed++
      rule.selectors = live
    }
  })
  let changed = true
  while (changed) {
    changed = false
    root.walkAtRules((at) => {
      if (/keyframes|font-face|import|config|theme|plugin|source|custom-variant|utility/i.test(at.name)) return
      if (at.nodes && at.nodes.filter((n) => n.type !== 'comment').length === 0) {
        at.remove()
        changed = true
      }
    })
  }
  const out = root.toString().replace(/\n{3,}/g, '\n\n')
  const before = css.split('\n').length
  const after = out.split('\n').length
  totalRemoved += removed
  console.log(`${file}: ${removed} rules removed, ${trimmed} trimmed, ${before} -> ${after} lines`)
  if (write) writeFileSync(file, out)
}
console.log(`total rules removed: ${totalRemoved}`)

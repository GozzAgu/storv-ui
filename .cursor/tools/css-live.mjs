// Usage: node .cursor/tools/css-live.mjs [--by-class] <css files...>
// Lists source files (excluding marketing/landing) that use classes defined in the given CSS.
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import postcss from 'postcss'
import selectorParser from 'postcss-selector-parser'

const args = process.argv.slice(2)
const byClass = args.includes('--by-class')
const files = args.filter((a) => !a.startsWith('--'))
const classes = new Set()
for (const f of files) {
  postcss.parse(readFileSync(f, 'utf8')).walkRules((r) => {
    try {
      selectorParser((root) => root.walkClasses((n) => classes.add(n.value))).processSync(r.selector)
    } catch {}
  })
}
const MARKETING = /components\/landing\/|pages\/(index|features|pricing|privacy|terms|security|demo\/|store\/)|layouts\/marketing/
const src = execSync("rg --files components pages layouts composables utils app.vue -g '*.{vue,ts}'", { encoding: 'utf8' })
  .trim().split('\n').filter((f) => !MARKETING.test(f))
const fileHits = new Map()
const classHits = new Map()
for (const f of src) {
  const text = readFileSync(f, 'utf8')
  const toks = new Set(text.match(/[A-Za-z0-9_-]+/g) || [])
  const hits = [...classes].filter((c) => toks.has(c) && c.length > 2)
  if (hits.length) fileHits.set(f, hits)
  for (const c of hits) classHits.set(c, (classHits.get(c) || []).concat(f))
}
if (byClass) {
  for (const [c, fs] of [...classHits].sort((a, b) => b[1].length - a[1].length)) console.log(`${fs.length}\t${c}\t${fs.slice(0, 4).join(' ')}`)
} else {
  for (const [f, hs] of [...fileHits].sort((a, b) => b[1].length - a[1].length)) console.log(`${hs.length}\t${f}\t${hs.slice(0, 12).join(' ')}`)
}

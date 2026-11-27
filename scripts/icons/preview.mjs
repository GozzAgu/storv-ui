// Contact sheet for one Storvv icon set, next to the Lucide icon it replaces.
//   node scripts/icons/preview.mjs glyphs            -> scripts/icons/out/glyphs.png
//   node scripts/icons/preview.mjs glyphs Plus Check -> only those icons
// Each row: Lucide at 24 | Storvv at 48, 24, 16 (stroke 1.5, as the app draws them) | Storvv on dark.
import { createJiti } from 'jiti'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import * as Lucide from '@lucide/vue'
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const [setName, ...only] = process.argv.slice(2)
if (!setName) throw new Error('Usage: node scripts/icons/preview.mjs <set> [Name ...]')

const jiti = createJiti(import.meta.url, { moduleCache: false })
const set = (await jiti.import(path.join(root, `icons/sets/${setName}.ts`))).default
const names = only.length ? only : Object.keys(set)

const svg = (parts, size, sw = 1.5) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${parts
    .map((p) => {
      const fill = p.tone ? 'currentColor' : 'none'
      const fo = p.tone ? `fill-opacity="${p.tone === 'fill' ? 0.3 : 0.14}"` : ''
      const st = p.tone && !p.outline ? 'stroke="none"' : ''
      const w = p.width ? `stroke-width="${p.width}"` : ''
      const t = p.transform ? `transform="${p.transform}"` : ''
      return `<path d="${p.d}" fill="${fill}" ${fo} ${st} ${w} ${t}/>`
    })
    .join('')}</svg>`

async function lucide(name) {
  const C = Lucide[name]
  if (!C) return '<span style="color:red">?</span>'
  return renderToString(createSSRApp({ render: () => h(C, { size: 24, strokeWidth: 1.5 }) }))
}

const rows = []
for (const name of names) {
  const parts = set[name]
  const mine = parts
    ? `<span class="c">${svg(parts, 48)}</span><span class="c">${svg(parts, 24)}</span><span class="c">${svg(parts, 16)}</span><span class="c dk">${svg(parts, 24)}</span><span class="c bl">${svg(parts, 24)}</span>`
    : '<span class="c" style="color:red">missing</span>'
  rows.push(
    `<div class="r"><code>${name}</code><span class="c lu">${await lucide(name)}</span>${mine}</div>`
  )
}

const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:16px;font:12px ui-monospace,monospace;background:#fff;color:#1f1f23}
.g{display:grid;grid-template-columns:repeat(2,1fr);gap:6px 24px}
.r{display:flex;align-items:center;gap:12px;padding:6px 8px;border-bottom:1px solid #eee}
code{width:170px;flex:none}
.c{display:inline-grid;place-items:center;min-width:52px;height:52px}
.lu{color:#b0b0b8}
.dk{background:#141418;color:#e8e8ee;border-radius:8px}
.bl{color:#3d63f2}
</style><div class="g">${rows.join('')}</div>`

const outDir = path.join(root, 'scripts/icons/out')
mkdirSync(outDir, { recursive: true })
const out = path.join(outDir, `${setName}${only.length ? '-' + only.join('-') : ''}.png`)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1100, height: 400 }, deviceScaleFactor: 2 })
await page.setContent(html)
await page.screenshot({ path: out, fullPage: true })
await browser.close()
console.log(out, `${names.length} icons, ${names.filter((x) => !set[x]).length} missing`)

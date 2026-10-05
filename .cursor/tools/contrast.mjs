// Usage: node .cursor/tools/contrast.mjs
// WCAG contrast of DS text tokens against the surfaces they sit on, light and dark.
import { readFileSync } from 'node:fs'

const css = readFileSync('assets/css/ds/tokens.css', 'utf8')
function block(selector) {
  const start = css.indexOf(`${selector} {`)
  const body = css.slice(start, css.indexOf('\n}', start))
  return Object.fromEntries([...body.matchAll(/--(s-[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]))
}
const light = block(':root')
const dark = { ...light, ...block('html.dark') }

function parse(c) {
  c = c.trim()
  let m = c.match(/^#([0-9a-f]{6})$/i)
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)).concat(1)
  m = c.match(/^rgb\((\d+) (\d+) (\d+)(?: \/ ([\d.]+))?\)$/)
  if (m) return [+m[1], +m[2], +m[3], m[4] ? +m[4] : 1]
  return null
}
const over = (fg, bg) => fg.slice(0, 3).map((v, i) => v * fg[3] + bg[i] * (1 - fg[3])).concat(1)
const lum = ([r, g, b]) =>
  [r, g, b].map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0)
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

const PAIRS = [
  ['s-text', ['s-bg', 's-surface', 's-surface-2', 's-field-bg']],
  ['s-text-2', ['s-bg', 's-surface', 's-surface-2', 's-field-bg']],
  ['s-text-muted', ['s-bg', 's-surface', 's-surface-2', 's-field-bg', 's-surface-hover']],
  ['s-accent', ['s-bg', 's-surface', 's-surface-2']],
  ['s-text-on-accent', ['s-accent', 's-accent-hover']],
  ['s-accent-soft-text', [['s-accent-soft', 's-surface']]],
  ['s-success', ['s-surface', ['s-success-soft', 's-surface']]],
  ['s-warning', ['s-surface', ['s-warning-soft', 's-surface']]],
  ['s-error', ['s-surface', ['s-error-soft', 's-surface']]],
  ['s-info', ['s-surface', ['s-info-soft', 's-surface']]],
]
for (const [name, theme] of [['light', light], ['dark', dark]]) {
  for (const [fg, bgs] of PAIRS) {
    for (const bgSpec of bgs) {
      const [bgName, base] = Array.isArray(bgSpec) ? bgSpec : [bgSpec, null]
      let bg = parse(theme[bgName])
      if (base) bg = over(bg, parse(theme[base]))
      const r = ratio(parse(theme[fg]), bg)
      const flag = r < 4.5 ? (r < 3 ? ' FAIL' : ' LARGE-ONLY') : ''
      console.log(`${name.padEnd(5)} ${fg.padEnd(20)} on ${bgName.padEnd(16)} ${r.toFixed(2)}${flag}`)
    }
  }
}

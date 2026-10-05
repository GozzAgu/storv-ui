// One-off: replace ui/Modal and ui/SidePanel wrappers with SDialog.
import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const files = execSync("rg -l '<(Modal|SidePanel)\\b' components pages layouts -g '*.vue'", { encoding: 'utf8' })
  .trim().split('\n').filter((f) => !/components\/ui\/(Modal|SidePanel)\.vue$/.test(f))

const SIDE = { sm: 'sm', md: 'md', lg: 'md', xl: 'lg', drawer: 'lg' }
const CENTER = { xs: 'sm', sm: 'sm', md: 'md', lg: 'lg', xl: 'lg' }

for (const file of files) {
  let src = readFileSync(file, 'utf8')
  const notes = []
  src = src.replace(/<(Modal|SidePanel)\b([^>]*?)(\/?)>/gs, (m, tag, attrs, self) => {
    let a = attrs
    a = a.replace(/(\s)v-model=/g, '$1v-model:open=')
    a = a.replace(/(\s):(model-value|modelValue)=/g, '$1:open=')
    a = a.replace(/(\s)@update:(model-value|modelValue)=/g, '$1@update:open=')
    a = a.replace(/(\s)(:?)subtitle=/g, '$1$2description=')
    const map = tag === 'SidePanel' ? SIDE : CENTER
    if (/\ssize="(\w+)"/.test(a)) a = a.replace(/(\s)size="(\w+)"/, (s, ws, v) => `${ws}size="${map[v] ?? 'md'}"`)
    if (/\s:size=/.test(a)) notes.push('bound :size needs review')
    if (tag === 'SidePanel') a = ` placement="right"${a}`
    if (/\s@close=/.test(a)) notes.push(`@close: ${a.match(/@close="[^"]*"/)[0]}`)
    if (/\s:show-close=|\sshow-close/.test(a)) notes.push('show-close needs review')
    if (/\s:?close-on-backdrop/.test(a)) notes.push('close-on-backdrop needs review')
    return `<SDialog${a}${self}>`
  })
  src = src.replace(/<\/(Modal|SidePanel)>/g, '</SDialog>')
  src = src.replace(/^import (Modal|SidePanel) from '~\/components\/ui\/(Modal|SidePanel)\.vue'\s*\n/gm, '')
  if (!/import SDialog from/.test(src)) src = src.replace(/(<script[^>]*>\s*\n)/, `$1import SDialog from '~/components/s/SDialog.vue'\n`)
  writeFileSync(file, src)
  console.log(`${file}${notes.length ? '\n   - ' + notes.join('\n   - ') : ''}`)
}

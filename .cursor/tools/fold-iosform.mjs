// One-off: rename IosForm* / IosDrawerActions usages to DS components.
import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const files = execSync("rg -l 'IosForm|IosDrawerActions|ios-form__grid' components pages layouts -g '*.vue'", { encoding: 'utf8' })
  .trim().split('\n').filter((f) => !f.startsWith('components/ios/') && !f.endsWith('TotpConfirmModal.vue'))

const TAGS = [
  ['IosFormField', 'SField'],
  ['IosFormInput', 'SInput'],
  ['IosFormSelect', 'SSelect'],
  ['IosFormTextarea', 'STextarea'],
  ['IosFormSection', 'SFormSection'],
  ['IosFormToggle', 'SCheckbox'],
  ['IosDrawerActions', 'SDialogActions'],
  ['IosForm', 'SForm'],
]

const report = []
for (const file of files) {
  let src = readFileSync(file, 'utf8')
  const tplEnd = src.lastIndexOf('</template>')
  let tpl = src.slice(0, tplEnd)
  let rest = src.slice(tplEnd)
  const used = new Set()
  const notes = []

  // Per-tag attribute fixes before renaming.
  tpl = tpl.replace(/<(IosFormField|IosFormToggle|IosFormInput|IosFormSelect|IosFormTextarea)\b([^>]*?)(\/?)>/gs, (m, tag, attrs, self) => {
    let a = attrs
    if (tag === 'IosFormField') a = a.replace(/(\s):?for=/g, (s, ws) => `${ws}${s.includes(':') ? ':' : ''}id=`)
    if (tag === 'IosFormToggle') a = a.replace(/(\s)(:?)hint=/g, '$1$2description=')
    if (/\s:?extra-class=/.test(a)) {
      notes.push(`dropped extra-class on ${tag}: ${a.match(/:?extra-class="[^"]*"/)?.[0]}`)
      a = a.replace(/\s+:?extra-class="[^"]*"/g, '')
    }
    return `<${tag}${a}${self}>`
  })
  if (/<IosFormToggle\b[^>]*[^/]>/s.test(tpl)) notes.push('IosFormToggle with children: check wrapper')

  for (const [from, to] of TAGS) {
    const re = new RegExp(`(</?)${from}(?![A-Za-z])`, 'g')
    if (re.test(tpl)) {
      used.add(to)
      tpl = tpl.replace(re, `$1${to}`)
    }
  }
  tpl = tpl.replace(/\bios-form__grid ios-form__grid--pair\b/g, 's-form-pair').replace(/\bios-form__grid--pair ios-form__grid\b/g, 's-form-pair')
  if (/ios-form__/.test(tpl)) notes.push(`remaining ios-form__ classes: ${[...new Set(tpl.match(/ios-form__[\w-]+/g))].join(', ')}`)

  // Script: drop old imports, add explicit DS imports.
  rest = rest
    .replace(/^import\s*\{[^}]*\}\s*from\s*'~\/components\/ios\/forms(?:\/index)?'\s*\n/gms, '')
    .replace(/^import\s+\w+\s+from\s+'~\/components\/ios\/(?:forms\/\w+|IosDrawerActions)\.vue'\s*\n/gm, '')
  const missing = [...used].filter((n) => !new RegExp(`import ${n} from`).test(rest))
  if (missing.length) {
    const lines = missing.sort().map((n) => `import ${n} from '~/components/s/${n}.vue'\n`).join('')
    rest = rest.replace(/(<script[^>]*>\s*\n)/, `$1${lines}`)
  }
  if (/IosForm|IosDrawerActions/.test(rest)) notes.push('script still references IosForm/IosDrawerActions')
  writeFileSync(file, tpl + rest)
  report.push(`${file}: ${[...used].join(', ')}${notes.length ? '\n   - ' + notes.join('\n   - ') : ''}`)
}
console.log(report.join('\n'))

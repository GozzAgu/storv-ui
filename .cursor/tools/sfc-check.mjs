// Usage: node .cursor/tools/sfc-check.mjs <file.vue> [...more]
// Compiles each SFC (script + inline template) and lists unresolved global components.
import { readFileSync } from 'node:fs'
import { parse, compileScript } from '@vue/compiler-sfc'

const files = process.argv.slice(2)
let globals = new Set()
try {
  const dts = readFileSync('.nuxt/components.d.ts', 'utf8')
  globals = new Set([...dts.matchAll(/export const ([A-Z]\w+):/g)].map((m) => m[1]))
} catch {}

let failed = 0
for (const file of files) {
  try {
    const src = readFileSync(file, 'utf8')
    const { descriptor, errors } = parse(src, { filename: file })
    if (errors.length) throw errors[0]
    if (!descriptor.scriptSetup && !descriptor.script) {
      console.log('OK (template only)', file)
      continue
    }
    const out = compileScript(descriptor, { id: 'x', inlineTemplate: true })
    const unresolved = [...out.content.matchAll(/_resolveComponent\("([^"]+)"\)/g)]
      .map((m) => m[1])
      .filter((n) => !globals.has(n) && !['RouterLink', 'RouterView', 'Transition', 'TransitionGroup', 'KeepAlive', 'Teleport'].includes(n))
    if (unresolved.length) {
      failed++
      console.log('UNRESOLVED', file, [...new Set(unresolved)].join(', '))
    } else console.log('OK', file)
  } catch (e) {
    failed++
    console.log('FAIL', file, e.message?.split('\n')[0])
  }
}
process.exit(failed ? 1 : 0)

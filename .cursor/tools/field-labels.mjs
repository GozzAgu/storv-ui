// Usage: node .cursor/tools/field-labels.mjs <file.vue> [...more]
// Flags labeled <SField>s whose label points at nothing: no DS control inside and no
// raw/custom control bound to the slot's `id`.
import { readFileSync } from 'node:fs'
import { parse } from '@vue/compiler-sfc'

const DS_CONTROLS = new Set(['SInput', 'SSelect', 'STextarea'])
const out = []
for (const file of process.argv.slice(2)) {
  const { descriptor } = parse(readFileSync(file, 'utf8'), { filename: file })
  if (!descriptor.template?.ast) continue
  const kids = (n) => [...(n.children || []), ...(n.branches || [])]
  const find = (n, pred) => pred(n) || kids(n).some((c) => find(c, pred))
  const visit = (n) => {
    if (n.type === 1 && n.tag === 'SField') {
      const hasLabel = n.props.some((p) => (p.type === 6 && p.name === 'label') || (p.type === 7 && p.arg?.content === 'label'))
      if (hasLabel) {
        const ds = find(n, (c) => c.type === 1 && DS_CONTROLS.has(c.tag))
        const boundId = find(n, (c) => c.type === 1 && c.props?.some((p) => p.type === 7 && p.name === 'bind' && p.arg?.content === 'id'))
        if (!ds && !boundId) out.push(`${file}:${n.loc.start.line}`)
      }
    }
    kids(n).forEach(visit)
  }
  visit(descriptor.template.ast)
}
console.log(out.join('\n'))
console.error(`${out.length} unlinked labels`)

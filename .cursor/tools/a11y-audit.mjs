// Usage: node .cursor/tools/a11y-audit.mjs <file.vue> [...more]
// Static template checks: clickable non-interactive elements, images without alt,
// icon-only buttons without a name, unlabeled form controls, positive tabindex.
import { readFileSync } from 'node:fs'
import { parse } from '@vue/compiler-sfc'

const NON_INTERACTIVE = new Set(['div', 'span', 'li', 'tr', 'td', 'th', 'p', 'section', 'article', 'img', 'ul', 'header', 'footer', 'label', 'svg', 'i'])
const NAMED_ATTRS = ['aria-label', 'aria-labelledby', 'title', 'label']

function attr(node, name) {
  return node.props?.find(
    (p) => (p.type === 6 && p.name === name) || (p.type === 7 && p.name === 'bind' && p.arg?.content === name)
  )
}
function hasEvent(node, name) {
  return node.props?.some((p) => p.type === 7 && p.name === 'on' && p.arg?.content?.startsWith(name))
}
function textOf(node) {
  if (node.type === 2) return node.content.trim()
  if (node.type === 5) return '{{x}}'
  if (node.type === 1) {
    if (node.tag === 'template' || /^[a-z]/.test(node.tag) || /^(S[A-Z]\w*)$/.test(node.tag)) {
      if (attr(node, 'aria-hidden')) return ''
      if (attr(node, 'label')) return 'label'
      return (node.children || []).map(textOf).join('')
    }
    return '' // icon components etc.
  }
  if (node.type === 9 || node.type === 10 || node.type === 11) return (node.branches || node.children || []).map(textOf).join('')
  return ''
}

const issues = []
for (const file of process.argv.slice(2)) {
  const { descriptor } = parse(readFileSync(file, 'utf8'), { filename: file })
  if (!descriptor.template?.ast) continue
  const walk = (node, ctx) => {
    if (node.type === 1) {
      const line = node.loc.start.line
      const tag = node.tag
      const report = (msg) => issues.push(`${file}:${line} <${tag}> ${msg}`)
      if (NON_INTERACTIVE.has(tag) && hasEvent(node, 'click') && !attr(node, 'role') && !attr(node, 'tabindex')) {
        const isScrim = /scrim|backdrop|overlay/.test(attr(node, 'class')?.value?.content || '') || attr(node, 'aria-hidden')
        const stopOnly = node.props.some((p) => p.type === 7 && p.name === 'on' && p.arg?.content === 'click' && !p.exp && p.modifiers?.length)
        if (!isScrim && !stopOnly && tag !== 'label') report('click handler on non-interactive element (no role/tabindex)')
      }
      if (tag === 'img' && !attr(node, 'alt')) report('image without alt')
      if ((tag === 'button' || tag === 'SButton' || tag === 'NuxtLink' || tag === 'a') && !NAMED_ATTRS.some((a) => attr(node, a))) {
        if (!(node.children || []).map(textOf).join('')) report('no accessible name (icon-only?)')
      }
      if (tag === 'SIconButton' && !attr(node, 'label')) report('SIconButton without label')
      if ((tag === 'input' || tag === 'select' || tag === 'textarea') && !ctx.inLabel) {
        const type = attr(node, 'type')?.value?.content
        if (type !== 'hidden' && type !== 'file' && !NAMED_ATTRS.some((a) => attr(node, a)) && !attr(node, 'id')) report('form control without label/id')
      }
      const ti = attr(node, 'tabindex')
      if (ti?.value && Number(ti.value.content) > 0) report('positive tabindex')
    }
    const next = { inLabel: ctx.inLabel || node.tag === 'label' || node.tag === 'SField' }
    for (const c of node.children || []) walk(c, next)
    for (const b of node.branches || []) walk(b, next)
  }
  walk(descriptor.template.ast, { inLabel: false })
}
console.log(issues.join('\n'))
console.error(`${issues.length} issues`)

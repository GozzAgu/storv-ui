import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('ios-system.css', () => {
  const css = readFileSync(resolve(process.cwd(), 'assets/css/ios-system.css'), 'utf8')

  it('defines button and table polish rules', () => {
    expect(css).toContain('.btn-primary')
    expect(css).toContain('.dash-native-table--cards')
    expect(css).toContain('var(--ios-type-body-size)')
  })

  it('is imported from ios-native.css', () => {
    const bundle = readFileSync(resolve(process.cwd(), 'assets/css/ios-native.css'), 'utf8')
    expect(bundle).toContain('./ios-system.css')
  })
})

describe('ios-design-tokens semantic aliases', () => {
  const tokens = readFileSync(resolve(process.cwd(), 'assets/css/ios-design-tokens.css'), 'utf8')

  it('defines tint and destructive aliases', () => {
    expect(tokens).toContain('--ios-tint:')
    expect(tokens).toContain('--ios-destructive:')
    expect(tokens).toContain('--ios-label-tertiary:')
  })
})

import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { isMarketingPath } from '~/utils/marketing-paths'

const pagesDir = resolve(process.cwd(), 'pages')

/** Top-level pages that use the marketing layout, as routes. */
function marketingLayoutRoutes(): string[] {
  return readdirSync(pagesDir)
    .filter((file) => file.endsWith('.vue'))
    .filter((file) => readFileSync(resolve(pagesDir, file), 'utf8').includes("layout: 'marketing'"))
    .map((file) => (file === 'index.vue' ? '/' : `/${file.replace(/\.vue$/, '')}`))
}

describe('isMarketingPath', () => {
  it('keeps every page that uses the marketing layout on www', () => {
    const routes = marketingLayoutRoutes()
    expect(routes).toEqual(expect.arrayContaining(['/', '/features', '/security', '/help']))
    for (const route of routes) expect(isMarketingPath(route), route).toBe(true)
  })

  it('ignores a trailing slash', () => {
    expect(isMarketingPath('/features/')).toBe(true)
  })

  it('keeps storefronts and guest checkout on www', () => {
    expect(isMarketingPath('/store/ade-gadgets')).toBe(true)
    expect(isMarketingPath('/pay/abc123')).toBe(true)
  })

  it('sends app pages to the app', () => {
    for (const path of ['/dashboard', '/signin', '/signup', '/demo/dashboard', '/featuresx']) {
      expect(isMarketingPath(path), path).toBe(false)
    }
  })
})

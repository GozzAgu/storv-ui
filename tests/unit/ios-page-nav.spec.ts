import { describe, it, expect, beforeEach } from 'vitest'
import { useIosPageNav } from '~/composables/useIosPageNav'

describe('useIosPageNav', () => {
  beforeEach(() => {
    const { clearPageNav } = useIosPageNav()
    clearPageNav()
  })

  it('stores page title and back chrome for the global top bar', () => {
    const nav = useIosPageNav()
    const owner = nav.setPageNav({
      title: 'Categories',
      showBack: true,
      backTo: '/dashboard/inventory',
      backLabel: 'Inventory',
    })

    expect(owner).toBeGreaterThan(0)
    expect(nav.title.value).toBe('Categories')
    expect(nav.showBack.value).toBe(true)
    expect(nav.backTo.value).toBe('/dashboard/inventory')
    expect(nav.backLabel.value).toBe('Inventory')
  })

  it('clears only the active owner registration', () => {
    const nav = useIosPageNav()
    const owner = nav.setPageNav({ title: 'Sales' })
    nav.clearPageNav(owner + 1)
    expect(nav.title.value).toBe('Sales')
    nav.clearPageNav(owner)
    expect(nav.title.value).toBe('')
    expect(nav.showBack.value).toBe(false)
  })
})

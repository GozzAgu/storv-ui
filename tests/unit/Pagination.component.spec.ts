import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import Pagination from '~/components/ui/Pagination.vue'

describe('Pagination.vue', () => {
  it('renders summary with 1-based range and total', () => {
    const w = mount(Pagination, {
      props: { currentPage: 1, itemsPerPage: 10, total: 25 },
    })
    const summary = w.get('[data-testid="pagination-summary"]')
    expect(summary.text()).toMatch(/1/)
    expect(summary.text()).toMatch(/10/)
    expect(summary.text()).toMatch(/of/)
    expect(summary.text()).toMatch(/25/)
  })

  it('emits page-change with target page when a page button is clicked', async () => {
    const w = mount(Pagination, {
      props: { currentPage: 1, itemsPerPage: 10, total: 30 },
    })
    await w.get('[aria-label="Page 2"]').trigger('click')
    expect(w.emitted('page-change')?.[0]).toEqual([2])
  })

  it('emits page-change for previous and next', async () => {
    const w = mount(Pagination, {
      props: { currentPage: 2, itemsPerPage: 10, total: 30 },
    })
    await w.get('[aria-label="Previous page"]').trigger('click')
    expect(w.emitted('page-change')?.[0]).toEqual([1])
    await w.get('[aria-label="Next page"]').trigger('click')
    expect(w.emitted('page-change')?.[1]).toEqual([3])
  })

  it('disables previous on first page', () => {
    const w = mount(Pagination, {
      props: { currentPage: 1, itemsPerPage: 10, total: 30 },
    })
    expect(w.get('[aria-label="Previous page"]').attributes('disabled')).toBeDefined()
    expect(w.get('[aria-label="Next page"]').attributes('disabled')).toBeUndefined()
  })

  it('disables next on last page', () => {
    const w = mount(Pagination, {
      props: { currentPage: 3, itemsPerPage: 10, total: 30 },
    })
    expect(w.get('[aria-label="Next page"]').attributes('disabled')).toBeDefined()
    expect(w.get('[aria-label="Previous page"]').attributes('disabled')).toBeUndefined()
  })

  it('sets aria-current="page" only on the active page button', () => {
    const w = mount(Pagination, {
      props: { currentPage: 2, itemsPerPage: 10, total: 30 },
    })
    expect(w.get('[aria-label="Page 2"]').attributes('aria-current')).toBe('page')
    expect(w.get('[aria-label="Page 1"]').attributes('aria-current')).toBeUndefined()
  })

  it('renders ellipsis for large page counts', () => {
    const w = mount(Pagination, {
      props: { currentPage: 5, itemsPerPage: 1, total: 20 },
    })
    expect(w.text()).toContain('…')
  })

  it('exposes stable test ids for e2e', () => {
    const w = mount(Pagination, {
      props: { currentPage: 1, itemsPerPage: 10, total: 10 },
    })
    expect(w.find('[data-testid="pagination"]').exists()).toBe(true)
    expect(w.find('[data-testid="pagination-controls"]').exists()).toBe(true)
  })
})

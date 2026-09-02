import { describe, expect, it, vi } from 'vitest'
import { downloadAnalyticsCsv } from '~/utils/analytics-report-export'

describe('analytics-report-export', () => {
  it('downloads a CSV blob with key metrics', () => {
    const click = vi.fn()
    const appendChild = vi.fn()
    const removeChild = vi.fn()
    vi.stubGlobal(
      'document',
      {
        createElement: () =>
          ({
            setAttribute: vi.fn(),
            click,
            style: {},
          }) as unknown as HTMLAnchorElement,
        body: { appendChild, removeChild } as unknown as HTMLBodyElement,
      } as unknown as Document
    )
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    })
    vi.stubGlobal(
      'Blob',
      class MockBlob {
        constructor(public parts: unknown[], public options: unknown) {}
      }
    )

    downloadAnalyticsCsv({
      periodLabel: 'Last 7 days',
      selectedPeriod: '7d',
      formatCurrency: (n) => `$${n}`,
      formatReturnDate: () => 'Jan 1',
      totalRevenue: 1000,
      totalSales: 5,
      totalOrders: 5,
      averageOrderValue: 200,
      lowStockCount: 1,
      repeatPurchaseRate: 12.5,
      refundedCount: 0,
      refundAmount: 0,
      refundRate: 0,
      topProducts: [{ name: 'Widget', quantity: 2, revenue: 400 }],
      topCustomers: [{ name: 'Jane', email: 'j@x.test', orders: 1, totalSpent: 200 }],
      recentReturns: [],
    })

    expect(click).toHaveBeenCalledOnce()
  })
})

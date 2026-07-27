import { describe, expect, it, vi } from 'vitest'
import {
  annotateDashboardTableForCards,
  setupMobileTableAccordion,
} from '~/utils/native-table-cards'

describe('annotateDashboardTableForCards', () => {
  it('labels cells from thead and marks detail rows', () => {
    document.body.innerHTML = `
      <table class="dashboard-table">
        <thead>
          <tr>
            <th>Receipt</th>
            <th>Total</th>
            <th class="dashboard-table__col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>#1</td>
            <td>₦100</td>
            <td class="dashboard-table__col-actions"><button>View</button></td>
          </tr>
          <tr>
            <td colspan="3"><div>Expanded panel</div></td>
          </tr>
        </tbody>
      </table>
    `

    const table = document.querySelector('table') as HTMLTableElement
    annotateDashboardTableForCards(table)

    const dataRow = table.querySelector('tr.dash-native-table__card-row')
    expect(dataRow).toBeTruthy()
    const firstCell = dataRow?.querySelector('td')
    expect(firstCell?.classList.contains('dash-native-table__cell--primary')).toBe(true)
    expect(firstCell?.dataset.nativeLabel).toBe('')
    expect(dataRow?.querySelector('.dashboard-table__col-actions')?.dataset.nativeLabel).toBe(
      'Actions'
    )
    expect(dataRow?.querySelectorAll('td.dash-native-table__cell--meta').length).toBe(1)

    const detailRow = table.querySelector('tr.dash-native-table__detail-row')
    expect(detailRow).toBeTruthy()
  })
})

describe('setupMobileTableAccordion', () => {
  it('adds toggle buttons and accordion classes on mobile', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('639px'),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    document.body.innerHTML = `
      <table class="dashboard-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="dashboard-table__primary">Widget</span></td>
            <td class="dashboard-table__col-status">Active</td>
          </tr>
        </tbody>
      </table>
    `

    const table = document.querySelector('table') as HTMLTableElement
    annotateDashboardTableForCards(table)
    setupMobileTableAccordion(table)

    const row = table.querySelector('tr.dash-mobile-table__accordion-row')
    expect(row).toBeTruthy()
    expect(row?.querySelector('.dash-mobile-table__toggle')).toBeTruthy()
    expect(row?.classList.contains('dash-mobile-table--expanded')).toBe(false)

    vi.unstubAllGlobals()
  })
})

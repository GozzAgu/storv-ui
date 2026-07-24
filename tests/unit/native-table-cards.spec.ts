import { describe, expect, it } from 'vitest'
import { annotateDashboardTableForCards } from '~/utils/native-table-cards'

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
    expect(table.querySelector('td')?.dataset.nativeLabel).toBe('Receipt')
    expect(table.querySelector('.dashboard-table__col-actions')?.dataset.nativeLabel).toBe(
      'Actions'
    )

    const detailRow = table.querySelector('tr.dash-native-table__detail-row')
    expect(detailRow).toBeTruthy()
  })
})

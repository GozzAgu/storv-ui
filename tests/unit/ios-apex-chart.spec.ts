import { describe, expect, it } from 'vitest'
import { mergeIosApexChartTheme } from '~/utils/ios-apex-chart'

describe('mergeIosApexChartTheme', () => {
  it('softens grid and hides legend on iOS', () => {
    const result = mergeIosApexChartTheme(
      {
        grid: { borderColor: '#000' },
        legend: { show: true, position: 'bottom' },
      },
      false
    )

    expect(result.legend).toEqual({ show: false, position: 'bottom' })
    expect(result.grid?.borderColor).toBe('rgba(60, 60, 67, 0.12)')
  })
})

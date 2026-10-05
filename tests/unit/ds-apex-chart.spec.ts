import { describe, expect, it } from 'vitest'
import {
  DS_CHART_PALETTE_FALLBACK as palette,
  mergeDsApexChartTheme,
  withAlpha,
} from '~/utils/ds-apex-chart'

describe('mergeDsApexChartTheme', () => {
  it('uses the accent for a single neutral series and keeps other options', () => {
    const merged = mergeDsApexChartTheme(
      { colors: ['#111827'], chart: { type: 'line', toolbar: { show: false } } },
      palette
    )
    expect(merged.colors).toEqual([palette.accent])
    expect(merged.chart).toMatchObject({ type: 'line', toolbar: { show: false }, fontFamily: palette.font })
  })

  it('keeps green and amber series semantic', () => {
    expect(mergeDsApexChartTheme({ colors: ['#059669'] }, palette).colors).toEqual([palette.success])
    expect(mergeDsApexChartTheme({ colors: ['#fbbf24'] }, palette).colors).toEqual([palette.warning])
  })

  it('gives multi-series charts the full palette', () => {
    const merged = mergeDsApexChartTheme({ colors: ['#a', '#b', '#c'] }, palette)
    expect(merged.colors).toHaveLength(5)
    expect((merged.colors as string[])[0]).toBe(palette.accent)
  })

  it('recolours heatmap steps from the surface to the accent', () => {
    const merged = mergeDsApexChartTheme(
      {
        plotOptions: {
          heatmap: { colorScale: { ranges: [{ from: 0, to: 0, color: '#eee' }, { from: 1, to: 5, color: '#333' }] } },
        },
      },
      palette
    ) as any
    const ranges = merged.plotOptions.heatmap.colorScale.ranges
    expect(ranges[0].color).toBe(palette.surface)
    expect(ranges[1].color).toBe(withAlpha(palette.accent, 1))
    expect(ranges[1].from).toBe(1)
  })
})

describe('withAlpha', () => {
  it('converts hex colours and leaves other formats alone', () => {
    expect(withAlpha('#143f8d', 0.5)).toBe('rgb(20 63 141 / 0.5)')
    expect(withAlpha('rgb(1 2 3)', 0.5)).toBe('rgb(1 2 3)')
  })
})

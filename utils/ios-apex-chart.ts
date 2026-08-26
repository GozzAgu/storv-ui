/**
 * Muted ApexCharts defaults for Capacitor iOS — calmer grid, no legend noise.
 */
export function mergeIosApexChartTheme<T extends Record<string, unknown>>(
  options: T,
  isDark: boolean
): T {
  const labelColor = isDark ? 'rgba(235, 235, 245, 0.55)' : 'rgba(60, 60, 67, 0.55)'
  const gridColor = isDark ? 'rgba(84, 84, 88, 0.35)' : 'rgba(60, 60, 67, 0.12)'
  const axisColor = isDark ? 'rgba(84, 84, 88, 0.5)' : 'rgba(60, 60, 67, 0.18)'

  const merged = { ...options } as T & {
    grid?: Record<string, unknown>
    legend?: Record<string, unknown>
    xaxis?: Record<string, unknown>
    yaxis?: Record<string, unknown>
  }

  merged.grid = {
    ...(merged.grid ?? {}),
    borderColor: gridColor,
    strokeDashArray: 3,
    xaxis: { lines: { show: false } },
    yaxis: { lines: { show: true } },
  }

  merged.legend = { ...(merged.legend ?? {}), show: false }

  if (merged.xaxis && typeof merged.xaxis === 'object') {
    const xaxis = merged.xaxis as Record<string, unknown>
    const labels = (xaxis.labels as Record<string, unknown>) ?? {}
    const style = (labels.style as Record<string, unknown>) ?? {}
    merged.xaxis = {
      ...xaxis,
      labels: {
        ...labels,
        style: { ...style, colors: labelColor, fontSize: '11px' },
      },
      axisBorder: { show: true, color: axisColor },
      axisTicks: { show: false },
    }
  }

  if (merged.yaxis && typeof merged.yaxis === 'object') {
    const yaxis = merged.yaxis as Record<string, unknown>
    const labels = (yaxis.labels as Record<string, unknown>) ?? {}
    const style = (labels.style as Record<string, unknown>) ?? {}
    merged.yaxis = {
      ...yaxis,
      labels: {
        ...labels,
        style: { ...style, colors: labelColor, fontSize: '10px' },
      },
    }
  }

  return merged as T
}

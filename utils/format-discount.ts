/** Human-readable discount % (avoids float noise like -1.9817073170731707%). */
export function formatDiscountPercent(value: number | undefined | null): string | null {
 if (value == null || !Number.isFinite(value)) return null
 const rounded = Math.round(Math.abs(value) * 10) / 10
 const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
 return text
}

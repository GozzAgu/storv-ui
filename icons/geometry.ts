/**
 * Shared shapes for Storvv's icon set. Every icon is drawn on a 24px grid and stroked by the
 * component (round caps and joins), so paths here are geometry only.
 *
 * The house signature comes from the Storvv mark, two leaves with one big rounded corner each:
 * containers (cards, screens, boxes, bubbles) use `leaf()`: big radius top-left and bottom-right,
 * tight radius on the other two corners.
 */

export interface StorvvIconPart {
  d: string
  /** 'fill' = strong tint (0.3), 'soft' = background tint (0.14). Filled parts are not stroked. */
  tone?: 'fill' | 'soft'
  /** Also stroke a toned part. */
  outline?: boolean
  /** Stroke width for this part only. Rarely needed: let the caller's width rule. */
  width?: number
  transform?: string
}

export type StorvvIconSet = Record<string, StorvvIconPart[]>

const n = (v: number) => +v.toFixed(2)

/** Circle as a closed path. */
export function circle(cx: number, cy: number, r: number) {
  return `M${n(cx + r)} ${n(cy)}a${n(r)} ${n(r)} 0 1 1-${n(2 * r)} 0 ${n(r)} ${n(r)} 0 0 1 ${n(2 * r)} 0Z`
}

/** Rectangle with four equal rounded corners. */
export function rrect(x: number, y: number, w: number, h: number, r = 2) {
  return leaf(x, y, w, h, r, r)
}

/**
 * The Storvv leaf rectangle: corner radius `big` on top-left and bottom-right, `small` on
 * top-right and bottom-left. Defaults suit an 18px-wide container.
 */
export function leaf(x: number, y: number, w: number, h: number, big = 4.5, small = 1.6) {
  const B = Math.min(big, w / 2, h / 2)
  const s = Math.min(small, w / 2, h / 2)
  return (
    `M${n(x + B)} ${n(y)}H${n(x + w - s)}a${n(s)} ${n(s)} 0 0 1 ${n(s)} ${n(s)}` +
    `V${n(y + h - B)}a${n(B)} ${n(B)} 0 0 1-${n(B)} ${n(B)}` +
    `H${n(x + s)}a${n(s)} ${n(s)} 0 0 1-${n(s)}-${n(s)}` +
    `V${n(y + B)}a${n(B)} ${n(B)} 0 0 1 ${n(B)}-${n(B)}Z`
  )
}

/** A dot: a filled circle at full tint, for status pips and list bullets. */
export function dot(cx: number, cy: number, r = 1.1): StorvvIconPart {
  return { d: circle(cx, cy, r), tone: 'fill', outline: true }
}

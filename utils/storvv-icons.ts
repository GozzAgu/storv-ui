/**
 * Storvv's own icon set. One style everywhere: a 24px grid, a rounded 1.6 stroke, and two tones —
 * a stronger fill (`tone: 'fill'`) on the part that matters and a soft fill (`tone: 'soft'`) on the
 * rest. Colour comes from `currentColor`, so icons follow light and dark mode. Rendered by
 * components/brand/StorvvIcon.vue.
 *
 * A part is one path. Parts with a `tone` are filled and not stroked (unless `outline` is set);
 * parts without one are stroked outlines. Draw fills first, outlines last.
 */

export interface StorvvIconPart {
  d: string
  tone?: 'fill' | 'soft'
  /** Also stroke a filled part. */
  outline?: boolean
  /** Stroke width for this part (default 1.6). */
  width?: number
  transform?: string
}

const circle = (cx: number, cy: number, r: number) =>
  `M${cx + r} ${cy}a${r} ${r} 0 1 1-${2 * r} 0 ${r} ${r} 0 0 1 ${2 * r} 0Z`

export const STORVV_ICONS = {
  // ── Shops and trades ──────────────────────────────────────────────────────
  phone: [
    { d: 'M8.2 5.4h7.6v11.2H8.2Z', tone: 'fill' },
    {
      d: 'M8.6 2.5h6.8a2.6 2.6 0 0 1 2.6 2.6v13.8a2.6 2.6 0 0 1-2.6 2.6H8.6A2.6 2.6 0 0 1 6 18.9V5.1a2.6 2.6 0 0 1 2.6-2.6Z',
    },
    { d: 'M11 19h2' },
  ],
  tv: [
    {
      d: 'M4.6 5.5h14.8a1.9 1.9 0 0 1 1.9 1.9v8.2a1.9 1.9 0 0 1-1.9 1.9H4.6a1.9 1.9 0 0 1-1.9-1.9V7.4a1.9 1.9 0 0 1 1.9-1.9Z',
      tone: 'soft',
      outline: true,
    },
    { d: 'M6.2 8.2 9 8.2M6.2 10.4h1.4', width: 1.4 },
    { d: 'M12 17.5v3M8 20.5h8' },
  ],
  basket: [
    { d: 'M4 10h16l-1.6 8.5a2 2 0 0 1-2 1.6H7.6a2 2 0 0 1-2-1.6Z', tone: 'fill', outline: true },
    { d: 'M2.8 10h18.4M8.4 10 11 4.4M15.6 10 13 4.4' },
    { d: 'M9.6 13.4v3.4M14.4 13.4v3.4', width: 1.4 },
  ],
  shirt: [
    {
      d: 'M8.6 3.5 4 6.2l1.8 4 2-.9v11.2h8.4V9.3l2 .9 1.8-4-4.6-2.7c-.4 1.5-1.8 2.5-3.4 2.5S9 5 8.6 3.5Z',
      tone: 'fill',
      outline: true,
    },
  ],
  pill: [
    { d: 'M8 8.5h4v7H8a3.5 3.5 0 0 1 0-7Z', tone: 'fill', transform: 'rotate(-45 12 12)' },
    {
      d: 'M8 8.5h8a3.5 3.5 0 0 1 0 7H8a3.5 3.5 0 0 1 0-7ZM12 8.5v7',
      transform: 'rotate(-45 12 12)',
    },
  ],
  hammer: [
    {
      d: 'M11.2 5.4 14.3 3.6l6 6-1.8 3.1a1.2 1.2 0 0 1-1.9.3L10.9 7.3a1.2 1.2 0 0 1 .3-1.9Z',
      tone: 'fill',
      outline: true,
    },
    { d: 'M12.6 9.4 4.4 17.6a1.7 1.7 0 0 0 2.4 2.4l8.2-8.2' },
  ],
  car: [
    {
      d: 'M3.5 15.6v-3.3l1.8-4.6a2 2 0 0 1 1.9-1.3h9.6a2 2 0 0 1 1.9 1.3l1.8 4.6v3.3a1.1 1.1 0 0 1-1.1 1.1H4.6a1.1 1.1 0 0 1-1.1-1.1Z',
      tone: 'soft',
      outline: true,
    },
    { d: 'M6.3 11.8 7.5 8.6h9l1.2 3.2Z', tone: 'fill' },
    { d: circle(7.6, 16.8, 1.8), tone: 'fill', outline: true },
    { d: circle(16.4, 16.8, 1.8), tone: 'fill', outline: true },
  ],
  sofa: [
    { d: 'M5 11V8.2A2.2 2.2 0 0 1 7.2 6h9.6A2.2 2.2 0 0 1 19 8.2V11' },
    {
      d: 'M3.5 11.6a1.8 1.8 0 0 1 3.5.4v1.6h10V12a1.8 1.8 0 0 1 3.5-.4V17a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 17Z',
      tone: 'fill',
      outline: true,
    },
    { d: 'M6 18.5V20M18 18.5V20' },
  ],
  book: [
    { d: 'M12 6.5C10.4 5.3 8.2 4.8 4 5v13c4.2-.2 6.4.3 8 1.5Z', tone: 'fill' },
    {
      d: 'M12 6.5C10.4 5.3 8.2 4.8 4 5v13c4.2-.2 6.4.3 8 1.5 1.6-1.2 3.8-1.7 8-1.5V5c-4.2-.2-6.4.3-8 1.5ZM12 6.5v13',
    },
  ],
  gift: [
    {
      d: 'M5 11h14v8.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5Z',
      tone: 'soft',
      outline: true,
    },
    { d: 'M3.8 7.8h16.4V11H3.8Z', tone: 'fill', outline: true },
    {
      d: 'M12 7.8V21M12 7.8C10.6 4.2 7 4.3 7.4 6.2c.3 1.3 2.8 1.6 4.6 1.6Zm0 0c1.4-3.6 5-3.5 4.6-1.6-.3 1.3-2.8 1.6-4.6 1.6Z',
    },
  ],
  sprout: [
    { d: 'M12 12.6C12 8.5 9 6 5 6c0 4 3 6.6 7 6.6Z', tone: 'fill', outline: true },
    { d: 'M12 15.2c0-3.6 2.6-5.8 6.5-5.8 0 3.6-2.7 5.8-6.5 5.8Z', tone: 'fill', outline: true },
    { d: 'M12 20.5v-8M7.5 20.5h9' },
  ],
  boxes: [
    { d: 'M8 3.5h8v8H8Z', tone: 'fill', outline: true },
    { d: 'M3.5 12.5h8v8h-8Z', tone: 'soft', outline: true },
    { d: 'M12.5 12.5h8v8h-8Z', tone: 'soft', outline: true },
    { d: 'M10.6 3.5v2.4M6.1 12.5v2.4M15.1 12.5v2.4', width: 1.4 },
  ],

  // ── Selling and stock ─────────────────────────────────────────────────────
  store: [
    {
      d: 'M3.4 9.2 5 4.2h14l1.6 5c0 1.5-1.3 2.7-2.9 2.7s-2.9-1.2-2.9-2.7c0 1.5-1.3 2.7-2.8 2.7S9.2 10.7 9.2 9.2c0 1.5-1.3 2.7-2.9 2.7S3.4 10.7 3.4 9.2Z',
      tone: 'fill',
      outline: true,
    },
    { d: 'M4.8 11.6v8.2h14.4v-8.2' },
    { d: 'M10.1 19.8v-4.4h3.8v4.4', tone: 'soft', outline: true },
    { d: 'M6.8 14.2h1.6M15.6 14.2h1.6', width: 1.4 },
  ],
  parcel: [
    { d: 'M12 2.9 20.4 7.5 12 12.1 3.6 7.5Z', tone: 'fill' },
    { d: 'M3.6 7.5 12 12.1v9L3.6 16.5Z', tone: 'soft' },
    { d: 'M12 2.9 20.4 7.5v9L12 21.1 3.6 16.5v-9ZM3.6 7.5 12 12.1l8.4-4.6M12 12.1v9' },
    { d: 'M7.8 5.2 16.2 9.8v3.4', width: 1.4 },
  ],
  receipt: [
    {
      d: 'M6 3h12v18l-2.2-1.4-2 1.4-1.8-1.4-1.8 1.4-2-1.4L6 21Z',
      tone: 'soft',
      outline: true,
    },
    { d: 'M9 7.5h6v3H9Z', tone: 'fill' },
    { d: 'M9 14h6M9 17h3.5', width: 1.4 },
  ],
  scan: [
    { d: 'M5.5 11.2h13v1.6h-13Z', tone: 'fill' },
    {
      d: 'M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16',
    },
    { d: 'M8 8v8M10.6 8v8M13.4 8v8M16 8v8', width: 1.4 },
  ],
  cash: [
    { d: 'M5.5 5h14a1.5 1.5 0 0 1 1.5 1.5V14' },
    {
      d: 'M3.5 8h14a1 1 0 0 1 1 1v8.5a1 1 0 0 1-1 1h-14a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z',
      tone: 'soft',
      outline: true,
    },
    { d: circle(10.5, 13.25, 2.4), tone: 'fill', outline: true },
  ],
  pos: [
    { d: 'M8.3 5h7.4v5H8.3Z', tone: 'fill' },
    {
      d: 'M7 2.5h10a1.5 1.5 0 0 1 1.5 1.5v16a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V4A1.5 1.5 0 0 1 7 2.5Z',
    },
    { d: 'M9 13.6h.01M12 13.6h.01M15 13.6h.01M9 17h.01M12 17h.01M15 17h.01', width: 2.2 },
  ],
  naira: [
    { d: circle(12, 12, 8.6), tone: 'soft', outline: true },
    { d: 'M9.6 16.4V7.6l4.8 8.8V7.6M7.8 11h8.4M7.8 13.2h8.4', width: 1.4 },
  ],
  transfer: [
    { d: circle(4.6, 8.5, 1.6), tone: 'fill' },
    { d: circle(19.4, 15.5, 1.6), tone: 'fill' },
    { d: 'M7 8.5h11.5M15.2 5.2l3.3 3.3-3.3 3.3M17 15.5H5.5M8.8 12.2l-3.3 3.3 3.3 3.3' },
  ],
  swap: [
    {
      d: 'M10 8.2h4a.8.8 0 0 1 .8.8v6a.8.8 0 0 1-.8.8h-4a.8.8 0 0 1-.8-.8V9a.8.8 0 0 1 .8-.8Z',
      tone: 'fill',
      outline: true,
    },
    {
      d: 'M19.4 9.2A8 8 0 0 0 5.1 7.4M4.6 14.8a8 8 0 0 0 14.3 1.8M19.6 4.6v4.6H15M4.4 19.4v-4.6H9',
    },
  ],
  tag: [
    {
      d: 'M3.5 11.6V4.8a1.3 1.3 0 0 1 1.3-1.3h6.8l8.9 8.9a1.6 1.6 0 0 1 0 2.3l-6.5 6.5a1.6 1.6 0 0 1-2.3 0Z',
      tone: 'fill',
      outline: true,
    },
    { d: circle(7.6, 7.6, 1.3) },
  ],
  truck: [
    { d: 'M2.5 6.5h11v10h-11Z', tone: 'fill', outline: true },
    { d: 'M13.5 9.5h4l3 3.5v3.5h-7Z', tone: 'soft', outline: true },
    { d: circle(6.5, 17.5, 1.8), tone: 'fill', outline: true },
    { d: circle(16.8, 17.5, 1.8), tone: 'fill', outline: true },
  ],

  // ── People, insight and trust ─────────────────────────────────────────────
  customer: [
    { d: 'M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5Z', tone: 'soft', outline: true },
    { d: circle(12, 8, 3.5), tone: 'fill', outline: true },
  ],
  team: [
    { d: 'M2.5 19.5c.7-3.1 3-4.8 6-4.8s5.3 1.7 6 4.8Z', tone: 'soft', outline: true },
    { d: circle(8.5, 8.6, 3), tone: 'fill', outline: true },
    { d: 'M15.4 5.9a3 3 0 0 1 0 5.4M17.5 14.9c2.2.5 3.6 2.1 4 4.6' },
  ],
  chart: [
    { d: 'M4.5 13h3v7.5h-3ZM10.5 8.5h3v12h-3ZM16.5 4.5h3v16h-3Z', tone: 'fill', outline: true },
    { d: 'M3 20.5h18' },
  ],
  shield: [
    {
      d: 'M12 3 19 5.8v5.6c0 4.6-3 8-7 9.6-4-1.6-7-5-7-9.6V5.8Z',
      tone: 'soft',
      outline: true,
    },
    { d: 'M8.8 12.2 11 14.4l4.4-4.6' },
  ],
  chat: [
    {
      d: 'M4 5h16a1.5 1.5 0 0 1 1.5 1.5v9.5A1.5 1.5 0 0 1 20 17.5h-9.5L6 21v-3.5H4A1.5 1.5 0 0 1 2.5 16V6.5A1.5 1.5 0 0 1 4 5Z',
      tone: 'soft',
      outline: true,
    },
    { d: 'M7 9.5h10M7 13h6' },
  ],
} satisfies Record<string, StorvvIconPart[]>

export type StorvvIconName = keyof typeof STORVV_ICONS

export const STORVV_ICON_NAMES = Object.keys(STORVV_ICONS) as StorvvIconName[]

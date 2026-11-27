import { circle, leaf, rrect, type StorvvIconPart, type StorvvIconSet } from '../geometry'

const n = (v: number) => +v.toFixed(2)

/**
 * A price tag: square corner top-left at (x, y) with the leaf's generous curve, edges `s` long,
 * then two 45° sides `t` long down to a tightly rounded tip edge bottom-right.
 */
function tagPath(x: number, y: number, s: number, t: number, big = 3, tip = 1.5) {
  const d = tip / Math.SQRT2
  const ax = x + s + t
  const ay = y + t // top-right tip corner
  const bx = x + t
  const by = y + s + t // bottom-left tip corner
  return (
    `M${n(x)} ${n(y + big)}a${big} ${big} 0 0 1 ${big}-${big}H${n(x + s)}` +
    `L${n(ax - d)} ${n(ay - d)}A${tip} ${tip} 0 0 1 ${n(ax - d)} ${n(ay + d)}` +
    `L${n(bx + d)} ${n(by - d)}A${tip} ${tip} 0 0 1 ${n(bx - d)} ${n(by - d)}` +
    `L${n(x)} ${n(y + s)}Z`
  )
}

// ── Package / Box: one isometric box ───────────────────────────────────────
const boxTop = 'M12 2.9 20.4 7.5 12 12.1 3.6 7.5Z'
const boxLeft = 'M3.6 7.5 12 12.1v9L3.6 16.5Z'
const boxEdges = 'M12 2.9 20.4 7.5v9L12 21.1 3.6 16.5v-9ZM3.6 7.5 12 12.1l8.4-4.6M12 12.1v9'
const boxTape = 'M7.8 5.2 16.2 9.8v3.4'
const boxBase: StorvvIconPart[] = [
  { d: boxTop, tone: 'fill' },
  { d: boxLeft, tone: 'soft' },
]
const pkg = (badge: string): StorvvIconPart[] => [
  ...boxBase,
  // Bottom-right of the box cut back so the badge sits clear.
  { d: 'M13.4 20.3 12 21.1 3.6 16.5v-9L12 2.9l8.4 4.6v4.6M3.6 7.5 12 12.1l8.4-4.6M12 12.1v9' },
  { d: 'M7.8 5.2 16.2 9.8v2.2' },
  { d: badge },
]

// ── File*: one leaf page, folded corner top-right ──────────────────────────
const page = 'M8.5 2.5H14l5.5 5.5v9.5a4 4 0 0 1-4 4H6.1a1.6 1.6 0 0 1-1.6-1.6V6.5a4 4 0 0 1 4-4Z'
const fold = 'M14 2.5v4A1.5 1.5 0 0 0 15.5 8h4Z'
const file = (inner: string): StorvvIconPart[] => [
  { d: page, tone: 'soft', outline: true },
  { d: fold, tone: 'fill', outline: true },
  { d: inner },
]

// ── Calendar*: one leaf calendar with a tinted header ──────────────────────
const calHeader = 'M3 9.5V9a4.5 4.5 0 0 1 4.5-4.5h11.9A1.6 1.6 0 0 1 21 6.1v3.4Z'
const calRings = 'M8 2.5v4M16 2.5v4'
const calendar = (inner?: string): StorvvIconPart[] => [
  { d: calHeader, tone: 'fill' },
  { d: leaf(3, 4.5, 18, 16.5) },
  { d: `${calRings}M3 9.5h18${inner ?? ''}` },
]

// ── Clock / History: one face ──────────────────────────────────────────────
const face = circle(12, 12, 9)
const hands = 'M12 7.5V12l3 2'

// ── Receipt*: leaf top, zigzag tear at the bottom ──────────────────────────
const receipt =
  'M5 21V6.5A3.5 3.5 0 0 1 8.5 3h9.1A1.4 1.4 0 0 1 19 4.4V21l-2.33-1.5-2.33 1.5L12 19.5 9.67 21l-2.34-1.5L5 21Z'

/** Commerce: shops, money, stock, documents, time. */
export default {
  // ── Places ────────────────────────────────────────────────────────────────
  Store: [
    {
      d: 'M3.4 9.2 5 4.2h14l1.6 5c0 1.5-1.3 2.7-2.9 2.7s-2.9-1.2-2.9-2.7c0 1.5-1.3 2.7-2.8 2.7S9.2 10.7 9.2 9.2c0 1.5-1.3 2.7-2.9 2.7S3.4 10.7 3.4 9.2Z',
      tone: 'fill',
      outline: true,
    },
    { d: 'M10 19.8v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4', tone: 'soft', outline: true },
    { d: 'M4.8 12v6.2a1.6 1.6 0 0 0 1.6 1.6h9.3a3.5 3.5 0 0 0 3.5-3.5V12' },
  ],
  Building: [
    { d: leaf(5, 2.5, 14, 19, 4, 1.5), tone: 'soft', outline: true },
    { d: 'M10 21.5v-3.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3.5', tone: 'fill', outline: true },
    { d: 'M9 7.5h1.5M13.5 7.5H15M9 11.5h1.5M13.5 11.5H15' },
  ],
  Building2: [
    { d: leaf(4, 2.5, 10, 19, 3.5, 1.4), tone: 'soft', outline: true },
    { d: 'M14 8.5h4.6a1.4 1.4 0 0 1 1.4 1.4v11.6H14' },
    { d: 'M7.5 7h3M7.5 11h3M7.5 15h3M17 12.5v.01M17 16v.01' },
  ],
  Landmark: [
    { d: 'M3.5 8.5 11.3 4a1.5 1.5 0 0 1 1.4 0l7.8 4.5Z', tone: 'fill', outline: true },
    { d: 'M6 11.5v6M10 11.5v6M14 11.5v6M18 11.5v6M3.5 20.5h17' },
  ],
  Factory: [
    {
      d: 'M3.5 19V11.2L8.5 8v3.2L13.5 8v3.2l3-1.9V5a1.5 1.5 0 0 1 1.5-1.5h1A1.5 1.5 0 0 1 20.5 5v12.5a3 3 0 0 1-3 3H5A1.5 1.5 0 0 1 3.5 19Z',
      tone: 'soft',
      outline: true,
    },
    { d: 'M7 15.5h2M11.5 15.5h2M16 15.5h1' },
  ],
  Home: [
    { d: 'M12 3.6 18.5 9v9.5a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2V9Z', tone: 'soft' },
    { d: 'M10 20.5v-4.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4.5', tone: 'fill', outline: true },
    { d: 'M3.5 10.6 12 3.6l8.5 7M5.5 9.2v9.9a1.4 1.4 0 0 0 1.4 1.4h8.6a3 3 0 0 0 3-3V9.2' },
  ],

  // ── Money ────────────────────────────────────────────────────────────────
  Banknote: [
    { d: leaf(2.5, 6, 19, 12), tone: 'soft', outline: true },
    { d: circle(12, 12, 2.6), tone: 'fill', outline: true },
    { d: 'M6 12h.01M18 12h.01' },
  ],
  // Two coins: the back one peeks out top-right.
  Coins: [
    { d: circle(9, 15, 5.5), tone: 'fill', outline: true },
    { d: 'M9.53 9.53A5.5 5.5 0 1 1 14.47 14.47' },
    { d: circle(9, 15, 2.2) },
  ],
  CreditCard: [
    { d: leaf(2.5, 5, 19, 14), tone: 'soft', outline: true },
    { d: 'M2.5 9.5h19v3h-19Z', tone: 'fill' },
    { d: 'M6.5 15.5h3' },
  ],
  Wallet: [
    { d: leaf(3, 6, 18, 14.5), tone: 'soft', outline: true },
    { d: 'M15.5 11H21v4.5h-5.5a2.25 2.25 0 0 1 0-4.5Z', tone: 'fill', outline: true },
    { d: 'M6 6 15.6 3.5A1.2 1.2 0 0 1 17 4.7V6' },
  ],
  HandCoins: [
    { d: circle(15.5, 7.5, 3.5), tone: 'fill', outline: true },
    {
      d: 'M11 15.5h2a1.8 1.8 0 0 0 0-3.6h-3a2.6 2.6 0 0 0-1.8.7L3 17.8M7.2 21l1.4-1.3a2 2 0 0 1 1.4-.6h4a4 4 0 0 0 2.8-1.2l3.8-3.7a1.8 1.8 0 0 0-2.5-2.6l-3.4 3.1',
    },
  ],
  Handshake: [
    {
      d: 'm11 17 2 2a1 1 0 1 0 3-3m-2-2 2.5 2.5a1 1 0 1 0 3-3l-3.9-3.9a3 3 0 0 0-4.2 0l-.9.9a1 1 0 1 1-3-3l2.8-2.8a5.8 5.8 0 0 1 7.1-.9l.5.3a2 2 0 0 0 1.4.2L20.5 5',
    },
    { d: 'M20.5 4.5 21.5 14H20M3.5 4.5 2.5 14l6.5 6.5a1 1 0 1 0 3-3M3.5 5.5h7.5' },
  ],
  // Naira sign: prices are in ₦.
  DollarSign: [{ d: 'M7.5 19V5l9 14V5M4.5 10h15M4.5 14h15' }],
  Receipt: [
    { d: receipt, tone: 'soft', outline: true },
    { d: 'M8.5 7h7v3h-7Z', tone: 'fill' },
    { d: 'M8.5 13.5h7M8.5 16.5h4' },
  ],
  ReceiptText: [
    { d: receipt, tone: 'soft', outline: true },
    { d: 'M8.5 7.5h7M8.5 11h7M8.5 14.5h4' },
  ],
  Tag: [
    { d: tagPath(4, 4, 7.5, 8.5), tone: 'fill', outline: true },
    { d: circle(8.4, 8.4, 1.3) },
  ],
  Tags: [
    { d: tagPath(3.2, 4.5, 7, 7.5), tone: 'fill', outline: true },
    { d: circle(7.4, 8.7, 1.2) },
    // Second tag peeking behind: its outer edges only, 2px off the front tag.
    { d: 'M13.2 4.5 19.6 10.9a1.5 1.5 0 0 1 0 2.1l-4.6 4.6' },
  ],
  ScanBarcode: [
    {
      d: 'M3.5 8V5.5a2 2 0 0 1 2-2H8M16 3.5h2.5a2 2 0 0 1 2 2V8M20.5 16v2.5a2 2 0 0 1-2 2H16M8 20.5H5.5a2 2 0 0 1-2-2V16',
    },
    { d: 'M8 8v8M12 8v8M16 8v8' },
  ],
  QrCode: [
    {
      d: `${rrect(3.5, 3.5, 7, 7, 2)}${rrect(13.5, 3.5, 7, 7, 2)}${rrect(3.5, 13.5, 7, 7, 2)}`,
      tone: 'soft',
      outline: true,
    },
    { d: 'M6 6h2v2H6ZM16 6h2v2h-2ZM6 16h2v2H6Z', tone: 'fill' },
    { d: 'M14 14h2.5M20 14v.01M14 17.5v3M17.5 17.5h3v3' },
  ],

  // ── Bags and carts ────────────────────────────────────────────────────────
  ShoppingBag: [
    { d: leaf(4, 7, 16, 14, 4, 1.5), tone: 'soft', outline: true },
    { d: 'M8.5 7V6a3.5 3.5 0 0 1 7 0v1' },
    { d: 'M9 11a3 3 0 0 0 6 0' },
  ],
  ShoppingBasket: [
    { d: 'M4.2 10h15.6l-1.5 8.4a2 2 0 0 1-2 1.6H7.7a2 2 0 0 1-2-1.6Z', tone: 'soft', outline: true },
    { d: 'M3 10h18M8.4 10 11 4.4M15.6 10 13 4.4' },
    { d: 'M9.5 13.5v3M14.5 13.5v3' },
  ],
  ShoppingCart: [
    { d: 'M5.7 7.5h14.8l-1.6 6.4a1.8 1.8 0 0 1-1.7 1.3H8.6a1.8 1.8 0 0 1-1.8-1.4Z', tone: 'soft' },
    { d: `${circle(9, 19.3, 1.3)}${circle(17, 19.3, 1.3)}`, tone: 'fill', outline: true },
    { d: 'M2.5 3.5h2.2l2.1 10.3a1.8 1.8 0 0 0 1.8 1.4h8.6a1.8 1.8 0 0 0 1.7-1.3l1.6-6.4H5.7' },
  ],

  // ── Stock ─────────────────────────────────────────────────────────────────
  Package: [...boxBase, { d: boxEdges }, { d: boxTape }],
  PackageCheck: pkg('m14.2 17.8 2 2 4.6-4.6'),
  PackageMinus: pkg('M14.5 17.5h6'),
  PackagePlus: pkg('M17.5 14.5v6M14.5 17.5h6'),
  PackageSearch: pkg(`${circle(16.6, 16.6, 2.4)}m1.7 1.7 2.2 2.2`),
  PackageX: pkg('m15.2 15.2 4.6 4.6M19.8 15.2l-4.6 4.6'),
  Box: [...boxBase, { d: boxEdges }],
  // Stacked cartons, each with a lid line.
  Boxes: [
    { d: leaf(7.75, 3, 8.5, 8, 2.8, 1.2), tone: 'fill', outline: true },
    { d: `${leaf(2.75, 13, 8.5, 8, 2.8, 1.2)}${leaf(12.75, 13, 8.5, 8, 2.8, 1.2)}`, tone: 'soft', outline: true },
    { d: 'M7.75 6h8.5M2.75 16h8.5M12.75 16h8.5' },
  ],
  Archive: [
    { d: rrect(3, 3.5, 18, 5, 1.6), tone: 'fill', outline: true },
    { d: 'M4.5 8.5v10.4a1.6 1.6 0 0 0 1.6 1.6H16a3.5 3.5 0 0 0 3.5-3.5V8.5', tone: 'soft', outline: true },
    { d: 'M10 12.5h4' },
  ],
  Truck: [
    { d: 'M2.5 8A3.5 3.5 0 0 1 6 4.5h6.5A1.5 1.5 0 0 1 14 6v11.5H4A1.5 1.5 0 0 1 2.5 16Z', tone: 'soft' },
    { d: `${circle(7, 17.5, 2)}${circle(17, 17.5, 2)}`, tone: 'fill', outline: true },
    {
      d: 'M5 17.5H4A1.5 1.5 0 0 1 2.5 16V8A3.5 3.5 0 0 1 6 4.5h6.5A1.5 1.5 0 0 1 14 6v11.5M9 17.5h6M14 8.5h3.4a1.5 1.5 0 0 1 1.2.6l2.6 3.4a1.5 1.5 0 0 1 .3.9V16a1.5 1.5 0 0 1-1.5 1.5H19',
    },
  ],
  Printer: [
    { d: leaf(2.5, 8, 19, 9.5, 3.5, 1.6), tone: 'soft' },
    { d: rrect(6.5, 13.5, 11, 7.5, 1.2), tone: 'fill', outline: true },
    {
      d: 'M6.5 3.5h11v4.5M6.5 3.5V8M6.5 17.5H4.1a1.6 1.6 0 0 1-1.6-1.6v-4.4A3.5 3.5 0 0 1 6 8h13.9a1.6 1.6 0 0 1 1.6 1.6V14a3.5 3.5 0 0 1-3.5 3.5h-.5',
    },
  ],
  Gift: [
    { d: leaf(4.5, 11, 15, 10, 3.5, 1.4), tone: 'soft', outline: true },
    { d: rrect(3, 7.5, 18, 3.5, 1.2), tone: 'fill', outline: true },
    {
      d: 'M12 7.5V21M12 7.5C10.6 3.9 7 4 7.4 5.9c.3 1.3 2.8 1.6 4.6 1.6Zm0 0c1.4-3.6 5-3.5 4.6-1.6-.3 1.3-2.8 1.6-4.6 1.6Z',
    },
  ],
  Inbox: [
    { d: 'M3 13h4.5L9 15.5h6l1.5-2.5H21v2a4.5 4.5 0 0 1-4.5 4.5H4.6A1.6 1.6 0 0 1 3 17.9Z', tone: 'fill' },
    { d: leaf(3, 4.5, 18, 15) },
    { d: 'M3 13h4.5L9 15.5h6l1.5-2.5H21' },
  ],

  // ── Documents ─────────────────────────────────────────────────────────────
  Clipboard: [
    { d: leaf(4.5, 4.5, 15, 17, 4, 1.6), tone: 'soft' },
    { d: rrect(8.5, 2.5, 7, 4, 1.2), tone: 'fill', outline: true },
    { d: 'M15.5 4.5h2.4a1.6 1.6 0 0 1 1.6 1.6v11.4a4 4 0 0 1-4 4H6.1a1.6 1.6 0 0 1-1.6-1.6V8.5a4 4 0 0 1 4-4' },
  ],
  ClipboardList: [
    { d: leaf(4.5, 4.5, 15, 17, 4, 1.6), tone: 'soft' },
    { d: rrect(8.5, 2.5, 7, 4, 1.2), tone: 'fill', outline: true },
    {
      d: 'M15.5 4.5h2.4a1.6 1.6 0 0 1 1.6 1.6v11.4a4 4 0 0 1-4 4H6.1a1.6 1.6 0 0 1-1.6-1.6V8.5a4 4 0 0 1 4-4M8.5 11h.01M11.5 11h4M8.5 15h.01M11.5 15h4',
    },
  ],
  FileCheck: file('m8.8 14.6 2.2 2.2 4.4-4.4'),
  FileDown: file('M12 10.5v7M9 14.5l3 3 3-3'),
  FileSpreadsheet: file('M8.5 12.5h2M13.5 12.5h2M8.5 16h2M13.5 16h2'),
  FileText: file('M8.5 9.5H11M8.5 13h7M8.5 16.5h7'),
  Table: [
    { d: leaf(3, 3.5, 18, 17), tone: 'soft' },
    { d: 'M3 9V8a4.5 4.5 0 0 1 4.5-4.5h11.9A1.6 1.6 0 0 1 21 5.1V9Z', tone: 'fill' },
    { d: `${leaf(3, 3.5, 18, 17)}M3 9h18M3 14.75h18M12 9v11.5` },
  ],

  // ── Time ──────────────────────────────────────────────────────────────────
  Calendar: calendar(),
  CalendarClock: [
    { d: calHeader, tone: 'fill' },
    { d: circle(17, 17, 4.5), tone: 'soft', outline: true },
    { d: `M21 10.5V6.1a1.6 1.6 0 0 0-1.6-1.6H7.5A4.5 4.5 0 0 0 3 9v10.4A1.6 1.6 0 0 0 4.6 21h5.9${calRings}M3 9.5h18` },
    { d: 'M17 15v2l1.4 1' },
  ],
  CalendarDays: calendar('M8 13.5h.01M12 13.5h.01M16 13.5h.01M8 17h.01M12 17h.01M16 17h.01'),
  Clock: [
    { d: face, tone: 'soft', outline: true },
    { d: hands },
  ],
  History: [
    { d: face, tone: 'soft' },
    { d: 'M3 12a9 9 0 1 0 2.64-6.36M5.64 2.5v3.14h3.14' },
    { d: hands },
  ],
} satisfies StorvvIconSet

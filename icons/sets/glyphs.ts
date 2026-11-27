import { circle, dot, leaf, rrect, type StorvvIconSet } from '../geometry'

// Shared glyph geometry. Every arrow and chevron is ArrowRight / ChevronRight turned or mirrored.
const ARROW_RIGHT = 'M5 12h14M14.5 7.5 19 12l-4.5 4.5'
const CHEVRON_RIGHT = 'm10 6.5 5.5 5.5-5.5 5.5'

// Search: one lens and handle for Search, SearchCheck and SearchX.
const LENS = circle(10.5, 10.5, 7)
const HANDLE = 'm15.5 15.5 5 5'

// Download / Upload: an open tray with the leaf corners (tight bottom-left, generous bottom-right).
const TRAY = 'M3.5 15v4a1.5 1.5 0 0 0 1.5 1.5h11a4 4 0 0 0 4-4V15'

// Refresh arcs: radius 8 about the centre, each ending in an open bracket head.
const R_CW_TOP = 'M4 12a8 8 0 0 1 14.93-4M19 3.5V8h-4.5'
const R_CW_BOTTOM = 'M20 12a8 8 0 0 1-14.93 4M5 20.5V16h4.5'

// Send: a paper plane, nose to the top right.
const PLANE =
  'M20.5 3.5 3.8 9.6a.6.6 0 0 0 0 1.1l6.9 2.6 2.6 6.9a.6.6 0 0 0 1.1 0ZM20.5 3.5l-9.8 9.8'

/** Controls and glyphs: pure strokes, no tints, unless the glyph sits on a container. */
export default {
  // Plus: arms stop 1px short of Lucide's, so it reads lighter beside the tinted icons.
  Plus: [{ d: 'M12 6v12M6 12h12' }],
  Minus: [{ d: 'M6 12h12' }],
  X: [{ d: 'M7 7l10 10M17 7 7 17' }],
  // Check: short arm at the Storvv slant, long arm reaching past the centre line.
  Check: [{ d: 'm5.5 12.6 4.1 4.1L18.6 7.4' }],
  // The second check is the first moved right 5.5, its short arm cut back clear of the first.
  CheckCheck: [{ d: 'm2.5 12.6 4.1 4.1L15.6 7.4M10.9 15.5l1.2 1.2 9-9.3' }],

  // ── Chevrons ────────────────────────────────────────────────────────────
  ChevronRight: [{ d: CHEVRON_RIGHT }],
  ChevronLeft: [{ d: 'm14 6.5-5.5 5.5 5.5 5.5' }],
  ChevronDown: [{ d: 'm6.5 10 5.5 5.5 5.5-5.5' }],
  ChevronUp: [{ d: 'm6.5 14 5.5-5.5 5.5 5.5' }],
  ChevronsRight: [{ d: 'm6 6.5 5.5 5.5L6 17.5m6.5-11L18 12l-5.5 5.5' }],
  ChevronsUpDown: [{ d: 'm7.5 9 4.5-4.5L16.5 9m-9 6 4.5 4.5 4.5-4.5' }],

  // ── Arrows: open heads, 4.5 long, so the shaft leads ────────────────────
  ArrowRight: [{ d: ARROW_RIGHT }],
  ArrowLeft: [{ d: 'M19 12H5m4.5-4.5L5 12l4.5 4.5' }],
  ArrowDown: [{ d: 'M12 5v14m-4.5-4.5L12 19l4.5-4.5' }],
  ArrowUp: [{ d: 'M12 19V5M7.5 9.5 12 5l4.5 4.5' }],
  ArrowUpRight: [{ d: ARROW_RIGHT, transform: 'rotate(-45 12 12)' }],
  // Paired arrows: heads trimmed to 4 so the two don't crowd.
  ArrowLeftRight: [{ d: 'M19 7H5m4-4L5 7l4 4M5 17h14m-4-4 4 4-4 4' }],
  ArrowUpDown: [{ d: 'M7 19V5M3 9l4-4 4 4m6-4v14m-4-4 4 4 4-4' }],
  ArrowUpWideNarrow: [{ d: 'M7 19V5M3 9l4-4 4 4m3 1h6.5M14 14h4.5M14 18h2.5' }],
  Undo2: [{ d: 'M9 13.5 4.5 9 9 4.5M4.5 9h10a5 5 0 0 1 0 10H11' }],
  Repeat: [
    {
      d:
        'M3.5 12v-1A4.5 4.5 0 0 1 8 6.5h12.5M17 3l3.5 3.5L17 10' +
        'M20.5 12v1a4.5 4.5 0 0 1-4.5 4.5H3.5M7 14l-3.5 3.5L7 21',
    },
  ],
  Split: [{ d: 'M15.5 3.5h5v5m-12-5h-5v5M12 20.5v-8a4 4 0 0 0-1.2-2.8L3.5 3.5m11 6 6-6' }],
  Maximize2: [{ d: 'M15 4h5v5M9 20H4v-5M20 4l-6 6M4 20l6-6' }],

  // ── Refresh and rotate ──────────────────────────────────────────────────
  RefreshCw: [{ d: R_CW_TOP + R_CW_BOTTOM }],
  RefreshCcwDot: [
    dot(12, 12),
    { d: 'M20 12a8 8 0 0 0-14.93-4M5 3.5V8h4.5M4 12a8 8 0 0 0 14.93 4M19 20.5V16h-4.5' },
  ],
  RotateCw: [{ d: 'M20 12a8 8 0 1 1-1.07-4M19 3.5V8h-4.5' }],
  RotateCcw: [{ d: 'M4 12a8 8 0 1 0 1.07-4M5 3.5V8h4.5' }],
  // Spun by CSS about (12, 12): a three-quarter arc on the centre.
  Loader2: [{ d: 'M21 12a9 9 0 1 1-9-9' }],

  // ── Shapes, dots and lines ──────────────────────────────────────────────
  Circle: [{ d: circle(12, 12, 9) }],
  Ellipsis: [dot(5.5, 12), dot(12, 12), dot(18.5, 12)],
  EllipsisVertical: [dot(12, 5.5), dot(12, 12), dot(12, 18.5)],
  Menu: [{ d: 'M4 6.5h16M4 12h16M4 17.5h16' }],
  List: [dot(4.5, 6.5), dot(4.5, 12), dot(4.5, 17.5), { d: 'M9 6.5h11.5M9 12h11.5M9 17.5h11.5' }],
  ListChecks: [{ d: 'm3.5 6.5 2 2 4-4m-6 11 2 2 4-4M13 6.5h7.5M13 12h7.5M13 17.5h7.5' }],
  Hash: [{ d: 'M4.5 9h15m-15 6h15M10.5 4l-2 16m7-16-2 16' }],
  Link2: [{ d: 'M9.5 16.5h-2a4.5 4.5 0 0 1 0-9h2m5 0h2a4.5 4.5 0 0 1 0 9h-2m-6-4.5h7' }],
  Filter: [
    {
      d: 'M4.5 4.5h15a.8.8 0 0 1 .6 1.3L14 13v5.6a1 1 0 0 1-.5.9l-2 1.1a1 1 0 0 1-1.5-.9V13L3.9 5.8a.8.8 0 0 1 .6-1.3Z',
    },
  ],
  SlidersHorizontal: [
    { d: 'M3.5 5.5h7M14 3.5v4m0-2h6.5M3.5 12H8m0-2v4m3.5-2h9M3.5 18.5H12m3.5-2v4m0-2h5' },
  ],
  Send: [{ d: PLANE }],
  // Send turned to face right, then slid left so the nose stops at 20.25.
  SendHorizontal: [{ d: PLANE, transform: 'translate(-3.75 0) rotate(45 12 12)' }],

  // ── Glyphs on a container: soft tint on the container, plain glyph on top ─
  Play: [
    {
      d: 'M6.5 5.2v13.6a1.2 1.2 0 0 0 1.8 1l10.4-6.8a1.2 1.2 0 0 0 0-2L8.3 4.2a1.2 1.2 0 0 0-1.8 1Z',
      tone: 'soft',
      outline: true,
    },
  ],
  Pause: [{ d: rrect(6, 4.5, 4, 15, 1.5) + rrect(14, 4.5, 4, 15, 1.5), tone: 'soft', outline: true }],
  ToggleRight: [
    { d: rrect(2.5, 6, 19, 12, 6), tone: 'soft', outline: true },
    { d: circle(15.5, 12, 3), tone: 'fill', outline: true },
  ],
  Search: [{ d: LENS, tone: 'soft', outline: true }, { d: HANDLE }],
  SearchCheck: [{ d: LENS, tone: 'soft', outline: true }, { d: HANDLE + 'M7.6 10.6l2 2 3.8-3.8' }],
  SearchX: [{ d: LENS, tone: 'soft', outline: true }, { d: HANDLE + 'M8.5 8.5l4 4m0-4-4 4' }],
  Share2: [
    {
      d: circle(17.5, 5.5, 2.8) + circle(6.5, 12, 2.8) + circle(17.5, 18.5, 2.8),
      tone: 'soft',
      outline: true,
    },
    { d: 'M9.6 10.2 14.4 7.3M9.6 13.8l4.8 2.9' },
  ],
  // Box with its top-right corner open for the arrow; leaf corners as on every container.
  ExternalLink: [
    { d: leaf(3.5, 6.5, 14, 14, 4, 1.5), tone: 'soft' },
    {
      d: 'M11 6.5H7.5a4 4 0 0 0-4 4V19a1.5 1.5 0 0 0 1.5 1.5h8.5a4 4 0 0 0 4-4V13M15 3.5h5.5V9M20.5 3.5 11 13',
    },
  ],
  Download: [
    { d: TRAY + 'Z', tone: 'soft' },
    { d: TRAY + 'M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5' },
  ],
  Upload: [
    { d: TRAY + 'Z', tone: 'soft' },
    { d: TRAY + 'M12 14.5v-11M7.5 8 12 3.5 16.5 8' },
  ],
  CloudUpload: [
    { d: 'M7 16.5a4 4 0 0 1-.4-8 6 6 0 0 1 11.5 1.2 3.5 3.5 0 0 1-.6 6.8Z', tone: 'soft' },
    { d: 'M8.5 16.5H7a4 4 0 0 1-.4-8 6 6 0 0 1 11.5 1.2 3.5 3.5 0 0 1-.6 6.8h-2M12 20.5V11m-3 3 3-3 3 3' },
  ],
  // Door with the leaf's big top-left corner; the arrow walks out through the open side.
  LogOut: [
    { d: 'M9.5 3.5H8A4.5 4.5 0 0 0 3.5 8v11A1.5 1.5 0 0 0 5 20.5h4.5Z', tone: 'soft' },
    { d: 'M9.5 3.5H8A4.5 4.5 0 0 0 3.5 8v11A1.5 1.5 0 0 0 5 20.5h4.5M10 12h10.5M16 7.5l4.5 4.5-4.5 4.5' },
  ],

  // A container glyph: leaf card in front, soft tint behind.
  Copy: [
    { d: leaf(8.5, 8.5, 12, 12, 3.5, 1.4), tone: 'soft', outline: true },
    { d: 'M15.5 5.6V5a1.5 1.5 0 0 0-1.5-1.5H7A3.5 3.5 0 0 0 3.5 7v7a1.5 1.5 0 0 0 1.5 1.5h.6' },
  ],
} satisfies StorvvIconSet

import { circle, leaf, rrect, type StorvvIconSet } from '../geometry'

/** Charts, layout, folders, editing and devices. */

// Charts: one axis (leaf-curved corner), one bar width, bars standing on y 17.
const AXIS = 'M3.5 3.5V17a3.5 3.5 0 0 0 3.5 3.5h13.5'
const bar = (x: number, top: number, bottom = 17) => rrect(x, top, 2.5, bottom - top, 1)

// Folders: leaf-cornered body, tab on the left.
const FOLDER =
  'M7.5 4H10q.9 0 1.4.75l.9 1.5Q12.8 7 13.7 7h5.7a1.6 1.6 0 0 1 1.6 1.6v6.9a4.5 4.5 0 0 1-4.5 4.5H4.6A1.6 1.6 0 0 1 3 18.4V8.5A4.5 4.5 0 0 1 7.5 4Z'
// A 9 × 7 folder for FolderTree.
const miniFolder = (x: number, y: number) =>
  `M${x + 2.5} ${y}H${x + 4.2}q.6 0 .9.5l.5.8q.3.5.9.5H${x + 8}a1 1 0 0 1 1 1V${y + 4.5}a2.5 2.5 0 0 1-2.5 2.5H${x + 1}a1 1 0 0 1-1-1V${y + 2.5}A2.5 2.5 0 0 1 ${x + 2.5} ${y}Z`

// Pencil: shaft at 45°, round cap top-right, tip bottom-left.
const PENCIL = 'M16.9 3.9a2.55 2.55 0 0 1 3.6 3.6L7.6 20.4 3 21.4l1.1-4.7Z'

// Panels: leaf container with the left rail tinted.
const PANEL_RAIL = 'M9 3H7.5A4.5 4.5 0 0 0 3 7.5v11.9A1.6 1.6 0 0 0 4.6 21H9Z'

export default {
  // ── Charts ────────────────────────────────────────────────────────────
  BarChart3: [
    { d: bar(12, 6), tone: 'fill', outline: true },
    { d: bar(7, 13.5) + bar(17, 10) },
    { d: AXIS },
  ],
  ChartColumn: [
    { d: bar(12, 6), tone: 'fill', outline: true },
    { d: bar(7, 13.5) + bar(17, 10) },
    { d: AXIS },
  ],
  ChartColumnIncreasing: [
    { d: bar(17, 6), tone: 'fill', outline: true },
    { d: bar(7, 13.5) + bar(12, 10) },
    { d: AXIS },
  ],
  ChartNoAxesColumnIncreasing: [
    { d: bar(16.75, 4, 20), tone: 'fill', outline: true },
    { d: bar(4.75, 14.5, 20) + bar(10.75, 9.5, 20) },
  ],
  ChartArea: [
    { d: 'M7 17v-4.6l3-3 3.5 3.5 5.5-5.5V17Z', tone: 'fill', outline: true },
    { d: AXIS },
  ],

  // ── Data & structure ──────────────────────────────────────────────────
  Database: [
    {
      d: 'M3.5 5.8c0 1.55 3.8 2.8 8.5 2.8s8.5-1.25 8.5-2.8v12.4c0 1.55-3.8 2.8-8.5 2.8s-8.5-1.25-8.5-2.8Z',
      tone: 'soft',
    },
    { d: 'M20.5 5.8a8.5 2.8 0 1 1-17 0 8.5 2.8 0 0 1 17 0Z', tone: 'fill', outline: true },
    { d: 'M3.5 5.8v12.4c0 1.55 3.8 2.8 8.5 2.8s8.5-1.25 8.5-2.8V5.8M3.5 12c0 1.55 3.8 2.8 8.5 2.8s8.5-1.25 8.5-2.8' },
  ],
  Network: [
    { d: leaf(9, 3, 6, 6, 2.4, 1), tone: 'fill', outline: true },
    { d: leaf(3, 15, 6, 6, 2.4, 1) + leaf(15, 15, 6, 6, 2.4, 1) },
    { d: 'M6 15v-1.5A1.5 1.5 0 0 1 7.5 12h9a1.5 1.5 0 0 1 1.5 1.5V15M12 9v3' },
  ],
  Workflow: [
    { d: leaf(3, 3, 8, 8, 3, 1.2), tone: 'fill', outline: true },
    { d: leaf(13, 13, 8, 8, 3, 1.2) },
    { d: 'M7 11v3.5A2.5 2.5 0 0 0 9.5 17H13' },
  ],

  // ── Layout ────────────────────────────────────────────────────────────
  LayoutDashboard: [
    { d: leaf(3, 3, 7, 9, 3, 1.2), tone: 'fill', outline: true },
    { d: leaf(14, 3, 7, 5, 2.4, 1.2) + leaf(14, 12, 7, 9, 3, 1.2) + leaf(3, 16, 7, 5, 2.4, 1.2) },
  ],
  LayoutGrid: [
    { d: leaf(3, 3, 7, 7, 3, 1.2), tone: 'fill', outline: true },
    { d: leaf(14, 3, 7, 7, 3, 1.2) + leaf(3, 14, 7, 7, 3, 1.2) + leaf(14, 14, 7, 7, 3, 1.2) },
  ],
  Layers2: [
    { d: 'M12 3.2 20.5 8 12 12.8 3.5 8Z', tone: 'fill', outline: true },
    { d: 'M16.3 13.6 20.5 16 12 20.8 3.5 16l4.2-2.4' },
  ],
  PanelLeftClose: [
    { d: PANEL_RAIL, tone: 'fill' },
    { d: leaf(3, 3, 18, 18) },
    { d: 'M9 3v18M16.2 9.2 13.4 12l2.8 2.8' },
  ],
  PanelLeftOpen: [
    { d: PANEL_RAIL, tone: 'fill' },
    { d: leaf(3, 3, 18, 18) },
    { d: 'M9 3v18M13.6 9.2l2.8 2.8-2.8 2.8' },
  ],

  // ── Folders ───────────────────────────────────────────────────────────
  Folder: [{ d: FOLDER, tone: 'soft', outline: true }],
  FolderClosed: [
    { d: FOLDER, tone: 'soft', outline: true },
    { d: 'M3 10.5h18' },
  ],
  FolderOpen: [
    {
      d: 'M3.4 19.2 6.6 11.6A1.8 1.8 0 0 1 8.3 10.5h12a1.3 1.3 0 0 1 1.25 1.7l-1.9 5.6A3.4 3.4 0 0 1 16.4 20H4.6Z',
      tone: 'fill',
      outline: true,
    },
    {
      d: 'M4.6 20A1.6 1.6 0 0 1 3 18.4V8.5A4.5 4.5 0 0 1 7.5 4H10q.9 0 1.4.75l.9 1.5Q12.8 7 13.7 7h3.7A1.6 1.6 0 0 1 19 8.6v1.9',
    },
  ],
  FolderPlus: [
    { d: FOLDER, tone: 'soft', outline: true },
    { d: 'M12 11v5M9.5 13.5h5' },
  ],
  FolderTree: [
    { d: miniFolder(12, 3), tone: 'fill', outline: true },
    { d: miniFolder(12, 14), tone: 'soft', outline: true },
    { d: 'M4 3v12a2.5 2.5 0 0 0 2.5 2.5h3M4 4a2.5 2.5 0 0 0 2.5 2.5h3' },
  ],

  // ── Goals & moments ───────────────────────────────────────────────────
  Target: [
    { d: circle(12, 12, 9), tone: 'soft', outline: true },
    { d: circle(12, 12, 1.8), tone: 'fill', outline: true },
    { d: circle(12, 12, 5.4) },
  ],
  Rocket: [
    {
      d: 'M12 15 9 12a22 22 0 0 1 2-3.95A12.9 12.9 0 0 1 21.5 2.5c0 2.7-.8 7.3-6 10.9A22.4 22.4 0 0 1 12 15Z',
      tone: 'soft',
      outline: true,
    },
    {
      d: 'M4.6 16.4c-1.5 1.26-2 4.9-2 4.9s3.7-.5 5-2c.7-.84.7-2.13-.1-2.9a2.2 2.2 0 0 0-2.9 0Z',
      tone: 'fill',
      outline: true,
    },
    { d: 'M9 12H4.5s.55-3 2-4c1.6-1.1 4.6-.3 4.6-.3M12 15v4.5s3-.55 4-2c1.1-1.6.3-4.6.3-4.6' },
  ],
  Sparkles: [
    // Main star: four long concave points, slightly low-left so the accents have room.
    {
      d: 'M10.5 5.5Q11.3 12.7 18.5 13.5 11.3 14.3 10.5 21.5 9.7 14.3 2.5 13.5 9.7 12.7 10.5 5.5Z',
      tone: 'soft',
      outline: true,
    },
    // A small glint top-right…
    { d: circle(19.5, 18.5, 1.1), tone: 'fill', outline: true },
    // …and a twinkle.
    { d: 'M18 2.8v5M15.5 5.3h5' },
  ],
  Zap: [{ d: 'M14 2.8 4.8 13.4h6.6L10 21.2l9.2-10.6h-6.6Z', tone: 'fill', outline: true }],
  Bookmark: [
    { d: 'M18.5 20.5 12 16.6l-6.5 3.9V6.5A3.5 3.5 0 0 1 9 3h7.9a1.6 1.6 0 0 1 1.6 1.6Z', tone: 'soft', outline: true },
  ],
  Award: [
    { d: circle(12, 8.5, 5.5), tone: 'soft', outline: true },
    { d: circle(12, 8.5, 2.2), tone: 'fill' },
    { d: 'M8.6 12.8 7.3 20.4a.5.5 0 0 0 .8.5l3.3-2.5a1 1 0 0 1 1.2 0l3.3 2.5a.5.5 0 0 0 .8-.5l-1.3-7.6' },
  ],
  Medal: [
    { d: circle(12, 15.5, 5.5), tone: 'soft', outline: true },
    { d: circle(12, 15.5, 2.2), tone: 'fill' },
    {
      d: 'M8.3 11.4 4.9 4.3A.9.9 0 0 1 5.7 3h2.8a1 1 0 0 1 .9.55L12 8.6l2.6-5.05a1 1 0 0 1 .9-.55h2.8a.9.9 0 0 1 .8 1.3l-3.4 7.1',
    },
  ],

  // ── Editing ───────────────────────────────────────────────────────────
  Pencil: [
    { d: PENCIL, tone: 'soft', outline: true },
    { d: 'M15 5.8l3.6 3.6' },
  ],
  PencilLine: [
    { d: PENCIL, tone: 'soft', outline: true },
    { d: 'M15 5.8l3.6 3.6M13 20.5h7.5' },
  ],
  SquarePen: [
    { d: 'M18.4 2.9a2 2 0 0 1 2.8 2.8l-8.6 8.6-3.8 1 1-3.8Z', tone: 'fill', outline: true },
    { d: 'M11.5 3.5H8A4.5 4.5 0 0 0 3.5 8v10.9a1.6 1.6 0 0 0 1.6 1.6H16a4.5 4.5 0 0 0 4.5-4.5v-3.5' },
  ],
  Trash2: [
    { d: 'M5.5 7h13v10a4 4 0 0 1-4 4H7.1a1.6 1.6 0 0 1-1.6-1.6Z', tone: 'soft', outline: true },
    { d: 'M3.5 7h17M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2M10 11v6M14 11v6' },
  ],
  Paperclip: [
    {
      d: 'm16 6.5-8.2 8.4a2 2 0 0 0 2.8 2.8l8.2-8.4a4 4 0 1 0-5.6-5.6L5 12.1a6 6 0 1 0 8.5 8.5l7-7.1',
    },
  ],
  MapPin: [
    {
      d: 'M19.3 9.8c0 4.7-5.1 9.6-6.7 11.1a.9.9 0 0 1-1.2 0C9.8 19.4 4.7 14.5 4.7 9.8a7.3 7.3 0 0 1 14.6 0Z',
      tone: 'soft',
      outline: true,
    },
    { d: circle(12, 9.8, 2.7), tone: 'fill', outline: true },
  ],
  MousePointerClick: [
    {
      d: 'M9.3 10a.55.55 0 0 1 .7-.7l10.4 4.3a.5.5 0 0 1-.07.95l-4 1a1 1 0 0 0-.74.74l-1 4a.5.5 0 0 1-.95.07Z',
      tone: 'fill',
      outline: true,
    },
    { d: 'M7.6 3.2l.6 2.4M3.2 7.6l2.4.6M13.4 4.6l-1.6 1.6M4.6 13.4l1.6-1.6' },
  ],

  // ── Devices: leaf screens, screen area in the fill tone ────────────────
  Monitor: [
    { d: leaf(2.5, 3.5, 19, 13.5), tone: 'fill', outline: true },
    { d: 'M12 17v3.5M8 20.5h8' },
  ],
  MonitorPlay: [
    { d: leaf(2.5, 3.5, 19, 13.5), tone: 'fill', outline: true },
    { d: 'M12 17v3.5M8 20.5h8' },
    { d: 'M10.5 7.8v4.9a.5.5 0 0 0 .75.43l4-2.45a.5.5 0 0 0 0-.86l-4-2.45a.5.5 0 0 0-.75.43Z' },
  ],
  Laptop: [
    { d: leaf(4, 4, 16, 11.5, 4, 1.4), tone: 'fill', outline: true },
    { d: 'M2.5 19.5h19' },
  ],
  Smartphone: [
    { d: leaf(6, 2.5, 12, 19, 3.5, 1.4), tone: 'fill', outline: true },
    { d: 'M11 18.2h2' },
  ],
  Tablet: [
    { d: leaf(4, 2.5, 16, 19), tone: 'fill', outline: true },
    { d: 'M11 18.2h2' },
  ],
  TabletSmartphone: [
    { d: leaf(3, 8.5, 10, 13, 3, 1.2), tone: 'fill', outline: true },
    { d: 'M6 6.5A3.5 3.5 0 0 1 9.5 3h9.9A1.6 1.6 0 0 1 21 4.6v12.9a3.5 3.5 0 0 1-3.5 3.5h-2M7.2 18.5h1.6' },
  ],
  Tv: [
    { d: leaf(2.5, 7, 19, 14), tone: 'fill', outline: true },
    { d: 'm16.5 2.5-4.5 4.5-4.5-4.5' },
  ],
  Camera: [
    {
      d: 'M7 6.5l1.4-1.9A1.5 1.5 0 0 1 9.6 4h4.8a1.5 1.5 0 0 1 1.2.6L17 6.5h2.9a1.6 1.6 0 0 1 1.6 1.6v7.4a4.5 4.5 0 0 1-4.5 4.5H4.1a1.6 1.6 0 0 1-1.6-1.6V11A4.5 4.5 0 0 1 7 6.5Z',
      tone: 'soft',
      outline: true,
    },
    { d: circle(12, 13, 3.4), tone: 'fill', outline: true },
  ],
  Watch: [
    { d: circle(12, 12, 6), tone: 'fill', outline: true },
    {
      d: 'M8.4 7.2l.7-3.4a1.6 1.6 0 0 1 1.6-1.3h2.6a1.6 1.6 0 0 1 1.6 1.3l.7 3.4M8.4 16.8l.7 3.4a1.6 1.6 0 0 0 1.6 1.3h2.6a1.6 1.6 0 0 0 1.6-1.3l.7-3.4M12 9.6V12l1.5 1.3',
    },
  ],
  Headphones: [
    {
      d: 'M3.5 14H6a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a1.5 1.5 0 0 1-1.5-1.5ZM20.5 14H18a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1a1.5 1.5 0 0 0 1.5-1.5Z',
      tone: 'fill',
      outline: true,
    },
    { d: 'M3.5 16.5v-4a8.5 8.5 0 0 1 17 0v4' },
  ],
  Gamepad2: [
    {
      d: 'M17.2 5.5H6.8A3.8 3.8 0 0 0 3 8.9C2.7 11.2 2.5 14.6 2.5 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.4-1.4a2 2 0 0 1 1.4-.6h3.4a2 2 0 0 1 1.4.6L16.5 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.4-.2-4.8-.5-7.1a3.8 3.8 0 0 0-3.8-3.4Z',
      tone: 'soft',
      outline: true,
    },
    { d: 'M6.5 11.5h4M8.5 9.5v4M15 12.5h.01M17.5 10h.01' },
  ],

  // ── Hardware ──────────────────────────────────────────────────────────
  Cpu: [
    { d: leaf(5, 5, 14, 14, 4, 1.5), tone: 'soft', outline: true },
    { d: leaf(9, 9, 6, 6, 2.2, 1), tone: 'fill', outline: true },
    { d: 'M9.5 2.5V5M14.5 2.5V5M9.5 19v2.5M14.5 19v2.5M2.5 9.5H5M2.5 14.5H5M19 9.5h2.5M19 14.5h2.5' },
  ],
  Router: [
    { d: leaf(2.5, 14, 19, 7.5, 3.5, 1.4), tone: 'soft', outline: true },
    { d: 'M6.5 17.75h.01M9.5 17.75h.01M15.5 14v-3.5M18.3 7.7a4 4 0 0 0-5.6 0M21 4.9a7.85 7.85 0 0 0-11 0' },
  ],
  Cable: [
    {
      d: 'M3 5h5v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2ZM16 19h5v-3a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2Z',
      tone: 'fill',
      outline: true,
    },
    { d: 'M4.5 5V2.5M6.5 5V2.5M17.5 19v2.5M19.5 19v2.5M5.5 10v7a3.5 3.5 0 0 0 7 0V7a3 3 0 0 1 6 0v7' },
  ],
  PlugZap: [
    {
      d: 'M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z',
      tone: 'fill',
      outline: true,
    },
    { d: 'M2.5 21.5 5 19M7.5 13.5 10 11M10.5 16.5 13 14M18 3l-4 4h6l-4 4' },
  ],
} satisfies StorvvIconSet

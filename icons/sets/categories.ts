import { circle, leaf, rrect, type StorvvIconSet } from '../geometry'

/**
 * Product category kinds. Shown as small tiles in pickers (16–20px), so each is a bold
 * silhouette: a soft-tinted body plus at most one fill-tinted key part.
 */

// Wrench, drawn upright (jaw on top) and turned 45°. The head alone is reused for its tint.
const wrenchHead =
  'M10.3 10.45A4.3 4.3 0 0 1 10.5 2.47V6.5a1.5 1.5 0 0 0 3 0V2.47A4.3 4.3 0 0 1 13.7 10.45'

// Guitar body: lower and upper bouts, pinched at the waist.
const guitarBody = 'M14.9 13.06A4.5 4.5 0 1 1 9.1 13.06 3.3 3.3 0 1 1 14.9 13.06Z'

export default {
  // ── Food and drink ────────────────────────────────────────────────────────
  Apple: [
    {
      d: 'M12 8c-1.4-.9-2.9-1.2-4.4-.9C5 7.6 3.7 10 4.1 13.2c.5 3.5 2.8 7 5.2 7.2.9.1 1.8-.5 2.7-.5s1.8.6 2.7.5c2.4-.2 4.7-3.7 5.2-7.2.4-3.2-.9-5.6-3.5-6.1-1.5-.3-3 0-4.4.9Z',
      tone: 'soft',
      outline: true,
    },
    { d: 'M13.2 5.6c.7-1.6 2.3-2.3 4.3-2.1-.5 1.8-2.2 2.6-4.3 2.1Z', tone: 'fill', outline: true },
    { d: 'M12 8c0-1.8.3-3.2 1-4.4' },
  ],
  Croissant: [
    {
      d: 'M4 17.5C3.2 11 7 6 12 6s8.8 5 8 11.5C18.5 14.5 15.5 13 12 13s-6.5 1.5-8 4.5Z',
      tone: 'soft',
      outline: true,
    },
    { d: 'M8.4 7.5c2.4-1.3 4.8-1.3 7.2 0l-1 5.7c-1.7-.3-3.5-.3-5.2 0Z', tone: 'fill' },
    { d: 'M8.4 7.5l1 5.7M15.6 7.5l-1 5.7M5.1 11.2l2.7 2.6M18.9 11.2l-2.7 2.6' },
  ],
  CandyCane: [
    {
      d: 'M6 19.5V8.5a6 6 0 0 1 12 0V10a2 2 0 0 1-4 0V8.5a2 2 0 0 0-4 0v11a2 2 0 0 1-4 0Z',
      tone: 'soft',
      outline: true,
    },
    { d: 'M6 12.5l4-2M6 17l4-2M14.4 3.4l-1.9 3.4' },
  ],
  Milk: [
    {
      d: 'M6 10.5h12V18a2.5 2.5 0 0 1-2.5 2.5H7.4A1.4 1.4 0 0 1 6 19.1Z',
      tone: 'soft',
      outline: true,
    },
    { d: 'M6 10.5 10 6.5l4 4Z', tone: 'fill', outline: true },
    { d: 'M10 6.5h4l4 4M14 10.5v10M10 6.5V4h4v2.5' },
  ],
  CupSoda: [
    {
      d: 'M6 9.5h12l-1.2 9.4a1.8 1.8 0 0 1-1.8 1.6H9a1.8 1.8 0 0 1-1.8-1.6Z',
      tone: 'soft',
      outline: true,
    },
    { d: rrect(4.5, 7, 15, 2.5, 1.25), tone: 'fill', outline: true },
    { d: 'M12 7 13 3.5h2.5' },
  ],
  Wine: [
    { d: 'M7.5 3.5h9l.6 4.6a5.1 5.1 0 0 1-10.2 0Z', tone: 'soft' },
    { d: 'M6.9 8.1h10.2a5.1 5.1 0 0 1-10.2 0Z', tone: 'fill' },
    { d: 'M7.5 3.5h9l.6 4.6a5.1 5.1 0 0 1-10.2 0ZM12 13.2v7.3M8.5 20.5h7' },
  ],
  Coffee: [
    {
      d: 'M4.5 9h11.5v6.5a4 4 0 0 1-4 4h-3.5a4 4 0 0 1-4-4Z',
      tone: 'soft',
      outline: true,
    },
    { d: 'M4.5 9H16v2.5H4.5Z', tone: 'fill' },
    { d: 'M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M8 3.5V6M12.5 3.5V6' },
  ],
  CookingPot: [
    {
      d: 'M4.5 10.5h15V16a3.5 3.5 0 0 1-3.5 3.5H8A3.5 3.5 0 0 1 4.5 16Z',
      tone: 'soft',
      outline: true,
    },
    { d: 'M3.5 10.5a8.5 4 0 0 1 17 0Z', tone: 'fill', outline: true },
    { d: 'M12 6.5V4.5M4.5 13H2.5M19.5 13h2' },
  ],
  UtensilsCrossed: [
    {
      d: 'M12 3c2 1.4 3 3.6 3 6.5 0 1.8-1 3-3 3Z',
      tone: 'fill',
      outline: true,
      transform: 'rotate(-45 12 12)',
    },
    { d: 'M12 12.5V21', transform: 'rotate(-45 12 12)' },
    { d: 'M9.5 3v4.5a2.5 2.5 0 0 0 5 0V3M12 3v18', transform: 'rotate(45 12 12)' },
  ],
  Fish: [
    {
      d: 'M20.5 12c-1.6-3.3-4.4-5.5-7.8-5.5-3 0-5.4 2-7.2 5.5 1.8 3.5 4.2 5.5 7.2 5.5 3.4 0 6.2-2.2 7.8-5.5Z',
      tone: 'soft',
      outline: true,
    },
    { d: 'M6.8 12 3.5 8.3v7.4Z', tone: 'fill', outline: true },
    { d: 'M16 10.6v.01' },
  ],
  Snowflake: [
    { d: 'M12 3v18M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5' },
    { d: 'M12 3v18M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5', transform: 'rotate(60 12 12)' },
    { d: 'M12 3v18M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5', transform: 'rotate(120 12 12)' },
  ],

  // ── Home ──────────────────────────────────────────────────────────────────
  Refrigerator: [
    { d: leaf(5, 3, 14, 18, 4, 1.5), tone: 'soft', outline: true },
    { d: 'M9 3h8.5A1.5 1.5 0 0 1 19 4.5V10H5V7a4 4 0 0 1 4-4Z', tone: 'fill' },
    { d: 'M5 10h14M8.5 5.8v1.7M8.5 13v3' },
  ],
  Sofa: [
    { d: rrect(5, 6, 14, 7.6, 2.2), tone: 'soft' },
    {
      d: 'M3.5 11.6a1.8 1.8 0 0 1 3.5.4v1.6h10V12a1.8 1.8 0 0 1 3.5-.4V17a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 17Z',
      tone: 'fill',
      outline: true,
    },
    { d: 'M5 11V8.2A2.2 2.2 0 0 1 7.2 6h9.6A2.2 2.2 0 0 1 19 8.2V11M6 18.5V20M18 18.5V20' },
  ],
  BedDouble: [
    { d: rrect(3, 11, 18, 6.5, 1.8), tone: 'soft', outline: true },
    { d: rrect(6.5, 7.5, 4.5, 3.5, 1.4) + rrect(13, 7.5, 4.5, 3.5, 1.4), tone: 'fill', outline: true },
    { d: 'M4.5 11V6.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2V11M4.5 17.5v2M19.5 17.5v2' },
  ],
  Lamp: [
    { d: rrect(7.5, 18, 9, 2.5, 1.25), tone: 'soft', outline: true },
    { d: 'M8.2 3.5h7.6a1 1 0 0 1 .9.6l2.6 6.2a.5.5 0 0 1-.5.7H5.2a.5.5 0 0 1-.5-.7l2.6-6.2a1 1 0 0 1 .9-.6Z', tone: 'fill', outline: true },
    { d: 'M12 11v7' },
  ],
  Brush: [
    { d: rrect(9.5, 10, 5, 3.5, 1), tone: 'soft', outline: true, transform: 'rotate(45 12 12)' },
    {
      d: 'M9 13.5h6V16c0 2-1.3 3.8-3 5-1.7-1.2-3-3-3-5Z',
      tone: 'fill',
      outline: true,
      transform: 'rotate(45 12 12)',
    },
    { d: 'M12 3v7', transform: 'rotate(45 12 12)' },
  ],
  SprayCan: [
    { d: leaf(3.5, 10, 10, 10.5, 3.5, 1.4), tone: 'soft', outline: true },
    { d: rrect(5.5, 6.5, 6, 3.5, 1.2), tone: 'fill', outline: true },
    { d: 'M7.5 6.5V4.5h3M16.5 4h.01M20 4h.01M18.25 6h.01M16.5 8h.01M20 8h.01' },
  ],

  // ── Fashion and beauty ────────────────────────────────────────────────────
  Shirt: [
    {
      d: 'M8.6 3.5 4 6.2l1.8 4 2-.9v11.2h8.4V9.3l2 .9 1.8-4-4.6-2.7c-.4 1.5-1.8 2.5-3.4 2.5S9 5 8.6 3.5Z',
      tone: 'soft',
    },
    { d: 'M8.6 3.5 4 6.2l1.8 4 2-.9ZM15.4 3.5 20 6.2l-1.8 4-2-.9Z', tone: 'fill' },
    {
      d: 'M8.6 3.5 4 6.2l1.8 4 2-.9v11.2h8.4V9.3l2 .9 1.8-4-4.6-2.7c-.4 1.5-1.8 2.5-3.4 2.5S9 5 8.6 3.5Z',
    },
  ],
  Footprints: [
    {
      d:
        'M6.5 3.5c1.9 0 3 1.9 3 4.6 0 2-.6 3.2-1 4.4h-4c-.4-1.2-1-2.4-1-4.4 0-2.7 1.1-4.6 3-4.6Z' +
        'M17.5 7c1.9 0 3 1.9 3 4.6 0 2-.6 3.2-1 4.4h-4c-.4-1.2-1-2.4-1-4.4 0-2.7 1.1-4.6 3-4.6Z',
      tone: 'soft',
      outline: true,
    },
    {
      d: 'M4.6 14.5h3.8v1.1a1.9 1.9 0 0 1-3.8 0ZM15.6 18h3.8v1.1a1.9 1.9 0 0 1-3.8 0Z',
      tone: 'fill',
      outline: true,
    },
  ],
  Handbag: [
    {
      d: 'M6.2 9.5h11.6a1.5 1.5 0 0 1 1.5 1.3l1.2 7.9a1.6 1.6 0 0 1-1.6 1.8H5.1a1.6 1.6 0 0 1-1.6-1.8l1.2-7.9a1.5 1.5 0 0 1 1.5-1.3Z',
      tone: 'soft',
      outline: true,
    },
    { d: 'M8.5 9.5V7.5a3.5 3.5 0 0 1 7 0v2Z', tone: 'fill' },
    { d: 'M8.5 12.5v-5a3.5 3.5 0 0 1 7 0v5' },
  ],
  Briefcase: [
    { d: leaf(3, 7.5, 18, 12.5), tone: 'soft', outline: true },
    { d: 'M7.5 7.5h11.9A1.6 1.6 0 0 1 21 9.1V13H3v-1a4.5 4.5 0 0 1 4.5-4.5Z', tone: 'fill' },
    {
      d: 'M3 13h18M12 11.5v3M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5',
    },
  ],
  Gem: [
    { d: 'M7 4h10l4 5.5-9 11-9-11Z', tone: 'soft' },
    { d: 'M7 4h10l4 5.5H3Z', tone: 'fill' },
    { d: 'M7 4h10l4 5.5-9 11-9-11ZM3 9.5h18M8.5 9.5 12 20.5l3.5-11' },
  ],
  Glasses: [
    { d: circle(6.6, 14.5, 3.6) + circle(17.4, 14.5, 3.6), tone: 'fill', outline: true },
    {
      d: 'M10.2 14c1.1-.9 2.5-.9 3.6 0M3 14.5 4.8 7.5a1.5 1.5 0 0 1 1.6-1.1M21 14.5l-1.8-7a1.5 1.5 0 0 0-1.6-1.1',
    },
  ],
  Scissors: [
    { d: circle(6.5, 6.5, 3) + circle(6.5, 17.5, 3), tone: 'fill', outline: true },
    { d: 'M8.7 8.7 20 19M8.7 15.3 20 5' },
  ],
  Spool: [
    { d: rrect(5, 3.5, 14, 2.5, 1.25) + rrect(5, 18, 14, 2.5, 1.25), tone: 'soft', outline: true },
    { d: 'M7 6h10v12H7Z', tone: 'fill' },
    { d: 'M7 6v12M17 6v12M7 10l10-2M7 14.5l10-2' },
  ],
  Palette: [
    {
      d: 'M12 3.5a8.5 8.5 0 0 0 0 17c1.3 0 2-.8 2-1.8 0-.6-.3-1-.6-1.4-.3-.4-.6-.8-.6-1.4 0-1 .8-1.9 1.9-1.9H17a3.5 3.5 0 0 0 3.5-3.5c0-3.9-3.8-7-8.5-7Z',
      tone: 'soft',
      outline: true,
    },
    {
      d: circle(7.8, 11, 1.2) + circle(10.6, 7.4, 1.2) + circle(15, 7.6, 1.2),
      tone: 'fill',
      outline: true,
    },
  ],

  // ── Health ────────────────────────────────────────────────────────────────
  Pill: [
    { d: 'M8 8.5h4v7H8a3.5 3.5 0 0 1 0-7Z', tone: 'fill', transform: 'rotate(-45 12 12)' },
    { d: 'M12 8.5h4a3.5 3.5 0 0 1 0 7h-4Z', tone: 'soft', transform: 'rotate(-45 12 12)' },
    {
      d: 'M8 8.5h8a3.5 3.5 0 0 1 0 7H8a3.5 3.5 0 0 1 0-7ZM12 8.5v7',
      transform: 'rotate(-45 12 12)',
    },
  ],
  Stethoscope: [
    { d: circle(18, 10.5, 2.3), tone: 'fill', outline: true },
    { d: 'M5 3.5v5a4.5 4.5 0 0 0 9 0v-5M4 3.5h2M13 3.5h2M9.5 13v2a4.25 4.25 0 0 0 8.5 0v-2.2' },
  ],
  HeartPulse: [
    {
      d: 'M12 20s-8.5-4.8-8.5-10.6A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8.5 2.8C20.5 15.2 12 20 12 20Z',
      tone: 'soft',
      outline: true,
    },
    { d: 'M3.8 12.5H8l1.5-2.5 2.5 5 1.5-2.5h6.7' },
  ],
  FlaskConical: [
    {
      d: 'M10 3.5v6L4.6 18a1.6 1.6 0 0 0 1.4 2.5h12a1.6 1.6 0 0 0 1.4-2.5L14 9.5v-6Z',
      tone: 'soft',
    },
    { d: 'M7.1 14h9.8l2.5 4a1.6 1.6 0 0 1-1.4 2.5H6a1.6 1.6 0 0 1-1.4-2.5Z', tone: 'fill' },
    {
      d: 'M10 3.5v6L4.6 18a1.6 1.6 0 0 0 1.4 2.5h12a1.6 1.6 0 0 0 1.4-2.5L14 9.5v-6M8.5 3.5h7M7.1 14h9.8',
    },
  ],
  Baby: [
    { d: circle(12, 12.5, 8.5), tone: 'soft', outline: true },
    { d: circle(9, 12, 1) + circle(15, 12, 1), tone: 'fill', outline: true },
    { d: 'M10 15.8c1.2.8 2.8.8 4 0M12 4c0 1.5 1 2.4 2.2 2.4a1.3 1.3 0 0 0 0-2.6' },
  ],
  Droplets: [
    {
      d: 'M14.5 5.5c2.2 2.8 5.5 5.6 5.5 9.2a5.5 5.5 0 0 1-11 0c0-3.6 3.3-6.4 5.5-9.2Z',
      tone: 'soft',
      outline: true,
    },
    { d: 'M7 3.5c1.2 1.6 3 3.2 3 5.3a3 3 0 0 1-6 0C4 6.7 5.8 5.1 7 3.5Z', tone: 'fill', outline: true },
  ],

  // ── Leisure ───────────────────────────────────────────────────────────────
  BookOpen: [
    { d: 'M12 6.5c1.6-1.2 3.8-1.7 8-1.5v13c-4.2-.2-6.4.3-8 1.5Z', tone: 'soft' },
    { d: 'M12 6.5C10.4 5.3 8.2 4.8 4 5v13c4.2-.2 6.4.3 8 1.5Z', tone: 'fill' },
    {
      d: 'M12 6.5C10.4 5.3 8.2 4.8 4 5v13c4.2-.2 6.4.3 8 1.5 1.6-1.2 3.8-1.7 8-1.5V5c-4.2-.2-6.4.3-8 1.5ZM12 6.5v13',
    },
  ],
  GraduationCap: [
    {
      d: 'M6.5 11.7V16c0 1.7 2.5 3 5.5 3s5.5-1.3 5.5-3v-4.3L12 14Z',
      tone: 'soft',
      outline: true,
    },
    { d: 'M12 5 21.5 9.5 12 14 2.5 9.5Z', tone: 'fill', outline: true },
    { d: 'M21.5 9.5v5' },
  ],
  Guitar: [
    { d: guitarBody, tone: 'soft', outline: true, transform: 'rotate(45 12 12)' },
    { d: circle(12, 15, 1.6), tone: 'fill', outline: true, transform: 'rotate(45 12 12)' },
    { d: 'M12 8.2V3M10.5 3h3', transform: 'rotate(45 12 12)' },
  ],
  Dumbbell: [
    { d: rrect(6, 6, 3.5, 12, 1.4) + rrect(14.5, 6, 3.5, 12, 1.4), tone: 'fill', outline: true },
    {
      d: 'M6 9H4.5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1H6M18 9h1.5a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H18M9.5 12h5',
    },
  ],
  Bike: [
    { d: circle(6, 16, 3.5) + circle(18, 16, 3.5), tone: 'soft', outline: true },
    { d: 'M6 16 9.5 9.5 12 16l3.5-6.5H9.5M6 16h6M15.5 9.5 18 16M9.5 9.5 9 7.5M7.8 7.5h2.6M15.5 9.5l-.8-2.5h2.3' },
  ],
  Tent: [
    { d: 'M3.5 20 12 4.5 20.5 20Z', tone: 'soft' },
    { d: 'M12 12.5 15.5 20h-7Z', tone: 'fill', outline: true },
    { d: 'M3.5 20 12 4.5 20.5 20M2.5 20h19' },
  ],
  Blocks: [
    {
      d: 'M5 8h5.5v6.5H17a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5v-10A1.5 1.5 0 0 1 5 8Z',
      tone: 'soft',
      outline: true,
    },
    { d: leaf(13, 3.5, 7.5, 7.5, 3, 1.2), tone: 'fill', outline: true },
    { d: 'M3.5 14.5h7v6' },
  ],
  Shapes: [
    { d: leaf(3.5, 13, 7.5, 7.5, 3, 1.2), tone: 'soft', outline: true },
    { d: 'M12 3.5 16.3 10.5H7.7Z', tone: 'fill', outline: true },
    { d: circle(16.8, 16.8, 3.7) },
  ],
  PawPrint: [
    {
      d: 'M12 12c2.6 0 5 2.8 5 5.2 0 1.8-1.4 2.8-3 2.8-.8 0-1.3-.4-2-.4s-1.2.4-2 .4c-1.6 0-3-1-3-2.8C7 14.8 9.4 12 12 12Z',
      tone: 'soft',
      outline: true,
    },
    {
      d: circle(5.3, 10.5, 1.8) + circle(9.2, 6, 1.8) + circle(14.8, 6, 1.8) + circle(18.7, 10.5, 1.8),
      tone: 'fill',
      outline: true,
    },
  ],

  // ── Building, tools, motoring, farm ───────────────────────────────────────
  BrickWall: [
    { d: rrect(3.5, 4.5, 17, 15, 2), tone: 'soft', outline: true },
    { d: 'M8 9.5h8v5H8Z', tone: 'fill' },
    { d: 'M3.5 9.5h17M3.5 14.5h17M12 4.5v5M8 9.5v5M16 9.5v5M12 14.5v5' },
  ],
  PaintBucket: [
    { d: leaf(3, 8.5, 12, 12, 3.5, 1.4), tone: 'soft', outline: true },
    { d: 'M19.5 11c1 1.4 2 2.5 2 3.7a2 2 0 0 1-4 0c0-1.2 1-2.3 2-3.7Z', tone: 'fill', outline: true },
    { d: 'M4.5 8.5a4.5 4.5 0 0 1 9 0M3 12.5h12' },
  ],
  Wrench: [
    { d: `${wrenchHead}Z`, tone: 'fill', transform: 'rotate(45 12 12)' },
    { d: `${wrenchHead}V19a1.7 1.7 0 0 1-3.4 0Z`, transform: 'rotate(45 12 12)' },
  ],
  Fuel: [
    { d: leaf(4, 3.5, 10, 17, 3.5, 1.4), tone: 'soft', outline: true },
    { d: rrect(6.5, 6.5, 5, 4, 1), tone: 'fill', outline: true },
    { d: 'M3 20.5h12M14 12h1.5a1.5 1.5 0 0 1 1.5 1.5V16a1.5 1.5 0 0 0 3 0V8.5L17.5 6' },
  ],
  Car: [
    {
      d: 'M2.5 15.5v-2.8a1.5 1.5 0 0 1 1.1-1.4l2.4-.8 2.3-3.2a2 2 0 0 1 1.6-.8h5.3a2 2 0 0 1 1.5.7l2.8 3.3 2.2.6a1.5 1.5 0 0 1 1.1 1.4v3a1 1 0 0 1-1 1h-1.2a2.3 2.3 0 0 0-4.6 0H9.5a2.3 2.3 0 0 0-4.6 0H3.5a1 1 0 0 1-1-1Z',
      tone: 'soft',
      outline: true,
    },
    { d: 'M8.6 10.5l1.6-2.3h4.6l2 2.3Z', tone: 'fill', outline: true },
    { d: circle(7.2, 16.5, 1.7) + circle(17, 16.5, 1.7) },
  ],
  CarFront: [
    {
      d: 'M3.5 17v-4a2 2 0 0 1 .5-1.3L5.4 7a2 2 0 0 1 1.9-1.5h9.4A2 2 0 0 1 18.6 7l1.4 4.7a2 2 0 0 1 .5 1.3v4a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1Z',
      tone: 'soft',
      outline: true,
    },
    { d: 'M6.3 11 7.4 8h9.2l1.1 3Z', tone: 'fill', outline: true },
    { d: 'M5.5 18v1.5M18.5 18v1.5M6.5 14.5H8M16 14.5h1.5' },
  ],
  Tractor: [
    { d: 'M4.5 11V5.5a1 1 0 0 1 1-1h5l1.5 6.5Z', tone: 'soft', outline: true },
    { d: circle(7.5, 16, 4), tone: 'fill', outline: true },
    { d: 'M12 11h6a1.5 1.5 0 0 1 1.5 1.5v2M11.5 17h3M16 11V8' + circle(17.5, 17.5, 2.5) },
  ],
  Sprout: [
    { d: 'M12 11.6C12 7.5 9 5 5 5c0 4 3 6.6 7 6.6Z', tone: 'fill', outline: true },
    { d: 'M12 14.2c0-3.6 2.6-5.8 6.5-5.8 0 3.6-2.7 5.8-6.5 5.8Z', tone: 'soft', outline: true },
    { d: 'M12 19.5v-8M7.5 19.5h9' },
  ],
} satisfies StorvvIconSet

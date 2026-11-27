import { circle, leaf, rrect, type StorvvIconPart, type StorvvIconSet } from '../geometry'

/** Status, security, settings, people and communication. */

const n = (v: number) => +v.toFixed(2)
const rad = (deg: number) => (deg * Math.PI) / 180
/** Point at `deg` degrees clockwise from straight up. */
const pt = (cx: number, cy: number, r: number, deg: number) =>
  [n(cx + r * Math.sin(rad(deg))), n(cy - r * Math.cos(rad(deg)))] as const

/** Open arc from angle a0 to a1 (degrees clockwise from up). */
function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const [x0, y0] = pt(cx, cy, r, a0)
  const [x1, y1] = pt(cx, cy, r, a1)
  return `M${x0} ${y0}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`
}

/** Annular sector, closed. */
function sector(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const [ax, ay] = pt(cx, cy, r1, a0)
  const [bx, by] = pt(cx, cy, r1, a1)
  const [c, d] = pt(cx, cy, r0, a1)
  const [e, f] = pt(cx, cy, r0, a0)
  return `M${ax} ${ay}A${r1} ${r1} 0 0 1 ${bx} ${by}L${c} ${d}A${r0} ${r0} 0 0 0 ${e} ${f}Z`
}

/** A gear: `teeth` flat-topped teeth between radius rI (root) and rO (tip). */
function gear(cx: number, cy: number, teeth: number, rO: number, rI: number) {
  const pitch = 360 / teeth
  const tip = pitch * 0.34
  const base = pitch * 0.52
  let d = ''
  for (let i = 0; i < teeth; i++) {
    const a = i * pitch
    const p1 = pt(cx, cy, rI, a - base / 2)
    const p2 = pt(cx, cy, rO, a - tip / 2)
    const p3 = pt(cx, cy, rO, a + tip / 2)
    const p4 = pt(cx, cy, rI, a + base / 2)
    const p5 = pt(cx, cy, rI, a + pitch - base / 2)
    d += `${i ? 'L' : 'M'}${p1[0]} ${p1[1]}L${p2[0]} ${p2[1]}A${rO} ${rO} 0 0 1 ${p3[0]} ${p3[1]}L${p4[0]} ${p4[1]}A${rI} ${rI} 0 0 1 ${p5[0]} ${p5[1]}`
  }
  return d + 'Z'
}

/** Scalloped badge: `lobes` outward bulges around radius r. */
function badge(cx: number, cy: number, lobes: number, r: number, bulge: number) {
  const step = 360 / lobes
  let d = ''
  for (let i = 0; i <= lobes; i++) {
    const [x, y] = pt(cx, cy, r, i * step + step / 2)
    d += i ? `A${bulge} ${bulge} 0 0 1 ${x} ${y}` : `M${x} ${y}`
  }
  return d + 'Z'
}

// ── Circle family ─────────────────────────────────────────────────────────
const ring: StorvvIconPart = { d: circle(12, 12, 9), tone: 'soft', outline: true }
const CircleAlert = [ring, { d: 'M12 7.8v4.8M12 16.2h.01' }]
const CircleCheck = [ring, { d: 'M8 12.4l2.5 2.5 5.6-5.7' }]

// ── Shield ────────────────────────────────────────────────────────────────
// Generous curve on the left shoulder, tight on the right: the leaf idea on a shield.
const shieldBody: StorvvIconPart = {
  d: 'M11.4 3.2a1.6 1.6 0 0 1 1.2 0l5.9 2.3a1.5 1.5 0 0 1 1 1.4v4.8c0 4.4-3 7.8-7 9.3-4-1.5-7-4.9-7-9.3V8.6a3.5 3.5 0 0 1 2.2-3.3Z',
  tone: 'soft',
  outline: true,
}

// ── Eye ───────────────────────────────────────────────────────────────────
const eyeShape = 'M2.5 12C4.5 7.8 8 5.5 12 5.5s7.5 2.3 9.5 6.5c-2 4.2-5.5 6.5-9.5 6.5S4.5 16.2 2.5 12Z'

// ── Bell ──────────────────────────────────────────────────────────────────
const bellBody: StorvvIconPart = {
  d: 'M4.8 16.8h14.4l-1.3-1.9a3 3 0 0 1-.5-1.7V9.6a5.4 5.4 0 0 0-10.8 0v3.6a3 3 0 0 1-.5 1.7Z',
  tone: 'soft',
  outline: true,
}
const bellClapper: StorvvIconPart = { d: 'M10.2 19.8a2 2 0 0 0 3.6 0' }

// ── Gear ──────────────────────────────────────────────────────────────────
const Settings = [
  { d: gear(12, 12, 8, 9, 6.9), tone: 'soft', outline: true },
  { d: circle(12, 12, 3) },
] satisfies StorvvIconPart[]

// ── Sun ───────────────────────────────────────────────────────────────────
const rays = (r0: number, r1: number, angles: number[]) =>
  angles
    .map((a) => {
      const [x0, y0] = pt(12, 12, r0, a)
      const [x1, y1] = pt(12, 12, r1, a)
      return `M${x0} ${y0}L${x1} ${y1}`
    })
    .join('')
const eight = [0, 45, 90, 135, 180, 225, 270, 315]

// ── People ────────────────────────────────────────────────────────────────
const head = { d: circle(12, 7.8, 3.6), tone: 'fill', outline: true } satisfies StorvvIconPart
const shoulders = {
  d: 'M4.8 20.2c.8-3.7 3.7-5.7 7.2-5.7s6.4 2 7.2 5.7Z',
  tone: 'soft',
  outline: true,
} satisfies StorvvIconPart
const User = [shoulders, head]

// Badge variants: same head and shoulders, moved left, with a notch around the badge at 17.5, 17.5.
const bHead = { d: circle(9.5, 7.8, 3.6), tone: 'fill', outline: true } satisfies StorvvIconPart
const bShoulders = {
  d: 'M2.3 20.2c.8-3.7 3.7-5.7 7.2-5.7 1.3 0 2.5.3 3.5.8A5 5 0 0 0 12.9 20.2Z',
  tone: 'soft',
  outline: true,
} satisfies StorvvIconPart
const withBadge = (glyph: StorvvIconPart) => [bShoulders, bHead, glyph]
const checkBadge = { d: 'M15 17.7l1.7 1.7 3.4-3.6' }

const Users = [
  { d: 'M2.5 20c.7-3.3 3.2-5.2 6.5-5.2s5.8 1.9 6.5 5.2Z', tone: 'soft', outline: true },
  { d: circle(9, 8.2, 3.3), tone: 'fill', outline: true },
  { d: 'M15.6 5.2a3.3 3.3 0 0 1 0 6M18 15.2c1.9.7 3.1 2.3 3.5 4.8' },
] satisfies StorvvIconPart[]

const CircleUser = [
  ring,
  { d: circle(12, 9.8, 3), tone: 'fill', outline: true },
  { d: 'M6.34 19c1.3-2.3 3.2-3.5 5.66-3.5s4.36 1.2 5.66 3.5' },
] satisfies StorvvIconPart[]

export default {
  // Status
  AlertCircle: CircleAlert,
  CircleAlert,
  CircleCheck,
  CheckCircle2: CircleCheck,
  CirclePlus: [ring, { d: 'M12 8.4v7.2M8.4 12h7.2' }],
  CircleX: [ring, { d: 'M9 9l6 6M15 9l-6 6' }],
  Info: [ring, { d: 'M12 11.2v5M12 7.8h.01' }],
  TriangleAlert: [
    {
      d: 'M10.27 4.5a2 2 0 0 1 3.46 0l7.5 13a2 2 0 0 1-1.73 3H4.5a2 2 0 0 1-1.73-3Z',
      tone: 'soft',
      outline: true,
    },
    { d: 'M12 9.4v4.4M12 17h.01' },
  ],
  BadgeCheck: [
    { d: badge(12, 12, 8, 8.2, 3.4), tone: 'soft', outline: true },
    { d: 'M8.3 12.3l2.5 2.5 5-5.2' },
  ],

  // Security
  Shield: [shieldBody],
  ShieldCheck: [shieldBody, { d: 'M8.8 12.2l2.3 2.3 4.2-4.4' }],
  Lock: [
    { d: leaf(4.5, 10.5, 15, 10.5, 3.5, 1.4), tone: 'soft', outline: true },
    { d: 'M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.6v2.4' },
  ],
  Key: [
    { d: circle(8, 16, 4), tone: 'fill', outline: true },
    { d: 'M10.83 13.17 20.3 3.7M17.5 6.5l2.6 2.6M14.7 9.3l2.1 2.1' },
  ],
  KeyRound: [
    { d: circle(15, 9, 5.8), tone: 'soft', outline: true },
    { d: circle(16.4, 7.6, 1.1), tone: 'fill', outline: true },
    { d: 'M10.9 13.1 3.5 20.5M5.6 18.4l2 2M8 16l1.6 1.6' },
  ],
  Fingerprint: [
    { d: arc(12, 12.5, 8, -110, 55) },
    { d: 'M19.9 12.8c0 2.1-.3 4-.9 5.8' },
    { d: 'M7.6 19.6C7.2 17.6 7 15.6 7 13.5a5 5 0 0 1 10 0c0 2.4-.3 4.6-.8 6.6' },
    { d: 'M12 13.5c0 2.9-.4 5.3-1.1 7.5' },
  ],
  // Same folder as icons/sets/workspace.ts, opened at the corner for the lock.
  FolderLock: [
    {
      d: 'M3 18.4V8.5A4.5 4.5 0 0 1 7.5 4H10q.9 0 1.4.75l.9 1.5Q12.8 7 13.7 7h5.7a1.6 1.6 0 0 1 1.6 1.6v2.9h-6.5a2 2 0 0 0-2 2V20H4.6A1.6 1.6 0 0 1 3 18.4Z',
      tone: 'soft',
    },
    { d: 'M11 20H4.6A1.6 1.6 0 0 1 3 18.4V8.5A4.5 4.5 0 0 1 7.5 4H10q.9 0 1.4.75l.9 1.5Q12.8 7 13.7 7h5.7a1.6 1.6 0 0 1 1.6 1.6V11' },
    { d: rrect(13.8, 15.8, 7.4, 5.4, 1.3), tone: 'fill', outline: true },
    { d: 'M15.5 15.8v-1.4a2 2 0 0 1 4 0v1.4' },
  ],
  Eye: [
    { d: eyeShape, tone: 'soft', outline: true },
    { d: circle(12, 12, 3), tone: 'fill', outline: true },
  ],
  EyeOff: [
    { d: eyeShape, tone: 'soft' },
    // Outline broken where the slash crosses.
    { d: 'M2.5 12C3.4 10.1 4.6 8.6 6 7.5M9.4 5.9c.8-.3 1.7-.4 2.6-.4 4 0 7.5 2.3 9.5 6.5-.6 1.3-1.4 2.4-2.3 3.4M16.6 17.4c-1.4.7-3 1.1-4.6 1.1-4 0-7.5-2.3-9.5-6.5' },
    { d: 'M9.9 9.9a3 3 0 0 0 4.2 4.2' },
    { d: 'M3.5 3.5l17 17' },
  ],

  // Notifications
  Bell: [bellBody, bellClapper],
  BellRing: [bellBody, bellClapper, { d: 'M2.8 8.5c0-1.9.7-3.7 1.8-5M21.2 8.5c0-1.9-.7-3.7-1.8-5' }],

  // Settings
  Settings,
  Cog: Settings,
  Settings2: [
    { d: `${circle(8.5, 7, 2.5)}${circle(15.5, 17, 2.5)}`, tone: 'fill', outline: true },
    { d: 'M3 7h3M11 7h10M3 17h10M18 17h3' },
  ],

  // Theme
  Sun: [
    { d: circle(12, 12, 4), tone: 'fill', outline: true },
    { d: rays(6.8, 9, eight) },
  ],
  SunMedium: [
    { d: circle(12, 12, 4), tone: 'fill', outline: true },
    { d: rays(7, 8.6, eight) },
  ],
  Moon: [
    {
      d: 'M20 14.4A8.3 8.3 0 1 1 9.6 4a6.6 6.6 0 0 0 10.4 10.4Z',
      tone: 'soft',
      outline: true,
    },
  ],
  SunMoon: [
    {
      d: 'M17.2 13.4A5.2 5.2 0 1 1 10.6 6.8a4 4 0 0 0 6.6 6.6Z',
      tone: 'fill',
      outline: true,
    },
    { d: rays(7.4, 9, [0, 225, 270, 315, 180]) },
  ],

  // Connectivity & help
  WifiOff: [
    {
      d: [
        arc(12, 19.5, 13.5, -46, -30),
        arc(12, 19.5, 13.5, -14, 46),
        arc(12, 19.5, 9, -46, -20),
        arc(12, 19.5, 9, 6, 46),
        arc(12, 19.5, 4.5, -46, 46),
      ].join(''),
    },
    { d: 'M12 19.5h.01' },
    { d: 'M3.5 3.5l17 17' },
  ],
  Globe: [
    { d: circle(12, 12, 9), tone: 'soft', outline: true },
    { d: 'M12 3c-2.4 2.5-3.7 5.5-3.7 9s1.3 6.5 3.7 9c2.4-2.5 3.7-5.5 3.7-9S14.4 5.5 12 3ZM3 12h18' },
  ],
  Languages: [
    { d: 'M3 5.5h9M7.5 3.5v2M5 5.5c.8 3 2.7 5.3 5.6 6.8M10 5.5c-.8 3.6-3 6.3-6.5 8' },
    { d: 'M12.5 20.5l4-9.5 4 9.5M14 17.2h5' },
  ],
  LifeBuoy: [
    {
      d: [45, 135, 225, 315].map((a) => sector(12, 12, 4, 9, a - 13, a + 13)).join(''),
      tone: 'fill',
      outline: true,
    },
    { d: `${circle(12, 12, 9)}${circle(12, 12, 4)}` },
  ],
  Headset: [
    { d: `${rrect(3.5, 12.5, 4, 6.5, 1.6)}${rrect(16.5, 12.5, 4, 6.5, 1.6)}`, tone: 'fill', outline: true },
    { d: 'M3.5 14.5V12a8.5 8.5 0 0 1 17 0v2.5M18.5 19v.5a2 2 0 0 1-2 2h-3' },
  ],

  // Communication
  MessageCircle: [
    { d: 'M7.9 19.9A8.8 8.8 0 1 0 4.1 16.1L3 21Z', tone: 'soft', outline: true },
  ],
  MessagesSquare: [
    {
      d: 'M12.5 9H20a1.5 1.5 0 0 1 1.5 1.5V21l-3.2-3.2h-7.8A1.5 1.5 0 0 1 9 16.3v-3.8A3.5 3.5 0 0 1 12.5 9Z',
      tone: 'soft',
      outline: true,
    },
    { d: 'M15.5 6.5V5A1.5 1.5 0 0 0 14 3.5H6A3.5 3.5 0 0 0 2.5 7v10.5l3.2-3.2h.8' },
  ],
  Mail: [
    { d: leaf(2.5, 5, 19, 14), tone: 'soft', outline: true },
    { d: 'M5.5 8.5l5.3 4a2 2 0 0 0 2.4 0l5.3-4' },
  ],
  Phone: [
    {
      d: 'M5 3.5h3a1.5 1.5 0 0 1 1.5 1.3l.5 3.2a1.5 1.5 0 0 1-.6 1.4L7.6 10.6a12 12 0 0 0 5.8 5.8l1.2-1.8a1.5 1.5 0 0 1 1.4-.6l3.2.5a1.5 1.5 0 0 1 1.3 1.5v3a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.1 1.5 1.5 0 0 1 5 3.5Z',
      tone: 'soft',
      outline: true,
    },
  ],
  Megaphone: [
    {
      d: 'M7.5 9 17 4.5a.8.8 0 0 1 1.1.7v13.6a.8.8 0 0 1-1.1.7L7.5 15H5a1.5 1.5 0 0 1-1.5-1.5v-3A1.5 1.5 0 0 1 5 9Z',
      tone: 'soft',
      outline: true,
    },
    { d: 'M7.5 9v6M7 15l1 4.3a1.4 1.4 0 0 0 2.7-.6l-.6-2.5M21 10v4' },
  ],

  // People
  User,
  UserRound: User,
  UserPlus: withBadge({ d: 'M17.5 15v5M15 17.5h5' }),
  UserMinus: withBadge({ d: 'M15 17.5h5' }),
  UserRoundCheck: withBadge(checkBadge),
  UserCog: [
    bShoulders,
    bHead,
    { d: gear(17.5, 17.5, 6, 3.6, 2.6) },
  ],
  Users,
  UsersRound: Users,
  CircleUser,
  CircleUserRound: CircleUser,
  Crown: [
    { d: 'M3.5 7.5l4.2 4.6L12 5l4.3 7.1 4.2-4.6-1.6 9.5H5.1Z', tone: 'soft', outline: true },
    { d: 'M5.5 20.5h13' },
  ],
} satisfies StorvvIconSet

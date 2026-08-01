# Storvv Marketing — Premium Landing Design System

**North star:** *"Apple launched an operating system for modern retailers."*

**Scope:** Marketing site visual/UX only — no product or route changes.

**Companion:** [STORVV_PRODUCT_STATE.md](./STORVV_PRODUCT_STATE.md), [WEB_PREMIUM_DESIGN_SYSTEM.md](./WEB_PREMIUM_DESIGN_SYSTEM.md)

---

## Brand positioning

**Message:** Everything your business needs to manage inventory, sales, and growth in one intelligent platform.

**Feel:** Trust · Premium · Innovation · Simplicity · Growth · Security

**Avoid:** Template SaaS, startup gradients, stock photos, generic dashboard screenshots.

**References:** Apple product pages, Stripe, Linear, Vercel, Shopify.

---

## Visual system

| Token | Value | Use |
|-------|-------|-----|
| Canvas | `#050508` | Page background |
| Glass bg | `rgb(255 255 255 / 0.06)` | Cards, nav pill |
| Glass border | `rgb(255 255 255 / 0.12)` | Hairlines |
| Accent | `#9ab5e3` / `#143f8d` | Headlines, CTAs |
| Ink | `#f8fafc` | Primary text |
| Muted | `#94a3b8` | Body |

**Typography:** Large display headlines (`clamp(2.5rem, 6vw, 4.5rem)`), generous line-height, tabular nums on metrics.

**Motion:** Scroll reveals, subtle float on hero cards, nav frost on scroll. Respect `prefers-reduced-motion`.

---

## Page structure

1. **Nav** — Product · Solutions · Features · Pricing · Resources · Sign in · Get Started
2. **Hero** — Headline + product showcase
3. **Social proof** — Trusted by modern retailers (stats, categories)
4. **Product stories** — Inventory · Sales · Multi-store · Analytics · Team
5. **AI assistant** — Intelligent retail assistant
6. **Demo + screenshots** — Existing components, refreshed copy
7. **Security** — Trust section
8. **Pricing** — Micro / Medium / Enterprise
9. **FAQ + Contact**
10. **Final CTA**
11. **Footer** — Product · Solutions · Resources · Company · Legal

---

## Components

| Component | Path |
|-----------|------|
| `LandingProductStories` | Feature storytelling |
| `LandingAiShowcase` | AI section |
| `LandingFinalCta` | Closing conversion |
| `LandingShowcase` | Hero + problems + core |
| `LandingProof` | Social proof |

CSS: `assets/css/landing-premium.css`

---

## Implementation phases

- **Phase 1** ✅ Hero, nav scroll glass, product stories, AI, final CTA, proof refresh
- **Phase 2** Pricing cards glass treatment, footer columns
- **Phase 3** Lottie/micro-animations, localized Nigeria copy variants

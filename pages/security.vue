<template>
  <div class="sec-page">
    <!-- Hero -->
    <section
      data-section-id="security-hero"
      class="sec-hero"
      aria-labelledby="security-hero-title"
    >
      <div class="sec-hero__grid-bg" aria-hidden="true" />
      <div class="sec-hero__orb sec-hero__orb--a" aria-hidden="true" />
      <div class="sec-hero__orb sec-hero__orb--b" aria-hidden="true" />

      <div class="sec-hero__inner">
        <div class="sec-hero__copy">
          <p class="sec-eyebrow sec-eyebrow--dark">
            <ShieldCheck class="h-3.5 w-3.5" aria-hidden="true" />
            Security &amp; trust
          </p>
          <h1 id="security-hero-title" class="sec-hero__title">
            Every account, every sale, every branch.
            <span class="sec-hero__accent">Accounted for.</span>
          </h1>
          <p class="sec-hero__lede">
            Storvv is built for retail teams who cannot afford downtime or a data leak. Here's
            exactly how sign-in, permissions, and your store's data are handled. No jargon, no
            marketing fog.
          </p>
          <div class="sec-hero__actions">
            <a href="#layers" class="sec-btn sec-btn--light">
              See how it works
              <ArrowDown class="h-4 w-4" aria-hidden="true" />
            </a>
            <a href="mailto:hello@storvv.com" class="sec-btn sec-btn--ghost">Ask a security question</a>
          </div>
          <ul class="sec-hero__chips" aria-label="Highlights">
            <li v-for="chip in heroChips" :key="chip">
              <Check class="sec-hero__chip-check" aria-hidden="true" />
              {{ chip }}
            </li>
          </ul>
        </div>

        <div class="sec-shield" aria-hidden="true">
          <span class="sec-shield__ring sec-shield__ring--1" />
          <span class="sec-shield__ring sec-shield__ring--2" />
          <span class="sec-shield__ring sec-shield__ring--3" />
          <div class="sec-shield__orbit">
            <span
              v-for="(node, i) in orbitNodes"
              :key="i"
              class="sec-shield__node"
              :style="{ '--angle': `${(360 / orbitNodes.length) * i}deg` }"
            >
              <span class="sec-shield__node-inner">
                <component :is="node" class="h-5 w-5" />
              </span>
            </span>
          </div>
          <span class="sec-shield__core">
            <ShieldCheck class="h-12 w-12" />
          </span>
        </div>
      </div>
    </section>

    <!-- Three layers -->
    <section
      id="layers"
      data-section-id="security-layers"
      class="sec-layers scroll-animate scroll-animate-up scroll-mt-24"
      aria-labelledby="security-layers-title"
    >
      <div class="sec-wrap">
        <header class="sec-head">
          <p class="sec-eyebrow">
            <Layers class="h-3.5 w-3.5" aria-hidden="true" />
            Three layers of protection
          </p>
          <h2 id="security-layers-title" class="sec-title">
            Safe at the door. Scoped inside. <span class="sec-accent">Yours throughout.</span>
          </h2>
        </header>

        <div class="sec-layers__tabs" role="tablist" aria-label="Protection layers">
          <button
            v-for="(layer, i) in layers"
            :id="`sec-tab-${layer.id}`"
            :key="layer.id"
            type="button"
            role="tab"
            class="sec-layers__tab"
            :class="{ 'sec-layers__tab--active': activeLayer === i }"
            :aria-selected="activeLayer === i"
            :aria-controls="`sec-panel-${layer.id}`"
            @click="activeLayer = i"
          >
            <span class="sec-layers__tab-num">0{{ i + 1 }}</span>
            <component :is="layer.icon" class="h-5 w-5" aria-hidden="true" />
            <span class="sec-layers__tab-label">{{ layer.label }}</span>
          </button>
        </div>

        <Transition name="sec-fade" mode="out-in">
          <div
            :id="`sec-panel-${layers[activeLayer].id}`"
            :key="layers[activeLayer].id"
            class="sec-layers__panel"
            role="tabpanel"
            :aria-labelledby="`sec-tab-${layers[activeLayer].id}`"
          >
            <div class="sec-layers__panel-copy">
              <h3 class="sec-layers__panel-title">{{ layers[activeLayer].title }}</h3>
              <p class="sec-layers__panel-lede">{{ layers[activeLayer].lede }}</p>
            </div>
            <ul class="sec-layers__points">
              <li
                v-for="(point, pi) in layers[activeLayer].points"
                :key="point.title"
                class="sec-layers__point"
                :style="{ '--i': pi }"
              >
                <span class="sec-layers__point-icon">
                  <component :is="point.icon" class="h-4 w-4" aria-hidden="true" />
                </span>
                <span>
                  <span class="sec-layers__point-title">{{ point.title }}</span>
                  <span class="sec-layers__point-body">{{ point.body }}</span>
                </span>
              </li>
            </ul>
          </div>
        </Transition>
      </div>
    </section>

    <!-- Role explorer -->
    <section
      data-section-id="security-roles"
      class="sec-roles scroll-animate scroll-animate-up"
      aria-labelledby="security-roles-title"
    >
      <div class="sec-wrap sec-roles__layout">
        <header class="sec-head sec-head--left">
          <p class="sec-eyebrow">
            <Users class="h-3.5 w-3.5" aria-hidden="true" />
            Who can do what
          </p>
          <h2 id="security-roles-title" class="sec-title">
            No shared logins. <span class="sec-accent">Just the right access.</span>
          </h2>
          <p class="sec-lede">
            Every team member signs in with their own email and password. Pick a role to see what
            they can do by default. Owners can switch individual abilities on for each person, and
            departments limit which folders a login can open.
          </p>

          <div class="sec-roles__picker" role="radiogroup" aria-label="Choose a role">
            <button
              v-for="role in roles"
              :key="role.id"
              type="button"
              role="radio"
              class="sec-roles__role"
              :class="{ 'sec-roles__role--active': activeRole === role.id }"
              :aria-checked="activeRole === role.id"
              @click="activeRole = role.id"
            >
              <component :is="role.icon" class="h-4 w-4" aria-hidden="true" />
              {{ role.label }}
            </button>
          </div>

          <ul class="sec-roles__legend" aria-label="Legend">
            <li><span class="sec-state sec-state--yes"><Check class="h-3 w-3" /></span>Included</li>
            <li><span class="sec-state sec-state--grant"><ToggleRight class="h-3 w-3" /></span>Owner can switch on</li>
          </ul>
        </header>

        <div class="sec-roles__card">
          <div class="sec-roles__card-head">
            <span class="sec-roles__avatar">
              <component :is="currentRole.icon" class="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p class="sec-roles__card-name">{{ currentRole.label }}</p>
              <p class="sec-roles__card-sub">{{ currentRole.summary }}</p>
            </div>
          </div>
          <ul class="sec-roles__list">
            <li v-for="cap in capabilities" :key="cap.label" class="sec-roles__row">
              <span class="sec-roles__row-label">{{ cap.label }}</span>
              <Transition name="sec-pop" mode="out-in">
                <span
                  :key="`${activeRole}-${cap.access[activeRole]}`"
                  class="sec-state"
                  :class="`sec-state--${cap.access[activeRole]}`"
                  :aria-label="cap.access[activeRole] === 'yes' ? 'Included' : 'Owner can switch on'"
                >
                  <Check v-if="cap.access[activeRole] === 'yes'" class="h-3.5 w-3.5" />
                  <ToggleRight v-else class="h-3.5 w-3.5" />
                </span>
              </Transition>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Questions -->
    <section
      data-section-id="security-detail"
      class="sec-faq scroll-animate scroll-animate-up"
      aria-labelledby="security-detail-title"
    >
      <div class="sec-wrap sec-faq__wrap">
        <header class="sec-head">
          <p class="sec-eyebrow">
            <ScrollText class="h-3.5 w-3.5" aria-hidden="true" />
            Due diligence
          </p>
          <h2 id="security-detail-title" class="sec-title">
            Common questions from <span class="sec-accent">due-diligence checklists</span>
          </h2>
        </header>

        <ul class="sec-faq__list">
          <li
            v-for="(item, i) in detailItems"
            :key="item.title"
            class="sec-faq__item"
            :class="{ 'sec-faq__item--open': openFaq === i }"
          >
            <button
              type="button"
              class="sec-faq__q"
              :aria-expanded="openFaq === i"
              :aria-controls="`sec-faq-${i}`"
              @click="openFaq = openFaq === i ? null : i"
            >
              <span class="sec-faq__icon">
                <component :is="item.icon" class="h-4 w-4" aria-hidden="true" />
              </span>
              <span class="sec-faq__q-text">{{ item.title }}</span>
              <ChevronDown class="sec-faq__chevron" aria-hidden="true" />
            </button>
            <div :id="`sec-faq-${i}`" class="sec-faq__a" role="region">
              <div class="sec-faq__a-inner">
                <p>{{ item.body }}</p>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <!-- Contact -->
    <section data-section-id="security-contact" class="sec-contact scroll-animate scroll-animate-up">
      <div class="sec-contact__panel">
        <span class="sec-contact__icon" aria-hidden="true">
          <Mail class="h-6 w-6" />
        </span>
        <div class="sec-contact__copy">
          <h2 class="sec-contact__title">Need a written answer for procurement or your accountant?</h2>
          <p class="sec-contact__lede">
            Email us directly. Founding-store applications and multi-branch reviews get a same-week
            reply.
          </p>
        </div>
        <div class="sec-contact__actions">
          <a href="mailto:hello@storvv.com" class="sec-btn sec-btn--dark">
            hello@storvv.com
            <ArrowRight class="h-4 w-4" aria-hidden="true" />
          </a>
          <NuxtLink to="/privacy" class="sec-contact__link">Privacy policy</NuxtLink>
          <NuxtLink to="/terms" class="sec-contact__link">Terms of service</NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  Crown,
  Database,
  FileCheck,
  FolderLock,
  Fingerprint,
  Handshake,
  History,
  KeyRound,
  Layers,
  Lock,
  LogOut,
  Mail,
  ScrollText,
  ShieldCheck,
  ToggleRight,
  UserCog,
  UserRound,
  Users,
} from '@lucide/vue'
import { useLandingScrollAnimations } from '~/composables/useLandingScrollAnimations'

definePageMeta({ layout: 'marketing' })

const { setup: setupScrollAnimations } = useLandingScrollAnimations()

const heroChips = [
  'Encrypted connection',
  'Two-factor for owners',
  'Per-person permissions',
  'Nothing deleted on downgrade',
]

const orbitNodes = [Lock, Fingerprint, Users, History]

const layers = [
  {
    id: 'sign-in',
    label: 'Sign-in',
    icon: Fingerprint,
    title: 'Safe at the door',
    lede: 'Every login is private and protected, whether it is the owner or a new staff member on their first shift.',
    points: [
      { icon: Lock, title: 'Encrypted connection', body: 'Authentication always runs over an encrypted connection.' },
      { icon: KeyRound, title: 'Two-factor authentication', body: 'Owners can turn it on in Profile → Security.' },
      { icon: UserRound, title: 'One login per person', body: 'Staff sign in with their own email and password.' },
      { icon: History, title: 'Rotate passwords anytime', body: 'No need to contact support to change a password.' },
    ],
  },
  {
    id: 'access',
    label: 'Access',
    icon: Users,
    title: 'Scoped inside',
    lede: 'People only see what their job needs. Important controls stay with the people in charge.',
    points: [
      { icon: Crown, title: 'Owners see everything', body: 'Super admins have full control of their stores.' },
      { icon: UserCog, title: 'Managers and staff', body: 'Sensible defaults for each role, adjustable per person.' },
      { icon: FolderLock, title: 'Departments', body: 'Limit which inventory folders a login can even open.' },
      { icon: History, title: 'Activity log', body: 'Dated history of changes on Medium and Enterprise.' },
    ],
  },
  {
    id: 'data',
    label: 'Your data',
    icon: Database,
    title: 'Yours throughout',
    lede: 'Your sales and stock records belong to you, today and if you ever change plans.',
    points: [
      { icon: Database, title: 'You own your records', body: 'We use them only to run Storvv for you.' },
      { icon: Handshake, title: 'Never resold', body: 'Not sold or shared with third parties.' },
      { icon: LogOut, title: 'Safe downgrades', body: 'Nothing is deleted when you move to a smaller plan.' },
      { icon: FileCheck, title: 'Clear policies', body: 'Full detail in our Privacy Policy and Terms.' },
    ],
  },
]

const activeLayer = ref(0)

type RoleId = 'owner' | 'manager' | 'staff'
type Access = 'yes' | 'grant'

const roles: { id: RoleId; label: string; icon: typeof Crown; summary: string }[] = [
  { id: 'owner', label: 'Owner', icon: Crown, summary: 'Full control of every store' },
  { id: 'manager', label: 'Manager', icon: UserCog, summary: 'Runs the floor, handles receipts' },
  { id: 'staff', label: 'Staff', icon: UserRound, summary: 'Rings up sales with their own login' },
]

const capabilities: { label: string; access: Record<RoleId, Access> }[] = [
  { label: 'View products and stock', access: { owner: 'yes', manager: 'yes', staff: 'yes' } },
  { label: 'Create sales', access: { owner: 'yes', manager: 'yes', staff: 'yes' } },
  { label: 'Edit receipts', access: { owner: 'yes', manager: 'yes', staff: 'grant' } },
  { label: 'Refunds and cancellations', access: { owner: 'yes', manager: 'yes', staff: 'grant' } },
  { label: 'Add or edit inventory', access: { owner: 'yes', manager: 'grant', staff: 'grant' } },
  { label: 'Delete receipts', access: { owner: 'yes', manager: 'grant', staff: 'grant' } },
  { label: 'Multi-store sync', access: { owner: 'yes', manager: 'grant', staff: 'grant' } },
]

const activeRole = ref<RoleId>('manager')
const currentRole = computed(() => roles.find((r) => r.id === activeRole.value) ?? roles[0])

const detailItems = [
  {
    icon: Users,
    title: 'Who can see what?',
    body:
      'Super admins see everything for their stores. Managers edit receipts, refunds, and catalog structure. Staff create sales but cannot change categories, pricing rules, or settings. Departments further scope which folders a login can even open.',
  },
  {
    icon: KeyRound,
    title: 'How is a login protected?',
    body:
      'Authentication runs over an encrypted connection. Owners can turn on two-factor authentication for their account in Profile → Security, and passwords can be rotated at any time without contacting support.',
  },
  {
    icon: History,
    title: 'Is there an audit trail?',
    body:
      'Medium and Enterprise keep a dated activity log of inventory, sales, and settings changes, viewable by super admins and managers - useful for handovers, disputes, and staff accountability.',
  },
  {
    icon: Database,
    title: 'Where does my data live, and who owns it?',
    body:
      'Your sales and stock records belong to you. Storvv uses them only to run the product for you - not to resell or share with third parties. Full detail in our Privacy Policy.',
  },
  {
    icon: LogOut,
    title: 'What happens if I cancel?',
    body:
      'Paid plans keep working until the end of the billing period you already paid for, then drop to Micro limits. Your data stays intact - nothing is deleted on downgrade.',
  },
  {
    icon: Handshake,
    title: 'Do you support enterprise procurement reviews?',
    body:
      'Yes. Enterprise includes priority support for security questionnaires, multi-branch rollout planning, and transfer/stock-loan workflow reviews before you commit.',
  },
]

const openFaq = ref<number | null>(0)

onMounted(() => {
  if (import.meta.client) {
    setTimeout(() => setupScrollAnimations(), 100)
  }
})

useHead({
  title: 'Security & Trust - Storvv',
  meta: [
    {
      name: 'description',
      content:
        'How Storvv protects your retail business: secure sign-in, role-based permissions, activity logs, and data ownership - explained plainly for owners and procurement teams.',
    },
  ],
})
</script>

<style scoped>
/* ── Shared ── */
.sec-wrap {
  max-width: 68rem;
  margin: 0 auto;
}

.sec-head {
  max-width: 44rem;
  margin: 0 auto;
  text-align: center;
}

.sec-head--left {
  margin: 0;
  text-align: left;
}

.sec-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.8rem;
  border-radius: 9999px;
  background: rgb(20 63 141 / 0.08);
  color: #143f8d;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sec-eyebrow--dark {
  background: rgb(255 255 255 / 0.1);
  color: #c7d5f0;
}

.sec-title {
  margin-top: 0.9rem;
  font-size: clamp(1.75rem, 3.6vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  color: #0f172a;
}

.sec-accent {
  background: linear-gradient(90deg, #143f8d, #5b7fe0);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.sec-lede {
  margin-top: 0.9rem;
  font-size: 1rem;
  line-height: 1.65;
  color: #475569;
}

.sec-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1.5rem;
  border-radius: 9999px;
  font-size: 0.9rem;
  font-weight: 600;
  transition: transform 200ms ease, box-shadow 200ms ease, background-color 200ms ease;
}

.sec-btn:hover {
  transform: translateY(-2px);
}

.sec-btn--light {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 12px 30px -12px rgb(169 188 245 / 0.6);
}

.sec-btn--ghost {
  color: #ffffff;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.25);
}

.sec-btn--ghost:hover {
  background: rgb(255 255 255 / 0.08);
}

.sec-btn--dark {
  background: #0f172a;
  color: #ffffff;
  box-shadow: 0 10px 24px -12px rgb(15 23 42 / 0.6);
}

/* ── Hero ── */
.sec-hero {
  position: relative;
  overflow: hidden;
  padding: clamp(7rem, 13vw, 9.5rem) 1.25rem clamp(4rem, 8vw, 6rem);
  background: linear-gradient(160deg, #0b1330 0%, #11295c 50%, #1b2a6b 100%);
  color: #ffffff;
}

.sec-hero__grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgb(255 255 255 / 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgb(255 255 255 / 0.05) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 80% 70% at 70% 50%, #000 15%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse 80% 70% at 70% 50%, #000 15%, transparent 75%);
  pointer-events: none;
}

.sec-hero__orb {
  position: absolute;
  width: 30rem;
  aspect-ratio: 1;
  border-radius: 9999px;
  filter: blur(70px);
  opacity: 0.5;
  pointer-events: none;
  animation: sec-drift 16s ease-in-out infinite alternate;
}

.sec-hero__orb--a {
  top: -30%;
  right: -5%;
  background: radial-gradient(circle, #2f5fb8, transparent 65%);
}

.sec-hero__orb--b {
  bottom: -45%;
  left: -10%;
  background: radial-gradient(circle, #5b7fe0, transparent 65%);
  animation-delay: -8s;
}

@keyframes sec-drift {
  to {
    transform: translate(6%, 8%) scale(1.1);
  }
}

.sec-hero__inner {
  position: relative;
  max-width: 68rem;
  margin: 0 auto;
  display: grid;
  gap: 3rem;
  align-items: center;
}

@media (min-width: 900px) {
  .sec-hero__inner {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  }
}

.sec-hero__title {
  margin-top: 1rem;
  font-size: clamp(2.1rem, 5vw, 3.4rem);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.05;
}

.sec-hero__accent {
  display: block;
  background: linear-gradient(90deg, #a9bcf5, #c7d5f0, #a9bcf5);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: sec-shine 6s linear infinite;
}

@keyframes sec-shine {
  to {
    background-position: 200% center;
  }
}

.sec-hero__lede {
  margin-top: 1.1rem;
  max-width: 34rem;
  font-size: 1.0625rem;
  line-height: 1.65;
  color: rgb(255 255 255 / 0.72);
}

.sec-hero__actions {
  margin-top: 1.9rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.sec-hero__chips {
  margin-top: 1.9rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.sec-hero__chips li {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  border-radius: 9999px;
  background: rgb(255 255 255 / 0.07);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.12);
  font-size: 0.8rem;
  font-weight: 600;
  color: rgb(255 255 255 / 0.85);
}

.sec-hero__chip-check {
  width: 0.95rem;
  height: 0.95rem;
  padding: 0.12rem;
  border-radius: 9999px;
  background: rgb(52 211 153 / 0.2);
  color: #34d399;
  stroke-width: 3;
}

/* Shield visual */
.sec-shield {
  position: relative;
  display: grid;
  place-items: center;
  width: min(22rem, 80vw);
  aspect-ratio: 1;
  margin: 0 auto;
}

.sec-shield__ring {
  position: absolute;
  inset: 12%;
  border-radius: 9999px;
  border: 1px solid rgb(169 188 245 / 0.35);
  animation: sec-pulse 4s ease-out infinite;
}

.sec-shield__ring--2 {
  animation-delay: 1.33s;
}

.sec-shield__ring--3 {
  animation-delay: 2.66s;
}

@keyframes sec-pulse {
  0% {
    transform: scale(0.5);
    opacity: 0.9;
  }
  100% {
    transform: scale(1.25);
    opacity: 0;
  }
}

.sec-shield__orbit {
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  border: 1px dashed rgb(255 255 255 / 0.15);
  animation: sec-spin 40s linear infinite;
}

@keyframes sec-spin {
  to {
    transform: rotate(360deg);
  }
}

.sec-shield__node {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  transform: rotate(var(--angle)) translateY(calc(min(22rem, 80vw) / -2));
}

.sec-shield__node-inner {
  position: absolute;
  top: -1.4rem;
  left: -1.4rem;
  display: grid;
  place-items: center;
  width: 2.8rem;
  max-width: none;
  height: 2.8rem;
  border-radius: 0.9rem;
  background: rgb(15 23 42 / 0.75);
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.15),
    0 10px 24px -10px rgb(0 0 0 / 0.6);
  color: #c7d5f0;
  /* Counter-rotate so icons stay upright while the ring spins */
  transform: rotate(calc(var(--angle) * -1));
  animation: sec-counter 40s linear infinite;
}

@keyframes sec-counter {
  from {
    rotate: 0deg;
  }
  to {
    rotate: -360deg;
  }
}

.sec-shield__core {
  position: relative;
  display: grid;
  place-items: center;
  width: 8rem;
  height: 8rem;
  border-radius: 2.25rem;
  background: linear-gradient(145deg, #ffffff, #e9eff8);
  color: #143f8d;
  box-shadow:
    0 0 0 10px rgb(255 255 255 / 0.07),
    0 0 60px 10px rgb(112 144 240 / 0.35),
    0 30px 60px -20px rgb(0 0 0 / 0.6);
}

/* ── Layers ── */
.sec-layers {
  padding: clamp(4rem, 8vw, 6.5rem) 1.25rem;
  background: #f5f5f7;
}

.sec-layers__tabs {
  margin: 2.25rem auto 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;
  max-width: 44rem;
}

.sec-layers__tab {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 1rem 0.75rem;
  border-radius: 1.25rem;
  background: #ffffff;
  border: 1px solid rgb(15 23 42 / 0.08);
  color: #475569;
  transition: all 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.sec-layers__tab:hover {
  transform: translateY(-2px);
  border-color: rgb(20 63 141 / 0.25);
}

.sec-layers__tab--active {
  background: #0f172a;
  border-color: #0f172a;
  color: #ffffff;
  box-shadow: 0 18px 36px -18px rgb(15 23 42 / 0.6);
}

.sec-layers__tab-num {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  opacity: 0.5;
}

.sec-layers__tab-label {
  font-size: 0.875rem;
  font-weight: 700;
}

.sec-layers__panel {
  margin-top: 1.25rem;
  display: grid;
  gap: 1.75rem;
  padding: clamp(1.5rem, 4vw, 2.5rem);
  border-radius: 1.75rem;
  background: #ffffff;
  border: 1px solid rgb(15 23 42 / 0.08);
  box-shadow: 0 30px 60px -40px rgb(20 63 141 / 0.4);
}

@media (min-width: 860px) {
  .sec-layers__panel {
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
    align-items: center;
    gap: 2.5rem;
  }
}

.sec-layers__panel-title {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #0f172a;
}

.sec-layers__panel-lede {
  margin-top: 0.6rem;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #475569;
}

.sec-layers__points {
  display: grid;
  gap: 0.75rem;
}

@media (min-width: 560px) {
  .sec-layers__points {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.sec-layers__point {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 1rem;
  background: #f5f7fb;
  animation: sec-rise 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--i) * 60ms);
}

@keyframes sec-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
}

.sec-layers__point-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 0.7rem;
  background: rgb(20 63 141 / 0.1);
  color: #143f8d;
}

.sec-layers__point-title {
  display: block;
  font-size: 0.875rem;
  font-weight: 700;
  color: #0f172a;
}

.sec-layers__point-body {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.8rem;
  line-height: 1.45;
  color: #64748b;
}

.sec-fade-enter-active,
.sec-fade-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}

.sec-fade-enter-from,
.sec-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

/* ── Roles ── */
.sec-roles {
  padding: clamp(4rem, 8vw, 6.5rem) 1.25rem;
  background: #ffffff;
}

.sec-roles__layout {
  display: grid;
  gap: 2.5rem;
  align-items: center;
}

@media (min-width: 900px) {
  .sec-roles__layout {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 4rem;
  }
}

.sec-roles__picker {
  margin-top: 1.75rem;
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 0.35rem;
  border-radius: 9999px;
  background: #f1f4f9;
  box-shadow: inset 0 0 0 1px rgb(15 23 42 / 0.06);
}

.sec-roles__role {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.1rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  transition: all 220ms ease;
}

.sec-roles__role--active {
  background: #0f172a;
  color: #ffffff;
  box-shadow: 0 8px 18px -8px rgb(15 23 42 / 0.6);
}

.sec-roles__legend {
  margin-top: 1.25rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  font-size: 0.8rem;
  color: #64748b;
}

.sec-roles__legend li {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.sec-roles__card {
  padding: 1.5rem;
  border-radius: 1.75rem;
  background: #ffffff;
  border: 1px solid rgb(15 23 42 / 0.1);
  box-shadow:
    0 0 0 8px #f5f7fb,
    0 40px 70px -40px rgb(20 63 141 / 0.45);
}

.sec-roles__card-head {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding-bottom: 1.1rem;
  border-bottom: 1px dashed rgb(15 23 42 / 0.12);
}

.sec-roles__avatar {
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 9999px;
  background: linear-gradient(145deg, #143f8d, #5b7fe0);
  color: #ffffff;
}

.sec-roles__card-name {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
}

.sec-roles__card-sub {
  font-size: 0.8rem;
  color: #64748b;
}

.sec-roles__list {
  margin-top: 0.5rem;
}

.sec-roles__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0.25rem;
  border-bottom: 1px solid rgb(15 23 42 / 0.06);
  font-size: 0.9rem;
  color: #334155;
}

.sec-roles__row:last-child {
  border-bottom: 0;
}

.sec-state {
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 9999px;
}

.sec-roles__legend .sec-state {
  width: 1.25rem;
  height: 1.25rem;
}

.sec-state--yes {
  background: rgb(16 185 129 / 0.14);
  color: #059669;
}

.sec-state--grant {
  background: rgb(20 63 141 / 0.08);
  color: #143f8d;
  box-shadow: inset 0 0 0 1px rgb(20 63 141 / 0.2);
}

.sec-pop-enter-active {
  transition: transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease;
}

.sec-pop-leave-active {
  transition: transform 120ms ease, opacity 120ms ease;
}

.sec-pop-enter-from,
.sec-pop-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

/* ── FAQ ── */
.sec-faq {
  padding: clamp(4rem, 8vw, 6.5rem) 1.25rem;
  background: #f5f5f7;
}

.sec-faq__wrap {
  max-width: 50rem;
}

.sec-faq__list {
  margin-top: 2.25rem;
  display: grid;
  gap: 0.65rem;
}

.sec-faq__item {
  border-radius: 1.25rem;
  background: #ffffff;
  border: 1px solid rgb(15 23 42 / 0.08);
  transition: box-shadow 260ms ease, border-color 260ms ease;
}

.sec-faq__item--open {
  border-color: rgb(20 63 141 / 0.25);
  box-shadow: 0 20px 40px -26px rgb(20 63 141 / 0.45);
}

.sec-faq__q {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  width: 100%;
  padding: 1.1rem 1.25rem;
  text-align: left;
}

.sec-faq__icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 0.7rem;
  background: rgb(20 63 141 / 0.08);
  color: #143f8d;
  transition: background-color 260ms ease, color 260ms ease;
}

.sec-faq__item--open .sec-faq__icon {
  background: #143f8d;
  color: #ffffff;
}

.sec-faq__q-text {
  flex: 1;
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}

.sec-faq__chevron {
  width: 1.1rem;
  height: 1.1rem;
  color: #64748b;
  transition: transform 260ms ease;
}

.sec-faq__item--open .sec-faq__chevron {
  transform: rotate(180deg);
}

.sec-faq__a {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 320ms cubic-bezier(0.22, 1, 0.36, 1);
}

.sec-faq__item--open .sec-faq__a {
  grid-template-rows: 1fr;
}

.sec-faq__a-inner {
  overflow: hidden;
}

.sec-faq__a-inner p {
  padding: 0 1.25rem 1.2rem 4.2rem;
  font-size: 0.9rem;
  line-height: 1.65;
  color: #475569;
}

/* ── Contact ── */
.sec-contact {
  padding: 0 1.25rem clamp(4rem, 8vw, 6rem);
  background: #f5f5f7;
}

.sec-contact__panel {
  max-width: 68rem;
  margin: 0 auto;
  display: grid;
  gap: 1.25rem;
  align-items: center;
  padding: clamp(1.5rem, 4vw, 2.25rem);
  border-radius: 1.75rem;
  background: #ffffff;
  border: 1px solid rgb(15 23 42 / 0.08);
  box-shadow: 0 30px 60px -40px rgb(20 63 141 / 0.4);
}

@media (min-width: 860px) {
  .sec-contact__panel {
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 1.5rem;
  }
}

.sec-contact__icon {
  display: grid;
  place-items: center;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 1rem;
  background: linear-gradient(145deg, #143f8d, #5b7fe0);
  color: #ffffff;
}

.sec-contact__title {
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: #0f172a;
}

.sec-contact__lede {
  margin-top: 0.3rem;
  font-size: 0.9rem;
  color: #475569;
}

.sec-contact__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
}

.sec-contact__link {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}

.sec-contact__link:hover {
  color: #0f172a;
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* ── Dark ── */
html.dark .sec-layers,
html.dark .sec-faq,
html.dark .sec-contact {
  background: #080808;
}

html.dark .sec-roles {
  background: #0d0d0d;
}

html.dark .sec-eyebrow:not(.sec-eyebrow--dark) {
  background: rgb(112 144 240 / 0.12);
  color: #a9bcf5;
}

html.dark .sec-title,
html.dark .sec-layers__panel-title,
html.dark .sec-layers__point-title,
html.dark .sec-roles__card-name,
html.dark .sec-faq__q-text,
html.dark .sec-contact__title {
  color: #ffffff;
}

html.dark .sec-accent {
  background-image: linear-gradient(90deg, #a9bcf5, #c7d5f0);
}

html.dark .sec-lede,
html.dark .sec-layers__panel-lede,
html.dark .sec-faq__a-inner p,
html.dark .sec-contact__lede,
html.dark .sec-roles__row {
  color: rgb(255 255 255 / 0.7);
}

html.dark .sec-layers__point-body,
html.dark .sec-roles__card-sub,
html.dark .sec-roles__legend,
html.dark .sec-contact__link {
  color: rgb(255 255 255 / 0.55);
}

html.dark .sec-layers__tab,
html.dark .sec-layers__panel,
html.dark .sec-roles__card,
html.dark .sec-faq__item,
html.dark .sec-contact__panel {
  background: #161616;
  border-color: rgb(255 255 255 / 0.08);
  color: rgb(255 255 255 / 0.7);
}

html.dark .sec-layers__tab--active {
  background: #ffffff;
  border-color: #ffffff;
  color: #0f172a;
}

html.dark .sec-layers__point {
  background: rgb(255 255 255 / 0.04);
}

html.dark .sec-layers__point-icon,
html.dark .sec-faq__icon,
html.dark .sec-state--grant {
  background: rgb(112 144 240 / 0.12);
  color: #a9bcf5;
}

html.dark .sec-state--grant {
  box-shadow: inset 0 0 0 1px rgb(112 144 240 / 0.3);
}

html.dark .sec-faq__item--open .sec-faq__icon {
  background: #4876c7;
  color: #ffffff;
}

html.dark .sec-roles__picker {
  background: #1a1a1a;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.08);
}

html.dark .sec-roles__role {
  color: rgb(255 255 255 / 0.65);
}

html.dark .sec-roles__role--active {
  background: #ffffff;
  color: #0f172a;
}

html.dark .sec-roles__card {
  box-shadow:
    0 0 0 8px rgb(255 255 255 / 0.03),
    0 40px 70px -40px rgb(0 0 0 / 0.8);
}

html.dark .sec-roles__card-head {
  border-bottom-color: rgb(255 255 255 / 0.1);
}

html.dark .sec-roles__row {
  border-bottom-color: rgb(255 255 255 / 0.06);
}

html.dark .sec-btn--dark {
  background: #ffffff;
  color: #0f172a;
}

@media (prefers-reduced-motion: reduce) {
  .sec-hero__orb,
  .sec-hero__accent,
  .sec-shield__ring,
  .sec-shield__orbit,
  .sec-shield__node-inner,
  .sec-layers__point {
    animation: none;
  }

  .sec-shield__ring {
    opacity: 0.3;
  }

  .sec-btn,
  .sec-layers__tab,
  .sec-faq__a,
  .sec-faq__chevron {
    transition: none;
  }
}
</style>

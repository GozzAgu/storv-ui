<template>
  <div>
    <!-- Hero -->
    <section class="mk-hero mk-hero--page" aria-labelledby="security-title">
      <div class="mk-hero__backdrop" aria-hidden="true" />
      <div class="mk-container">
        <div class="mk-hero__copy">
          <p class="mk-eyebrow">Security &amp; trust</p>
          <h1 id="security-title" class="mk-h1">
            Every account, every sale, every branch. <span class="mk-accent">Accounted for.</span>
          </h1>
          <div class="mk-actions mk-actions--center">
            <SButton variant="primary" size="lg" class="mk-btn" to="#layers">
              See how it works
              <template #trailing><ArrowDown :size="16" aria-hidden="true" /></template>
            </SButton>
            <SButton variant="secondary" size="lg" class="mk-btn" to="mailto:hello@storvv.com">
              Ask a security question
            </SButton>
          </div>
          <ul class="mk-hero__note" aria-label="Highlights">
            <li v-for="chip in heroChips" :key="chip">
              <Check :size="16" aria-hidden="true" />{{ chip }}
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Three layers -->
    <section id="layers" class="mk-section mk-section--alt" aria-labelledby="layers-title">
      <div class="mk-container">
        <MkSectionHead
          title-id="layers-title"
          eyebrow="Three layers of protection"
          title="Safe at the door. Scoped inside."
          accent="Yours throughout."
        />
        <div class="mk-tabs-row">
          <STabs
            v-model="activeLayer"
            :tabs="layerTabs"
            label="Protection layers"
            panel-id="layers-panel"
          />
        </div>
        <Transition name="mk-fade" mode="out-in">
          <div id="layers-panel" :key="currentLayer.id" class="mk-panel" role="tabpanel">
            <div>
              <h3 class="mk-h2 mk-panel__title">{{ currentLayer.title }}</h3>
              <ul class="mk-points">
                <li v-for="point in currentLayer.points" :key="point.title" class="mk-point">
                  <span class="mk-feature__icon"
                    ><component :is="point.icon" :size="16" aria-hidden="true"
                  /></span>
                  {{ point.title }}
                </li>
              </ul>
            </div>
            <div class="mk-preview" aria-hidden="true">
              <p class="mk-preview__head">
                {{ currentLayer.preview.title }}
                <span class="mk-mini__pill mk-mini__pill--success">Live</span>
              </p>
              <div v-for="row in currentLayer.preview.rows" :key="row.strong" class="mk-mini__row">
                <SAvatar v-if="row.person" :name="row.strong" size="sm" />
                <span v-else class="mk-mini__thumb"><component :is="row.icon" :size="16" /></span>
                <span class="mk-mini__main">
                  <span class="mk-mini__strong">{{ row.strong }}</span>
                  <span class="mk-mini__sub">{{ row.sub }}</span>
                </span>
                <span class="mk-mini__pill" :class="row.tone && `mk-mini__pill--${row.tone}`">
                  {{ row.pill }}
                </span>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </section>

    <!-- Roles -->
    <section class="mk-section" aria-labelledby="roles-title">
      <div class="mk-container">
        <div class="mk-split">
          <div class="mk-split__copy">
            <p class="mk-eyebrow">Who can do what</p>
            <h2 id="roles-title" class="mk-h2">
              No shared logins. <span class="mk-accent">Just the right access.</span>
            </h2>
            <div>
              <STabs
                v-model="activeRole"
                :tabs="roleTabs"
                label="Choose a role"
                panel-id="roles-panel"
              />
            </div>
            <ul class="mk-hero__note mk-roles-legend" aria-label="Legend">
              <li><Check :size="16" aria-hidden="true" />Included</li>
              <li class="mk-hero__note-soon">
                <ToggleRight :size="16" aria-hidden="true" />Owner can switch on
              </li>
            </ul>
          </div>

          <div id="roles-panel" class="mk-roles" role="tabpanel">
            <div class="mk-roles__head">
              <SAvatar :name="currentRole.label" />
              <div>
                <p class="mk-chat__name">{{ currentRole.label }}</p>
                <p class="mk-chat__status">{{ currentRole.summary }}</p>
              </div>
            </div>
            <ul>
              <li v-for="cap in capabilities" :key="cap.label" class="mk-roles__row">
                <span>{{ cap.label }}</span>
                <span v-if="cap.access[activeRole] === 'yes'" class="mk-state mk-state--yes">
                  <Check :size="16" aria-hidden="true" />Included
                </span>
                <span v-else class="mk-state mk-state--grant">
                  <ToggleRight :size="16" aria-hidden="true" />Owner can switch on
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Due diligence -->
    <section class="mk-section mk-section--alt" aria-labelledby="diligence-title">
      <div class="mk-container mk-faq-layout">
        <div class="mk-faq-layout__aside">
          <MkSectionHead
            title-id="diligence-title"
            eyebrow="Due diligence"
            title="Common questions from"
            accent="due&#8209;diligence checklists."
            align="start"
          >
            <p class="mk-card__text">
              Full detail lives in our
              <NuxtLink to="/privacy" class="mk-link">Privacy Policy</NuxtLink> and
              <NuxtLink to="/terms" class="mk-link">Terms of Service</NuxtLink>.
            </p>
          </MkSectionHead>
        </div>
        <MkFaq :items="detailItems" />
      </div>
    </section>

    <MkCta
      title="Need a written answer for procurement?"
      :primary="{ label: 'hello@storvv.com', to: 'mailto:hello@storvv.com' }"
      :secondary="{ label: 'Privacy policy', to: '/privacy' }"
    />
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { computed, ref } from 'vue'
import {
  ArrowDown,
  Check,
  Crown,
  Database,
  FileCheck,
  Fingerprint,
  FolderLock,
  Handshake,
  History,
  KeyRound,
  Lock,
  LogOut,
  ToggleRight,
  UserCog,
  UserRound,
  Users,
} from '@lucide/vue'
import SAvatar from '~/components/s/SAvatar.vue'
import SButton from '~/components/s/SButton.vue'
import STabs from '~/components/s/STabs.vue'
import MkCta from '~/components/marketing/MkCta.vue'
import MkFaq, { type MkFaqItem } from '~/components/marketing/MkFaq.vue'
import MkSectionHead from '~/components/marketing/MkSectionHead.vue'

definePageMeta({ layout: 'marketing' })

const heroChips = [
  'Encrypted connection',
  'Two-factor for owners',
  'Per-person permissions',
  'Nothing deleted on downgrade',
]

interface PreviewRow {
  strong: string
  sub: string
  pill: string
  tone?: 'success' | 'warning' | 'accent'
  icon?: Component
  person?: boolean
}

interface Layer {
  id: string
  label: string
  icon: Component
  title: string
  points: { icon: Component; title: string }[]
  preview: { title: string; rows: PreviewRow[] }
}

const layers: Layer[] = [
  {
    id: 'sign-in',
    label: 'Sign-in',
    icon: Fingerprint,
    title: 'Safe at the door',
    points: [
      { icon: Lock, title: 'Encrypted connection' },
      { icon: KeyRound, title: 'Two-factor for owners' },
      { icon: UserRound, title: 'One login per person' },
      { icon: History, title: 'Change passwords anytime' },
    ],
    preview: {
      title: 'Sign-in check',
      rows: [
        { icon: Lock, strong: 'Connection', sub: 'Encrypted', pill: 'Secure', tone: 'success' },
        {
          icon: KeyRound,
          strong: 'Two-factor code',
          sub: 'Owner account',
          pill: 'On',
          tone: 'accent',
        },
        { person: true, strong: 'Chioma Eze', sub: 'Her own email and password', pill: 'Staff' },
      ],
    },
  },
  {
    id: 'access',
    label: 'Access',
    icon: Users,
    title: 'Scoped inside',
    points: [
      { icon: Crown, title: 'Owners see everything' },
      { icon: UserCog, title: 'Roles you can adjust' },
      { icon: FolderLock, title: 'Folder-level departments' },
      { icon: History, title: 'Activity log (Medium+)' },
    ],
    preview: {
      title: 'Team access',
      rows: [
        { person: true, strong: 'Ada Okonkwo', sub: 'Everything', pill: 'Owner', tone: 'accent' },
        { person: true, strong: 'Chioma Eze', sub: 'Sales, receipts, refunds', pill: 'Manager' },
        { person: true, strong: 'Tunde Bello', sub: 'Phones folder, sales only', pill: 'Staff' },
      ],
    },
  },
  {
    id: 'data',
    label: 'Your data',
    icon: Database,
    title: 'Yours throughout',
    points: [
      { icon: Database, title: 'You own your records' },
      { icon: Handshake, title: 'Never sold or shared' },
      { icon: LogOut, title: 'Nothing deleted on downgrade' },
      { icon: FileCheck, title: 'Clear, plain policies' },
    ],
    preview: {
      title: 'Your records',
      rows: [
        {
          icon: Database,
          strong: 'Sales and stock',
          sub: 'Owned by you',
          pill: 'Yours',
          tone: 'success',
        },
        { icon: Handshake, strong: 'Third parties', sub: 'Not sold, not shared', pill: 'Never' },
        {
          icon: LogOut,
          strong: 'Downgrade to Micro',
          sub: 'Every record kept',
          pill: '0 deleted',
          tone: 'success',
        },
      ],
    },
  },
]

const layerTabs = layers.map((layer) => ({ value: layer.id, label: layer.label, icon: layer.icon }))
const activeLayer = ref(layers[0]!.id)
const currentLayer = computed(
  () => layers.find((layer) => layer.id === activeLayer.value) ?? layers[0]!
)

type RoleId = 'owner' | 'manager' | 'staff'
type Access = 'yes' | 'grant'

const roles: { id: RoleId; label: string; icon: typeof Crown; summary: string }[] = [
  { id: 'owner', label: 'Owner', icon: Crown, summary: 'Full control of every store' },
  { id: 'manager', label: 'Manager', icon: UserCog, summary: 'Runs the floor, handles receipts' },
  { id: 'staff', label: 'Staff', icon: UserRound, summary: 'Rings up sales with their own login' },
]

const roleTabs = roles.map((role) => ({ value: role.id, label: role.label, icon: role.icon }))

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
const currentRole = computed(() => roles.find((r) => r.id === activeRole.value) ?? roles[0]!)

const detailItems: MkFaqItem[] = [
  {
    q: 'Who can see what?',
    a: 'Owners see everything. Managers handle receipts and refunds. Staff make sales. Departments limit which folders each login opens.',
  },
  {
    q: 'How is a login protected?',
    a: 'Every sign-in is encrypted. Owners can turn on two-factor in Profile → Security.',
  },
  {
    q: 'Is there an audit trail?',
    a: 'Yes, on Medium and Enterprise. A dated log of inventory, sales, and settings changes.',
  },
  {
    q: 'Who owns my data?',
    a: 'You do. We use it only to run Storvv for you, never to sell or share.',
  },
  {
    q: 'What happens if I cancel?',
    a: 'Your plan runs to the end of the paid period, then moves to Micro. Nothing is deleted.',
  },
  {
    q: 'Do you support procurement reviews?',
    a: 'Yes. Enterprise includes priority help with security questionnaires and rollout planning.',
  },
]

useHead({
  title: 'Security & Trust - Storvv',
  meta: [
    {
      name: 'description',
      content:
        'How Storvv protects your retail business: secure sign-in, role-based permissions, activity logs, and data ownership, explained plainly for owners and procurement teams.',
    },
  ],
})
</script>

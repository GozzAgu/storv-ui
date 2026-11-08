<template>
  <div class="ds-root s-c s-page">
    <SPageHeader title="Demo insights">
      <template #description>
        Who tried the demo, what they looked at, and who asked for a walkthrough. Storvv team only.
      </template>
      <template v-if="allowed" #actions>
        <SButton size="sm" :loading="loading" @click="load">
          <template #leading><RefreshCw :size="14" aria-hidden="true" /></template>
          Refresh
        </SButton>
      </template>
    </SPageHeader>

    <SCard v-if="denied">
      <SEmptyState
        title="Storvv team only"
        description="This page shows walkthrough requests and demo activity. Ask an admin to add your sign-in email to STORVV_TEAM_EMAILS."
      >
        <template #icon><Lock :size="24" :stroke-width="1.75" aria-hidden="true" /></template>
      </SEmptyState>
    </SCard>

    <SCard v-else-if="loadError">
      <SEmptyState title="Couldn’t load demo insights" :description="loadError">
        <template #icon
          ><AlertCircle :size="24" :stroke-width="1.75" aria-hidden="true"
        /></template>
        <template #actions><SButton @click="load">Try again</SButton></template>
      </SEmptyState>
    </SCard>

    <template v-else>
      <div class="s-demo-insights__stats" aria-label="Summary">
        <SStat
          label="New requests"
          :value="loading ? '…' : newLeads"
          :tone="newLeads ? 'warning' : undefined"
          hint="Waiting for a first contact"
        />
        <SStat
          label="Demo visits"
          :value="loading ? '…' : sessions.length"
          hint="Most recent 200"
        />
        <SStat
          label="Serious visitors"
          :value="loading ? '…' : hotSessions"
          hint="Did real work or stayed 10+ min"
        />
        <SStat
          label="Typical visit"
          :value="loading ? '…' : formatDuration(medianSeconds)"
          hint="Median active time"
        />
      </div>

      <STabs v-model="tab" :tabs="tabs" label="Demo insights" />

      <!-- Walkthrough requests -->
      <SCard v-if="tab === 'requests'" flush :aria-busy="loading">
        <SEmptyState
          v-if="!loading && !leads.length"
          title="No walkthrough requests yet"
          description="Requests from the demo banner, exit prompt and website appear here, newest first."
        >
          <template #icon
            ><CalendarDays :size="24" :stroke-width="1.75" aria-hidden="true"
          /></template>
        </SEmptyState>
        <ul v-else class="s-demo-insights__list">
          <li v-for="lead in leads" :key="lead.id" class="s-demo-insights__lead">
            <div class="s-demo-insights__head">
              <div class="s-demo-insights__who">
                <p class="s-demo-insights__name">
                  {{ lead.name }}
                  <span v-if="lead.business" class="s-demo-insights__muted"
                    >· {{ lead.business }}</span
                  >
                </p>
                <p class="s-demo-insights__muted">
                  {{ formatWhen(lead.createdAt) }} · {{ sourceLabel(lead.source) }}
                  <template v-if="lead.country"> · {{ lead.country }}</template>
                  <template v-if="lead.device"> · {{ lead.device }}</template>
                </p>
              </div>
              <div class="s-demo-insights__tags">
                <SBadge size="sm" :tone="interestTone(lead.interest)">
                  {{ interestLabel(lead.interest) }}
                </SBadge>
                <SSelect
                  :model-value="lead.status"
                  :options="statusOptions"
                  class="s-demo-insights__status"
                  :aria-label="`Status for ${lead.name}`"
                  :disabled="savingId === lead.id"
                  @update:model-value="(value) => setStatus(lead, String(value))"
                />
              </div>
            </div>

            <div class="s-demo-insights__contact">
              <SButton
                v-if="lead.phone"
                size="sm"
                variant="secondary"
                :to="whatsappLink(lead)"
                target="_blank"
                rel="noopener noreferrer"
              >
                <template #leading><MessageCircle :size="14" aria-hidden="true" /></template>
                {{ lead.phone }}
              </SButton>
              <SButton v-if="lead.phone" size="sm" variant="ghost" :to="`tel:${lead.phone}`">
                <template #leading><Phone :size="14" aria-hidden="true" /></template>
                Call
              </SButton>
              <SButton v-if="lead.email" size="sm" variant="ghost" :to="`mailto:${lead.email}`">
                <template #leading><Mail :size="14" aria-hidden="true" /></template>
                {{ lead.email }}
              </SButton>
              <span class="s-demo-insights__muted">Prefers {{ lead.preferredContact }}</span>
            </div>

            <dl class="s-demo-insights__facts">
              <div v-if="lead.branches">
                <dt>Branches</dt>
                <dd>{{ lead.branches }}</dd>
              </div>
              <div v-if="lead.sells">
                <dt>Sells</dt>
                <dd>{{ lead.sells }}</dd>
              </div>
              <div v-if="lead.activity">
                <dt>Time in demo</dt>
                <dd>{{ formatDuration(lead.activity.activeSeconds) }}</dd>
              </div>
              <div v-if="lead.activity?.topPages?.length">
                <dt>Looked at</dt>
                <dd>{{ lead.activity.topPages.map((p) => p.label).join(', ') }}</dd>
              </div>
              <div v-if="lead.activity && Object.keys(lead.activity.actions).length">
                <dt>Tried</dt>
                <dd>{{ actionSummary(lead.activity.actions) }}</dd>
              </div>
            </dl>
            <p v-if="lead.message" class="s-demo-insights__message">“{{ lead.message }}”</p>
          </li>
        </ul>
      </SCard>

      <!-- Demo visits -->
      <SCard v-else flush :aria-busy="loading">
        <div class="s-demo-insights__filter">
          <STabs v-model="interestFilter" :tabs="interestTabs" label="Filter visits" />
        </div>
        <SEmptyState
          v-if="!loading && !filteredSessions.length"
          title="No demo visits here"
          description="Visits show up a few seconds after someone opens the demo."
        >
          <template #icon
            ><MonitorPlay :size="24" :stroke-width="1.75" aria-hidden="true"
          /></template>
        </SEmptyState>
        <div v-else class="s-table-wrap">
          <table class="s-table s-demo-insights__table">
            <thead>
              <tr>
                <th scope="col">Last seen</th>
                <th scope="col">Interest</th>
                <th scope="col" class="s-table__num">Active time</th>
                <th scope="col" class="s-table__num">Pages</th>
                <th scope="col">Most time on</th>
                <th scope="col">Tried</th>
                <th scope="col">From</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in filteredSessions" :key="s.id">
                <td>
                  {{ formatWhen(s.lastSeenAt) }}
                  <span v-if="s.leadId" class="s-demo-insights__muted"> · requested</span>
                </td>
                <td>
                  <SBadge size="sm" :tone="interestTone(s.interest)">
                    {{ interestLabel(s.interest) }}
                  </SBadge>
                </td>
                <td class="s-table__num">{{ formatDuration(s.activeSeconds) }}</td>
                <td class="s-table__num">{{ s.pageCount }}</td>
                <td>
                  {{
                    s.topPages
                      .slice(0, 3)
                      .map((p) => p.label)
                      .join(', ') || '—'
                  }}
                </td>
                <td>{{ actionSummary(s.actions) || '—' }}</td>
                <td>
                  {{ s.utmSource || s.referrerHost || 'Direct' }}
                  <span class="s-demo-insights__muted">
                    · {{ [s.device, s.country].filter(Boolean).join(' · ') }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SCard>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

import { computed, onMounted, ref } from 'vue'
import {
  AlertCircle,
  CalendarDays,
  Lock,
  Mail,
  MessageCircle,
  MonitorPlay,
  Phone,
  RefreshCw,
} from '@lucide/vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SPageHeader from '~/components/s/SPageHeader.vue'
import SSelect from '~/components/s/SSelect.vue'
import SStat from '~/components/s/SStat.vue'
import STabs from '~/components/s/STabs.vue'
import { useAuthenticatedFetch } from '~/composables/useAuthenticatedFetch'
import type { DemoInterest } from '~/utils/demo-insights'

useHead({ title: 'Demo insights' })

interface Activity {
  activeSeconds: number
  pageCount: number
  topPages: Array<{ label: string; seconds: number; views: number }>
  actions: Record<string, number>
}

interface Lead {
  id: string
  name: string
  business: string
  email: string
  phone: string
  branches: string
  sells: string
  message: string
  preferredContact: string
  source: string
  status: string
  device: string
  country: string
  createdAt: string | null
  activity: Activity | null
  interest: DemoInterest
}

interface Session extends Activity {
  id: string
  leadId: string | null
  lastSeenAt: string | null
  device: string
  country: string
  referrerHost: string
  utmSource: string
  interest: DemoInterest
}

const { authFetch } = useAuthenticatedFetch()
const toast = useAppToast()

const leads = ref<Lead[]>([])
const sessions = ref<Session[]>([])
const loading = ref(true)
const denied = ref(false)
const loadError = ref('')
const savingId = ref<string | null>(null)
const tab = ref('requests')
const interestFilter = ref('all')

const allowed = computed(() => !denied.value)
const newLeads = computed(() => leads.value.filter((l) => l.status === 'new').length)
const hotSessions = computed(() => sessions.value.filter((s) => s.interest === 'hot').length)
const medianSeconds = computed(() => {
  const values = sessions.value.map((s) => s.activeSeconds).sort((a, b) => a - b)
  return values.length ? values[Math.floor(values.length / 2)] : 0
})

const tabs = computed(() => [
  { value: 'requests', label: 'Walkthrough requests', count: leads.value.length },
  { value: 'visits', label: 'Demo visits', count: sessions.value.length },
])

const interestTabs = computed(() => [
  { value: 'all', label: 'All' },
  { value: 'hot', label: 'Serious', count: hotSessions.value },
  {
    value: 'warm',
    label: 'Interested',
    count: sessions.value.filter((s) => s.interest === 'warm').length,
  },
  { value: 'cold', label: 'Browsing' },
])

const filteredSessions = computed(() =>
  interestFilter.value === 'all'
    ? sessions.value
    : sessions.value.filter((s) => s.interest === interestFilter.value)
)

const statusOptions = [
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Call booked', value: 'booked' },
  { label: 'Signed up', value: 'won' },
  { label: 'Not now', value: 'lost' },
]

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const data = await authFetch<{ leads: Lead[]; sessions: Session[] }>('/api/demo/insights')
    leads.value = data.leads
    sessions.value = data.sessions
  } catch (err) {
    const status = (err as { statusCode?: number })?.statusCode
    if (status === 403) denied.value = true
    else
      loadError.value =
        (err as { data?: { message?: string } })?.data?.message || 'Please try again.'
  } finally {
    loading.value = false
  }
}

async function setStatus(lead: Lead, status: string) {
  if (status === lead.status) return
  const previous = lead.status
  lead.status = status
  savingId.value = lead.id
  try {
    await authFetch(`/api/demo/leads/${lead.id}`, { method: 'PATCH', body: { status } })
  } catch {
    lead.status = previous
    toast.error('Couldn’t update that request. Try again.')
  } finally {
    savingId.value = null
  }
}

function whatsappLink(lead: Lead): string {
  const digits = lead.phone.replace(/\D/g, '')
  const text = `Hi ${
    lead.name.split(' ')[0]
  }, this is Storvv. Thanks for trying our demo. When's a good time for a quick walkthrough?`
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

const ACTION_LABELS: Record<string, string> = {
  sale_created: 'made a sale',
  item_added: 'added stock',
  receipt_edited: 'edited a receipt',
  store_created: 'added a branch',
  data_reset: 'reset data',
  signup_click: 'clicked sign up',
  book_click: 'opened booking',
  whatsapp_click: 'opened WhatsApp',
  calendar_click: 'opened calendar',
}

function actionSummary(actions: Record<string, number>): string {
  return Object.entries(actions)
    .filter(([name]) => ACTION_LABELS[name])
    .map(([name, n]) => (n > 1 ? `${ACTION_LABELS[name]} ×${n}` : ACTION_LABELS[name]))
    .join(', ')
}

const SOURCE_LABELS: Record<string, string> = {
  demo_banner: 'Demo banner',
  demo_exit: 'Leaving the demo',
  demo_save: 'After using the demo',
  demo_menu: 'Demo menu',
  landing_hero: 'Home page',
  landing_cta: 'Website',
  landing_menu: 'Website menu',
}

function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source
}

function interestTone(interest: DemoInterest) {
  return interest === 'hot' ? 'success' : interest === 'warm' ? 'info' : 'neutral'
}

function interestLabel(interest: DemoInterest) {
  return interest === 'hot' ? 'Serious' : interest === 'warm' ? 'Interested' : 'Browsing'
}

function formatDuration(seconds: number): string {
  if (!seconds) return '0s'
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.round(seconds / 60)
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

function formatWhen(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

onMounted(load)
</script>

<style scoped>
.s-demo-insights__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--s-space-2);
  margin-bottom: var(--s-space-3);
}

@media (max-width: 900px) {
  .s-demo-insights__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.s-demo-insights__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.s-demo-insights__lead {
  display: flex;
  flex-direction: column;
  gap: var(--s-space-1-5);
  padding: var(--s-space-2-5, var(--s-space-2)) var(--s-space-3);
  border-bottom: 1px solid var(--s-border);
}

.s-demo-insights__lead:last-child {
  border-bottom: 0;
}

.s-demo-insights__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--s-space-1-5);
}

.s-demo-insights__who {
  min-width: 0;
}

.s-demo-insights__name {
  margin: 0;
  color: var(--s-text);
  font: var(--s-text-body);
  font-weight: 600;
}

.s-demo-insights__muted {
  margin: 0;
  color: var(--s-text-muted);
  font: var(--s-text-small);
  font-weight: 400;
}

.s-demo-insights__tags {
  display: flex;
  align-items: center;
  gap: var(--s-space-1);
}

.s-demo-insights__status {
  min-width: 150px;
}

.s-demo-insights__contact {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-space-1);
}

.s-demo-insights__facts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-space-1) var(--s-space-3);
  margin: 0;
  font: var(--s-text-small);
}

.s-demo-insights__facts dt {
  color: var(--s-text-muted);
}

.s-demo-insights__facts dd {
  margin: 0;
  color: var(--s-text);
}

.s-demo-insights__message {
  margin: 0;
  padding: var(--s-space-1) var(--s-space-1-5);
  border-radius: var(--s-radius);
  background: var(--s-surface-2);
  color: var(--s-text-2);
  font: var(--s-text-small);
  font-style: italic;
}

.s-demo-insights__filter {
  padding: var(--s-space-1-5) var(--s-space-2);
  border-bottom: 1px solid var(--s-border);
  overflow-x: auto;
}

.s-demo-insights__table td {
  vertical-align: top;
}
</style>

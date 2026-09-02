<template>
  <div :class="[pageWithFixedFooterClass, 'dash-page--unified']">
    <DashboardPageHeader class="dash-page-header--unified">
      <template #eyebrow>
        <p :class="eyebrowClass">Commerce</p>
      </template>
      <template #title>
        <div class="flex flex-wrap items-center gap-2">
          <h1 :class="pageTitleClass">{{ lead?.customerName || 'Sales lead' }}</h1>
          <LeadStatusBadge v-if="lead" :status="lead.status" />
        </div>
      </template>
      <template v-if="lead" #description>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ lead.productName }}
          <span v-if="lead.estimatedValue && lead.estimatedValue > 0">
            · Est. {{ formatCurrency(lead.estimatedValue) }}
          </span>
        </p>
      </template>
      <template #actions>
        <div class="flex flex-wrap items-center gap-2">
          <Button
            v-if="lead && isOpenLead"
            variant="outline"
            size="sm"
            @click="showEditModal = true"
          >
            Edit
          </Button>
          <Button
            v-if="lead && canDeleteLead"
            variant="outline"
            size="sm"
            :loading="deleteSaving"
            @click="showDeleteConfirm = true"
          >
            Delete
          </Button>
          <NuxtLink
            :to="dashPath('/leads')"
            class="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            Back to leads
          </NuxtLink>
        </div>
      </template>
    </DashboardPageHeader>

    <div v-if="!canAccessLeadsPlan" class="py-8">
      <FeatureGateCard feature="sales_leads" />
    </div>

    <div
      v-else-if="salesLeadsStore.detailLoading && !lead"
      class="p-8 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      Loading lead…
    </div>

    <div v-else-if="!lead" class="rounded-sm bg-red-50/90 px-4 py-4 dark:bg-red-950/25">
      <p class="text-xs font-medium text-red-800 dark:text-red-200">
        {{ salesLeadsStore.error || 'Lead not found.' }}
      </p>
    </div>

    <div v-else class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <section class="space-y-5 rounded-sm border border-gray-200/80 bg-white p-4 dark:border-white/10 dark:bg-dashboard-card sm:p-5">
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <p class="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Customer
            </p>
            <p class="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ lead.customerName }}
            </p>
            <p v-if="lead.customerPhone" class="text-xs text-gray-600 dark:text-gray-400">
              {{ lead.customerPhone }}
            </p>
            <p v-if="lead.customerEmail" class="text-xs text-gray-600 dark:text-gray-400">
              {{ lead.customerEmail }}
            </p>
          </div>
          <div>
            <p class="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Source
            </p>
            <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {{ SALES_LEAD_SOURCE_LABELS[lead.source] }}
            </p>
          </div>
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300"
            >Assigned to</label
          >
          <select
            v-model="assignedToSelection"
            class="app-field max-w-sm px-3 py-2 text-sm"
            :disabled="assignSaving"
            @change="onAssignChange"
          >
            <option value="">Unassigned</option>
            <option v-for="member in activeStaff" :key="member.id" :value="member.id">
              {{ member.firstName }} {{ member.lastName }}
            </option>
          </select>
        </div>

        <div v-if="lead.notes">
          <p class="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Latest note
          </p>
          <p class="mt-1 whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
            {{ lead.notes }}
          </p>
        </div>

        <div v-if="isOpenLead" class="flex flex-wrap gap-2">
          <label class="sr-only" for="lead-status">Status</label>
          <select
            id="lead-status"
            v-model="selectedStatus"
            class="app-field px-3 py-2 text-sm"
            :disabled="statusSaving"
            @change="onStatusChange"
          >
            <option v-for="status in openStatuses" :key="status" :value="status">
              {{ SALES_LEAD_STATUS_LABELS[status] }}
            </option>
          </select>
          <ConvertLeadToSaleButton :lead="lead" />
          <Button variant="outline" size="sm" :disabled="statusSaving" @click="showLostModal = true">
            Mark lost
          </Button>
        </div>

        <div v-else-if="lead.status === 'won' && lead.receiptId" class="text-sm">
          <NuxtLink
            :to="dashPath(`/receipts?highlight=${encodeURIComponent(lead.receiptId)}`)"
            class="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            View receipt
          </NuxtLink>
          <span v-if="lead.wonRevenue" class="ml-2 text-gray-600 dark:text-gray-400">
            · {{ formatCurrency(lead.wonRevenue) }}
          </span>
        </div>

        <div v-else-if="lead.status === 'lost' && lead.lostReason" class="text-sm text-gray-600 dark:text-gray-400">
          Reason: {{ lead.lostReason }}
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300"
            >Add note</label
          >
          <textarea
            v-model="noteDraft"
            rows="3"
            maxlength="500"
            class="app-field w-full px-3 py-2 text-sm"
            placeholder="Follow-up details"
          />
          <div class="mt-2 flex justify-end">
            <Button
              variant="primary"
              size="sm"
              :loading="noteSaving"
              :disabled="!noteDraft.trim()"
              @click="saveNote"
            >
              Save note
            </Button>
          </div>
        </div>
      </section>

      <aside class="rounded-sm border border-gray-200/80 bg-white p-4 dark:border-white/10 dark:bg-dashboard-card sm:p-5">
        <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Activity</h2>
        <div class="mt-3">
          <LeadTimeline :events="salesLeadsStore.events" />
        </div>
      </aside>
    </div>

    <EditLeadModal v-model="showEditModal" :lead="lead" />

    <Modal v-model="showLostModal" title="Mark lead lost" size="md">
      <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300"
        >Reason (optional)</label
      >
      <input
        v-model="lostReason"
        type="text"
        maxlength="200"
        class="app-field w-full px-3 py-2 text-sm"
        placeholder="Price, timing, bought elsewhere…"
      />
      <template #footer>
        <IosDrawerActions
          primary-label="Mark lost"
          :primary-loading="statusSaving"
          @cancel="showLostModal = false"
          @primary="confirmLost"
        />
      </template>
    </Modal>

    <Modal v-model="showDeleteConfirm" title="Delete lead?" size="md">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        This removes {{ lead?.customerName }} from your leads list. This cannot be undone.
      </p>
      <template #footer>
        <IosDrawerActions
          primary-variant="danger"
          primary-label="Delete lead"
          :primary-loading="deleteSaving"
          @cancel="showDeleteConfirm = false"
          @primary="confirmDelete"
        />
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Button from '~/components/ui/Button.vue'
import IosDrawerActions from '~/components/ios/IosDrawerActions.vue'
import FeatureGateCard from '~/components/subscription/FeatureGateCard.vue'
import Modal from '~/components/ui/Modal.vue'
import ConvertLeadToSaleButton from '~/components/leads/ConvertLeadToSaleButton.vue'
import EditLeadModal from '~/components/leads/EditLeadModal.vue'
import LeadStatusBadge from '~/components/leads/LeadStatusBadge.vue'
import LeadTimeline from '~/components/leads/LeadTimeline.vue'
import {
  useSalesLeadsStore,
  SALES_LEAD_SOURCE_LABELS,
  SALES_LEAD_STATUS_LABELS,
} from '~/stores/salesLeads'
import { useStaffStore } from '~/stores/staff'
import type { SalesLeadStatus } from '~/types/leads'
import { isOpenSalesLeadStatus } from '~/types/leads'

definePageMeta({
  layout: 'dashboard',
})

const route = useRoute()
const { pageWithFixedFooterClass, pageTitleClass, eyebrowClass } = useDashboardPageChrome()
const { dashPath } = useDashboardPaths()
const { formatCurrency } = usePreferences()
const { canUse: canUseSubscriptionFeature } = useSubscriptionFeatures()
const { canManage } = usePermissions()

const salesLeadsStore = useSalesLeadsStore()
const staffStore = useStaffStore()

const leadId = computed(() => String(route.params.id || ''))
const lead = computed(
  () =>
    salesLeadsStore.currentLead ??
    salesLeadsStore.leads.find((row) => row.id === leadId.value) ??
    null
)
const canAccessLeadsPlan = computed(() => canUseSubscriptionFeature('sales_leads'))
const isOpenLead = computed(() => (lead.value ? isOpenSalesLeadStatus(lead.value.status) : false))
const canDeleteLead = computed(() => canManage.value)
const activeStaff = computed(() => staffStore.staff.filter((member) => member.status === 'active'))

const openStatuses: SalesLeadStatus[] = ['new', 'contacted', 'negotiating']
const selectedStatus = ref<SalesLeadStatus>('new')
const assignedToSelection = ref('')
const noteDraft = ref('')
const noteSaving = ref(false)
const statusSaving = ref(false)
const assignSaving = ref(false)
const deleteSaving = ref(false)
const showLostModal = ref(false)
const showDeleteConfirm = ref(false)
const showEditModal = ref(false)
const lostReason = ref('')

watch(
  lead,
  (value) => {
    if (value && isOpenSalesLeadStatus(value.status)) {
      selectedStatus.value = value.status
    }
    assignedToSelection.value = value?.assignedTo || ''
  },
  { immediate: true }
)

watch(
  [leadId, canAccessLeadsPlan],
  async ([id, canAccess]) => {
    if (!id || !canAccess) return
    await Promise.all([salesLeadsStore.fetchLeadById(id), staffStore.fetchStaff()])
  },
  { immediate: true }
)

async function onStatusChange() {
  if (!lead.value || statusSaving.value) return
  statusSaving.value = true
  try {
    await salesLeadsStore.updateLeadStatus(lead.value.id, selectedStatus.value)
  } finally {
    statusSaving.value = false
  }
}

async function onAssignChange() {
  if (!lead.value || assignSaving.value) return
  assignSaving.value = true
  try {
    await salesLeadsStore.assignLead(lead.value.id, assignedToSelection.value || null)
  } finally {
    assignSaving.value = false
  }
}

async function saveNote() {
  if (!lead.value || !noteDraft.value.trim() || noteSaving.value) return
  noteSaving.value = true
  try {
    await salesLeadsStore.addLeadNote(lead.value.id, noteDraft.value)
    noteDraft.value = ''
  } finally {
    noteSaving.value = false
  }
}

async function confirmLost() {
  if (!lead.value || statusSaving.value) return
  statusSaving.value = true
  try {
    await salesLeadsStore.markLeadLost(lead.value.id, lostReason.value)
    showLostModal.value = false
    lostReason.value = ''
  } finally {
    statusSaving.value = false
  }
}

async function confirmDelete() {
  if (!lead.value || deleteSaving.value) return
  deleteSaving.value = true
  try {
    await salesLeadsStore.deleteSalesLead(lead.value.id)
    showDeleteConfirm.value = false
    await navigateTo(dashPath('/leads'))
  } finally {
    deleteSaving.value = false
  }
}
</script>

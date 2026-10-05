<template>
  <div class="ds-root s-c s-page">
    <SPageHeader
      :title="lead?.customerName || 'Sales lead'"
      :back="{ to: dashPath('/leads'), label: 'Sales leads' }"
    >
      <template #eyebrow>
        <nav class="s-breadcrumb" aria-label="Breadcrumb">
          <NuxtLink :to="dashPath('/leads')" class="s-breadcrumb__link">Sales leads</NuxtLink>
          <template v-if="lead">
            <ChevronRight class="s-breadcrumb__sep" :size="14" :stroke-width="2" aria-hidden="true" />
            <span>{{ lead.customerName }}</span>
          </template>
        </nav>
      </template>
      <template v-if="lead" #description>
        <span class="s-lead__summary">
          <SBadge :tone="leadStatusTone(lead.status)" size="sm">
            {{ SALES_LEAD_STATUS_LABELS[lead.status] }}
          </SBadge>
          <span>{{ lead.productName }}</span>
          <span v-if="lead.estimatedValue && lead.estimatedValue > 0">
            · Possible value {{ formatCurrency(lead.estimatedValue) }}
          </span>
        </span>
      </template>
      <template v-if="lead && canAccessLeads" #actions>
        <SButton v-if="canDeleteLead" variant="ghost" @click="showDeleteConfirm = true">
          <template #leading><Trash2 :size="16" :stroke-width="2" aria-hidden="true" /></template>
          Delete
        </SButton>
        <SButton v-if="isOpenLead" variant="secondary" @click="showEditModal = true">
          <template #leading><Pencil :size="16" :stroke-width="2" aria-hidden="true" /></template>
          Edit
        </SButton>
        <SButton v-if="isOpenLead" @click="openConvertModal(lead)">
          <template #leading><Receipt :size="16" :stroke-width="2" aria-hidden="true" /></template>
          Create sale
        </SButton>
      </template>
    </SPageHeader>

    <PlanGate
      v-if="!canAccessLeadsPlan"
      feature="sales_leads"
      description="Track interested customers, follow up, and turn them into sales."
    />

    <SCard v-else-if="!canAccessLeads">
      <SEmptyState
        title="You don't have access to sales leads"
        description="Ask your store owner to give you access."
      >
        <template #icon><Lock :size="24" :stroke-width="1.75" aria-hidden="true" /></template>
      </SEmptyState>
    </SCard>

    <div v-else-if="salesLeadsStore.detailLoading && !lead" class="s-lead__layout" aria-busy="true">
      <SCard>
        <div class="s-form">
          <SSkeleton width="40%" height="20px" />
          <SSkeleton width="70%" height="16px" />
          <SSkeleton width="55%" height="16px" />
        </div>
      </SCard>
      <SCard>
        <SSkeleton width="50%" height="16px" />
      </SCard>
    </div>

    <SCard v-else-if="!lead">
      <SEmptyState
        title="Lead not found"
        :description="salesLeadsStore.error || 'It may have been deleted.'"
      >
        <template #icon><SearchX :size="24" :stroke-width="1.75" aria-hidden="true" /></template>
        <template #actions>
          <SButton variant="secondary" :to="dashPath('/leads')">Back to leads</SButton>
        </template>
      </SEmptyState>
    </SCard>

    <div v-else class="s-lead__layout">
      <div class="s-lead__main">
        <SCard title="Details">
          <dl class="s-lead__facts">
            <div>
              <dt>Customer</dt>
              <dd>
                <span class="s-lead__fact-primary">{{ lead.customerName }}</span>
                <a v-if="lead.customerPhone" :href="`tel:${lead.customerPhone}`" class="s-link">
                  {{ lead.customerPhone }}
                </a>
                <a v-if="lead.customerEmail" :href="`mailto:${lead.customerEmail}`" class="s-link">
                  {{ lead.customerEmail }}
                </a>
              </dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>{{ SALES_LEAD_SOURCE_LABELS[lead.source] }}</dd>
            </div>
            <div v-if="lead.status === 'won'">
              <dt>Sale</dt>
              <dd>
                <NuxtLink
                  v-if="lead.receiptId"
                  :to="dashPath(`/receipts?highlight=${encodeURIComponent(lead.receiptId)}`)"
                  class="s-link"
                >
                  View receipt
                </NuxtLink>
                <span v-if="lead.wonRevenue">{{ formatCurrency(lead.wonRevenue) }}</span>
              </dd>
            </div>
            <div v-if="lead.status === 'lost' && lead.lostReason">
              <dt>Reason lost</dt>
              <dd>{{ lead.lostReason }}</dd>
            </div>
          </dl>
        </SCard>

        <SCard title="Follow-up">
          <div class="s-form">
            <div class="s-lead__controls">
              <SSelect
                v-if="isOpenLead"
                :model-value="selectedStatus"
                label="Status"
                :options="openStatusOptions"
                :disabled="statusSaving"
                @update:model-value="onWebStatusChange"
              />
              <SSelect
                :model-value="assignedToSelection"
                label="Assigned to"
                :options="assigneeOptions"
                :disabled="assignSaving"
                @update:model-value="onWebAssignChange"
              />
            </div>
            <div v-if="isOpenLead">
              <SButton variant="secondary" :disabled="statusSaving" @click="showLostModal = true">
                Mark as lost
              </SButton>
            </div>
          </div>
        </SCard>

        <SCard title="Notes">
          <form class="s-form" @submit.prevent="saveNote">
            <p v-if="lead.notes" class="s-lead__note">{{ lead.notes }}</p>
            <STextarea
              v-model="noteDraft"
              label="Add a note"
              :rows="3"
              :maxlength="500"
              placeholder="What did you talk about? When should you follow up?"
            />
            <div class="s-lead__form-end">
              <SButton variant="primary" type="submit" :loading="noteSaving" :disabled="!noteDraft.trim()">
                Save note
              </SButton>
            </div>
          </form>
        </SCard>
      </div>

      <SCard title="Activity" flush>
        <ul v-if="salesLeadsStore.events.length" class="s-list">
          <li v-for="event in salesLeadsStore.events" :key="event.id" class="s-list__item">
            <div class="s-list__main">
              <span class="s-lead__event">{{ event.description }}</span>
              <span class="s-list__secondary">{{ formatWhen(event.createdAt) }}</span>
            </div>
          </li>
        </ul>
        <p v-else class="s-lead__empty">No activity yet.</p>
      </SCard>
    </div>

    <EditLeadModal v-model="showEditModal" :lead="lead" />

    <CreateReceiptModal
      v-model="showReceiptModal"
      :prefill="receiptPrefill"
      @receipt-created="onReceiptCreated"
    />

    <SDialog
      v-model:open="showLostModal"
      title="Mark lead as lost"
      description="This closes the lead. You can still see it under Lost."
    >
      <form id="lead-lost-form" class="s-form" @submit.prevent="confirmLost">
        <SInput
          v-model="lostReason"
          label="Reason (optional)"
          :maxlength="200"
          placeholder="Price, timing, bought elsewhere…"
        />
      </form>
      <template #footer>
        <SButton variant="secondary" @click="showLostModal = false">Cancel</SButton>
        <SButton variant="primary" type="submit" form="lead-lost-form" :loading="statusSaving">Mark as lost</SButton>
      </template>
    </SDialog>

    <SDialog
      v-model:open="showDeleteConfirm"
      role="alertdialog"
      title="Delete this lead?"
      :description="`This removes ${lead?.customerName ?? 'this lead'} from your leads. This can't be undone.`"
    >
      <template #footer>
        <SButton variant="secondary" @click="showDeleteConfirm = false">Cancel</SButton>
        <SButton variant="danger" :loading="deleteSaving" @click="confirmDelete">Delete lead</SButton>
      </template>
    </SDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronRight, Lock, Pencil, Receipt, SearchX, Trash2 } from '@lucide/vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SDialog from '~/components/s/SDialog.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SInput from '~/components/s/SInput.vue'
import SPageHeader from '~/components/s/SPageHeader.vue'
import SSelect from '~/components/s/SSelect.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import STextarea from '~/components/s/STextarea.vue'
import CreateReceiptModal from '~/components/receipts/CreateReceiptModal.vue'
import PlanGate from '~/components/subscription/PlanGate.vue'
import EditLeadModal from '~/components/leads/EditLeadModal.vue'
import {
  useSalesLeadsStore,
  SALES_LEAD_SOURCE_LABELS,
  SALES_LEAD_STATUS_LABELS,
} from '~/stores/salesLeads'
import { useStaffStore } from '~/stores/staff'
import type { SalesLeadStatus } from '~/types/leads'
import { isOpenSalesLeadStatus } from '~/types/leads'
import { useConvertLeadToSale } from '~/composables/leads/useConvertLeadToSale'
import { leadStatusTone } from '~/utils/lead-status'
import { EMPTY_CELL } from '~/utils/ui-empty'

definePageMeta({
  layout: 'dashboard',
})

const route = useRoute()
const { dashPath } = useDashboardPaths()
const { formatCurrency } = usePreferences()
const { canUse: canUseSubscriptionFeature } = useSubscriptionFeatures()
const { can } = usePermissions()

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
const canAccessLeads = computed(() => canAccessLeadsPlan.value && can('leads', 'view'))
const isOpenLead = computed(() => (lead.value ? isOpenSalesLeadStatus(lead.value.status) : false))
const canDeleteLead = computed(() => can('leads', 'delete'))
const activeStaff = computed(() => staffStore.staff.filter((member) => member.status === 'active'))

const openStatuses: SalesLeadStatus[] = ['new', 'contacted', 'negotiating']
const openStatusOptions = openStatuses.map((status) => ({
  label: SALES_LEAD_STATUS_LABELS[status],
  value: status,
}))
const assigneeOptions = computed(() => [
  { label: 'Unassigned', value: '' },
  ...activeStaff.value.map((member) => ({
    label: `${member.firstName} ${member.lastName}`.trim(),
    value: member.id,
  })),
])
const { showReceiptModal, receiptPrefill, openConvertModal, onReceiptCreated } =
  useConvertLeadToSale()
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
  [leadId, canAccessLeads],
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

function onWebStatusChange(value: string | number | null | undefined) {
  selectedStatus.value = value as SalesLeadStatus
  void onStatusChange()
}

function onWebAssignChange(value: string | number | null | undefined) {
  assignedToSelection.value = String(value ?? '')
  void onAssignChange()
}

function formatWhen(v: Date | undefined) {
  if (!v) return EMPTY_CELL
  try {
    return v.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return EMPTY_CELL
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

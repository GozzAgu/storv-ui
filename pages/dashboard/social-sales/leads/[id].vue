<template>
  <div :class="[pageWithFixedFooterClass, 'dash-page--unified']">
    <DashboardPageHeader class="dash-page-header--unified">
      <template #eyebrow>
        <p :class="eyebrowClass">Social Sales · Lead</p>
      </template>
      <template #title>
        <h1 :class="pageTitleClass">{{ lead?.customerName ?? 'Lead details' }}</h1>
      </template>
      <template v-if="lead" #description>
        <div class="mt-1 flex flex-wrap items-center gap-2">
          <SocialLeadStatusBadge :status="lead.status" />
          <span :class="cardDescClass">{{ socialPlatformLabel(lead.platform) }}</span>
        </div>
      </template>
      <template v-if="lead && canConvert" #actions>
        <Button
          v-if="!lead.customerId"
          variant="secondary"
          size="sm"
          :extra-class="headerBtnClass"
          @click="showLinkModal = true"
        >
          Link customer
        </Button>
        <ConvertLeadToSaleButton @convert="openConvertToSale" />
      </template>
    </DashboardPageHeader>

    <div v-if="!canAccess" class="rounded-sm bg-red-50/90 px-4 py-4 dark:bg-red-950/25">
      <p class="text-xs font-medium text-red-800 dark:text-red-200">Sign in to view lead details.</p>
    </div>

    <PlanUpgradePrompt
      v-else-if="!canUseSubscriptionFeature('social_sales')"
      feature="social_sales"
      title="Social Sales is on Medium and Enterprise"
      description="Upgrade to view lead timelines and conversion actions."
      :title-class="pageTitleClass"
      :desc-class="cardDescClass"
    />

    <template v-else>
      <DashboardBackButton to="/dashboard/social-sales/leads" label="Back to leads" class="mb-2" />

      <div v-if="leadsStore.loading" class="space-y-3 p-4">
        <div v-for="i in 4" :key="i" class="h-12 animate-pulse rounded-sm bg-gray-200 dark:bg-white/10" />
      </div>

      <div v-else-if="!lead" :class="stateCardClass">
        <p :class="pageTitleClass">Lead not found</p>
        <p :class="cardDescClass">This lead may have been removed or the link is invalid.</p>
        <NuxtLink to="/dashboard/social-sales/leads" :class="linkClass">Return to leads</NuxtLink>
      </div>

      <div v-else class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <section :class="cardPaddedClass">
          <h2 :class="cardTitleClass">Contact & product</h2>
          <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt :class="cardDescClass">Customer</dt>
              <dd class="font-medium text-gray-900 dark:text-gray-100">{{ lead.customerName }}</dd>
            </div>
            <div v-if="lead.customerPhone">
              <dt :class="cardDescClass">Phone</dt>
              <dd>{{ lead.customerPhone }}</dd>
            </div>
            <div v-if="lead.whatsappNumber">
              <dt :class="cardDescClass">WhatsApp</dt>
              <dd>{{ lead.whatsappNumber }}</dd>
            </div>
            <div v-if="lead.instagramUsername">
              <dt :class="cardDescClass">Instagram</dt>
              <dd>{{ lead.instagramUsername }}</dd>
            </div>
            <div>
              <dt :class="cardDescClass">Platform</dt>
              <dd>{{ socialPlatformLabel(lead.platform) }}</dd>
            </div>
            <div>
              <dt :class="cardDescClass">Product</dt>
              <dd>{{ lead.productName }}</dd>
            </div>
            <div>
              <dt :class="cardDescClass">Estimated value</dt>
              <dd class="tabular-nums">{{ formatCurrency(lead.estimatedValue) }}</dd>
            </div>
            <div>
              <dt :class="cardDescClass">Assigned staff</dt>
              <dd>{{ lead.assignedToName || 'Unassigned' }}</dd>
            </div>
            <div v-if="lead.receiptId">
              <dt :class="cardDescClass">Sale receipt</dt>
              <dd>
                <NuxtLink to="/dashboard/receipts" :class="linkClass">
                  View sale in Sales
                </NuxtLink>
                <span v-if="lead.wonRevenue" class="ml-1 tabular-nums text-gray-600 dark:text-gray-400">
                  · {{ formatCurrency(lead.wonRevenue) }}
                </span>
              </dd>
            </div>
            <div v-if="lead.customerId">
              <dt :class="cardDescClass">Linked customer</dt>
              <dd>
                <NuxtLink to="/dashboard/customers" :class="linkClass">
                  {{ lead.customerName }}
                </NuxtLink>
              </dd>
            </div>
            <div v-else>
              <dt :class="cardDescClass">Customer link</dt>
              <dd>
                <button type="button" :class="linkClass" @click="showLinkModal = true">
                  Search & link existing customer
                </button>
              </dd>
            </div>
          </dl>

          <div v-if="lead.notes" class="mt-6 border-t border-gray-100 pt-4 dark:border-gray-800">
            <h3 :class="cardTitleClass">Notes</h3>
            <p class="mt-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
              {{ lead.notes }}
            </p>
          </div>

          <form class="mt-6 border-t border-gray-100 pt-4 dark:border-gray-800" @submit.prevent="submitNote">
            <label :class="cardDescClass" for="lead-note">Add business note</label>
            <p class="mb-2 text-[10px] text-gray-400">
              Business updates only — do not paste chat messages.
            </p>
            <textarea
              id="lead-note"
              v-model="noteDraft"
              rows="3"
              :class="[fieldClass, 'mt-1 w-full']"
              placeholder="e.g. Negotiating price, deposit received…"
            />
            <Button type="submit" variant="secondary" size="sm" class="mt-2" :disabled="!noteDraft.trim()">
              Save note
            </Button>
          </form>
        </section>

        <aside :class="cardPaddedClass">
          <h2 :class="cardTitleClass">Timeline</h2>
          <p :class="[cardDescClass, 'mb-4']">Manual updates and status changes</p>
          <SocialLeadTimeline v-if="events.length > 0" :events="events" />
          <p v-else-if="leadsStore.eventsLoading" :class="emptyClass">Loading timeline…</p>
          <p v-else :class="emptyClass">No timeline events yet.</p>

          <div class="mt-6 border-t border-gray-100 pt-4 dark:border-gray-800">
            <label :class="cardDescClass" for="lead-status">Update status</label>
            <select
              id="lead-status"
              v-model="statusDraft"
              :class="[fieldClass, 'mt-1 w-full']"
              @change="applyStatus"
            >
              <option v-for="s in SOCIAL_LEAD_STATUSES" :key="s.value" :value="s.value">
                {{ s.label }}
              </option>
            </select>
          </div>
        </aside>
      </div>
    </template>

    <SocialLeadCustomerLinkModal
      v-if="lead"
      v-model="showLinkModal"
      :lead-id="lead.id"
    />

    <CreateReceiptModal
      v-model="receiptModalOpen"
      :prefill="receiptPrefill"
      @receipt-created="handleReceiptCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Button from '~/components/ui/Button.vue'
import SocialLeadStatusBadge from '~/components/social-sales/SocialLeadStatusBadge.vue'
import SocialLeadTimeline from '~/components/social-sales/SocialLeadTimeline.vue'
import ConvertLeadToSaleButton from '~/components/social-sales/ConvertLeadToSaleButton.vue'
import SocialLeadCustomerLinkModal from '~/components/social-sales/SocialLeadCustomerLinkModal.vue'
import CreateReceiptModal from '~/components/receipts/CreateReceiptModal.vue'
import { useConvertLeadToSale } from '~/composables/social-sales/useConvertLeadToSale'
import PlanUpgradePrompt from '~/components/subscription/PlanUpgradePrompt.vue'
import { useSocialSalesLeadsStore } from '~/stores/social-sales/leads'
import { useStoresStore } from '~/stores/stores'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import {
  SOCIAL_LEAD_STATUSES,
  socialPlatformLabel,
  type SocialLeadStatus,
  isSocialLeadClosed,
} from '~/types/social-sales'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const leadId = computed(() => String(route.params.id ?? ''))

const { eyebrowClass, pageTitleClass, fieldClass, headerBtnClass, pageWithFixedFooterClass } =
  useDashboardPageChrome()
const { cardPaddedClass, cardTitleClass, cardDescClass, linkClass, emptyClass, stateCardClass } =
  useDashboardHomeChrome()

const leadsStore = useSocialSalesLeadsStore()
const storesStore = useStoresStore()
const authStore = useAuthStore()
const userStore = useUserStore()
const { formatCurrency } = usePreferences()
const { canUse: canUseSubscriptionFeature } = useSubscriptionFeatures()
const toast = useAppToast()

const canAccess = computed(() => !!authStore.currentUser)

const lead = computed(() => leadsStore.getLeadById(leadId.value))
const events = computed(() => leadsStore.getEventsForLead(leadId.value))

const noteDraft = ref('')
const statusDraft = ref<SocialLeadStatus>('new')
const showLinkModal = ref(false)

watch(
  lead,
  (l) => {
    if (l) statusDraft.value = l.status
  },
  { immediate: true }
)

const canConvert = computed(() => lead.value && !isSocialLeadClosed(lead.value.status))

const actorName = computed(
  () => userStore.userData?.name || userStore.userData?.email || 'Staff'
)

const {
  receiptModalOpen,
  receiptPrefill,
  convertLeadToSale,
  handleReceiptCreated,
} = useConvertLeadToSale(leadId, actorName)

function openConvertToSale() {
  if (!lead.value) return
  convertLeadToSale(lead.value)
}

async function submitNote() {
  if (!lead.value || !noteDraft.value.trim()) return
  await leadsStore.addLeadNote(leadId.value, noteDraft.value, actorName.value)
  noteDraft.value = ''
  toast.success('Note added')
}

async function applyStatus() {
  if (!lead.value || statusDraft.value === lead.value.status) return
  await leadsStore.updateLeadStatus(leadId.value, statusDraft.value, actorName.value)
  toast.success('Status updated')
}

watch(
  () => storesStore.currentStoreId,
  () => {
    if (storesStore.currentStoreId && canAccess.value) {
      leadsStore.fetchLeads(true)
    }
  }
)

onMounted(async () => {
  if (!canAccess.value) return
  if (storesStore.currentStoreId && leadsStore.leads.length === 0) {
    await leadsStore.fetchLeads(true)
  }
  if (leadId.value) {
    await leadsStore.fetchEventsForLead(leadId.value)
  }
})

watch(leadId, async (id) => {
  if (id) await leadsStore.fetchEventsForLead(id)
})

useHead({
  title: computed(() =>
    lead.value ? `${lead.value.customerName} · Social Sales` : 'Lead details · Social Sales'
  ),
})
</script>

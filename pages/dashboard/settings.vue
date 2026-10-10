<template>
  <div class="ds-root s-c s-page">
    <SPageHeader title="Settings">
      <template #description>
        Business details, plan, inventory defaults, and how sales are recorded.
      </template>
      <template v-if="!canEditSettings" #actions>
        <SBadge tone="warning" dot>View only</SBadge>
      </template>
    </SPageHeader>

    <STabs
      :model-value="activeSettingsTab"
      :tabs="settingsTabs"
      label="Settings sections"
      @update:model-value="onSettingsTabChange"
    />

    <div v-if="activeSettingsTab === 'account' && userStore.isSuperAdmin" class="s-settings">
      <SCard title="Company logo" description="Shown on receipts and branch cards. Your personal photo is on Profile.">
        <div class="s-settings__logo">
          <div class="s-settings__logo-frame">
            <img v-if="accountLogoUrl" :src="displayAccountLogoSrc" alt="Company logo" />
            <Store v-else :size="24" :stroke-width="1.75" aria-hidden="true" />
          </div>
          <div class="s-settings__logo-actions">
            <SButton
              variant="secondary"
              size="sm"
              :loading="isUploadingAccountLogo"
              :disabled="isUploadingAccountLogo"
              @click="accountLogoInput?.click()"
            >
              <template #leading><Upload :size="16" :stroke-width="2" aria-hidden="true" /></template>
              {{ accountLogoUrl ? 'Replace logo' : 'Upload logo' }}
            </SButton>
            <SButton v-if="accountLogoUrl" variant="ghost" size="sm" @click="removeAccountLogo">
              Remove
            </SButton>
            <input
              ref="accountLogoInput"
              type="file"
              accept="image/*"
              class="ds-sr-only"
              tabindex="-1"
              aria-hidden="true"
              @change="handleAccountLogoUpload"
            />
          </div>
        </div>
      </SCard>

      <SubscriptionPlanPanel
        :current-subscription-label="currentSubscriptionLabel"
        :billing-cycle-label="currentBillingCycleLabel"
        :current-price-label="currentPlanPriceLabel"
        :status-label="subscriptionStatusBadgeLabel"
        :status-tone="subscriptionStatusTone"
        :subscription-renewal-label="subscriptionRenewalLabel"
        v-model:selected-billing-cycle="selectedBillingCycle"
        v-model:selected-upgrade-plan="selectedUpgradePlan"
        :change-plan-options="changePlanOptions"
        :upgrade-price-preview="upgradePricePreview"
        :pricing-loading="pricingLoading"
        :can-cancel="canCancelSubscription"
        :disabled="!canEditSettings"
        :is-upgrading="isUpgradingSubscription"
        :is-canceling="isCancelingSubscription"
        :billing-history="billingHistory"
        :show-qa-plan-switcher="showQaPlanSwitcher"
        :qa-current-plan-id="storedSubscriptionPlan"
        :qa-switching="isQaSwitchingPlan"
        :add-ons-available="addOnsAvailable"
        :add-ons="addOnRows"
        :add-on-prices="addOnPriceLabels"
        :add-on-store-options="addOnStoreOptions"
        :add-on-busy="addOnBusy"
        @upgrade="handleUpgradeSubscription"
        @cancel="openCancelConfirm"
        @qa-set-plan="handleQaSetPlan"
        @buy-add-on="handleBuyAddOn"
        @cancel-add-on="handleCancelAddOn"
      />

      <SCard title="Workspace style" description="How much of the app to show. This doesn't change what you pay.">
        <ExperienceModePicker
          :model-value="selectedExperienceMode"
          :disabled="!canEditSettings || isSavingExperienceMode"
          @update:model-value="onExperienceModeChange"
        />
      </SCard>

      <SCard
        v-if="showProgressiveUnlockPanel"
        id="advanced-features"
        title="Advanced features"
        description="You chose a simple setup. Turn on team and multi-location tools when you need them. Your plan and role permissions still apply."
      >
        <div class="s-settings__rows">
          <div v-for="option in soloProgressiveUnlockOptions" :key="option.capability" class="s-settings__row">
            <SCheckbox
              :model-value="isProgressiveCapabilityEnabled(option.capability, enabledCapabilities)"
              variant="switch"
              :label="option.label"
              :description="option.description"
              :disabled="!canEditSettings || togglingProgressiveCapability === option.capability"
              @update:model-value="(checked: boolean) => onProgressiveCapabilityToggle(option.capability, checked)"
            />
          </div>
        </div>
      </SCard>

      <ScheduledBackupPanel />
      <CancelDataPolicyPanel />
      <InventoryAuditPanel />
    </div>

    <SCard
      v-else-if="activeSettingsTab === 'assignment' && isStaff"
      title="Your assignment"
      description="The branch and department linked to your account."
    >
      <SSkeleton v-if="isLoadingStoreInfo" :lines="3" />
      <dl v-else class="s-settings__facts">
        <div>
          <dt>Branch</dt>
          <dd>{{ storeInfo.name || EMPTY_CELL }}</dd>
        </div>
        <div>
          <dt>Department</dt>
          <dd>{{ staffWorkspace.departmentName || EMPTY_CELL }}</dd>
        </div>
        <div v-if="staffWorkspace.position">
          <dt>Position</dt>
          <dd>{{ staffWorkspace.position }}</dd>
        </div>
        <div v-if="staffWorkspace.staffRole">
          <dt>Team role</dt>
          <dd class="s-settings__capitalize">{{ staffWorkspace.staffRole }}</dd>
        </div>
      </dl>
    </SCard>

    <SCard
      v-else-if="activeSettingsTab === 'store-info'"
      :title="isStaff ? 'Branch details' : 'Store information'"
      :description="isStaff ? 'Contact details for your branch.' : 'Business details shown on receipts and invoices.'"
    >
      <template v-if="canEditSettings && !isEditingStore && !isLoadingStoreInfo" #actions>
        <SButton variant="secondary" size="sm" @click="enableEditing('store')">
          <template #leading><Pencil :size="16" :stroke-width="2" aria-hidden="true" /></template>
          Edit
        </SButton>
      </template>

      <SSkeleton v-if="isLoadingStoreInfo" :lines="4" />
      <form
        v-else
        id="settings-store-form"
        class="s-settings__grid"
        :class="{ 's-settings__grid--readonly': !isEditingStore }"
        @submit.prevent="saveStoreInfo"
      >
        <SInput
          v-model="storeInfo.name"
          label="Branch name"
          placeholder="Enter branch name"
          :readonly="!isEditingStore"
          :disabled="!canEditSettings"
        />
        <SInput
          v-model="storeInfo.businessType"
          label="Business type"
          placeholder="For example, perfume shop"
          :readonly="!isEditingStore"
          :disabled="!canEditSettings"
        />
        <SInput
          v-model="storeInfo.email"
          type="email"
          label="Email"
          placeholder="store@example.com"
          autocomplete="email"
          :readonly="!isEditingStore"
          :disabled="!canEditSettings"
        />
        <SInput
          v-model="storeInfo.phone"
          type="tel"
          label="Phone"
          placeholder="Enter phone number"
          autocomplete="tel"
          :readonly="!isEditingStore"
          :disabled="!canEditSettings"
        />
        <div class="s-settings__span">
          <STextarea
            v-model="storeInfo.address"
            label="Address"
            placeholder="Enter store address"
            :rows="2"
            :readonly="!isEditingStore"
            :disabled="!canEditSettings"
          />
        </div>
      </form>

      <template v-if="isEditingStore" #footer>
        <SButton variant="secondary" @click="cancelEditing('store')">Cancel</SButton>
        <SButton variant="primary" type="submit" form="settings-store-form">Save changes</SButton>
      </template>
    </SCard>

    <SCard
      v-else-if="activeSettingsTab === 'inventory'"
      title="Inventory"
      description="Stock alerts and defaults for new products."
    >
      <form id="settings-inventory-form" class="s-settings__rows" @submit.prevent="saveInventorySettings">
        <div class="s-settings__row">
          <div class="s-settings__row-text">
            <label class="s-settings__row-label" for="settings-low-stock">Low stock alert</label>
            <p class="s-settings__row-hint">Flag a product when its stock falls below this quantity.</p>
          </div>
          <div class="s-settings__control s-settings__control--narrow">
            <SInput
              id="settings-low-stock"
              v-model="inventorySettings.lowStockThreshold"
              type="number"
              inputmode="numeric"
              min="1"
              :disabled="!canEditSettings"
            >
              <template #suffix>units</template>
            </SInput>
          </div>
        </div>
        <div class="s-settings__row">
          <SCheckbox
            v-model="inventorySettings.autoReorder"
            variant="switch"
            label="Auto-reorder"
            description="Create purchase orders when stock is low."
            :disabled="!canEditSettings"
          />
        </div>
        <div class="s-settings__row">
          <div class="s-settings__row-text">
            <label class="s-settings__row-label" for="settings-default-category">Default category</label>
            <p class="s-settings__row-hint">Used for new products when no category is picked.</p>
          </div>
          <div class="s-settings__control">
            <SSelect
              id="settings-default-category"
              v-model="inventorySettings.defaultCategory"
              :options="defaultCategoryOptions"
              :disabled="!canEditSettings"
            />
          </div>
        </div>
      </form>
      <template v-if="canEditSettings" #footer>
        <SButton variant="primary" type="submit" form="settings-inventory-form">Save inventory settings</SButton>
      </template>
    </SCard>

    <StorefrontSettingsPanel
      v-else-if="activeSettingsTab === 'storefront'"
      :can-edit="canEditSettings && userStore.isSuperAdmin"
    />

    <template v-else-if="activeSettingsTab === 'payments'">
      <SCard
        title="Checkout payments"
        description="Payment methods staff can pick on new sales and balance payments."
      >
        <ul class="s-settings__chips" aria-label="Payment methods">
          <li v-for="(tender, index) in paymentTenders" :key="`${tender}-${index}`" class="s-settings__chip">
            {{ tender }}
            <button
              v-if="canEditSettings"
              type="button"
              class="s-settings__chip-remove"
              :aria-label="`Remove ${tender}`"
              @click="removePaymentTender(index)"
            >
              <X :size="14" :stroke-width="2" aria-hidden="true" />
            </button>
          </li>
        </ul>
        <form v-if="canEditSettings" class="s-settings__add" @submit.prevent="addPaymentTender">
          <SInput v-model="newPaymentTender" label="Add a method" placeholder="For example, OPay or Moniepoint" />
          <SButton type="submit" variant="secondary" :disabled="!newPaymentTender.trim()">
            <template #leading><Plus :size="16" :stroke-width="2" aria-hidden="true" /></template>
            Add
          </SButton>
        </form>
        <template v-if="canEditSettings" #footer>
          <SButton variant="ghost" @click="resetPaymentTendersToDefault">Reset to defaults</SButton>
          <SButton variant="primary" @click="savePaymentSettings">Save payment methods</SButton>
        </template>
      </SCard>
      <PaymentsV2SettingsCard :tenders="paymentTenders" />
    </template>

    <SCard
      v-else-if="activeSettingsTab === 'sales-receipts'"
      title="Sales & receipts"
      description="Receipt numbering and printing."
    >
      <form id="settings-receipt-form" class="s-settings__rows" @submit.prevent="saveReceiptSettings">
        <div class="s-settings__row">
          <div class="s-settings__row-text">
            <label class="s-settings__row-label" for="settings-receipt-prefix">Receipt prefix</label>
            <p class="s-settings__row-hint">Added before every receipt number, for example REC-.</p>
          </div>
          <div class="s-settings__control s-settings__control--narrow">
            <SInput
              id="settings-receipt-prefix"
              v-model="receiptSettings.prefix"
              placeholder="REC-"
              :disabled="!canEditSettings"
            />
          </div>
        </div>
        <div class="s-settings__row">
          <div class="s-settings__row-text">
            <label class="s-settings__row-label" for="settings-receipt-next">Next receipt number</label>
            <p class="s-settings__row-hint">The number the next sale will use.</p>
          </div>
          <div class="s-settings__control s-settings__control--narrow">
            <SInput
              id="settings-receipt-next"
              v-model="receiptSettings.nextNumber"
              type="number"
              inputmode="numeric"
              min="1"
              :disabled="!canEditSettings"
            />
          </div>
        </div>
        <div class="s-settings__row">
          <SCheckbox
            v-model="receiptSettings.autoPrint"
            variant="switch"
            label="Print receipts automatically"
            description="Open the print dialog as soon as a sale is completed."
            :disabled="!canEditSettings"
          />
        </div>
      </form>
      <template v-if="canEditSettings" #footer>
        <SButton variant="primary" type="submit" form="settings-receipt-form">Save receipt settings</SButton>
      </template>
    </SCard>

    <SCard
      v-else-if="activeSettingsTab === 'data-export' && !isStaff"
      title="Data export"
      description="Download Excel backups of this branch. Large stores may take a moment to gather."
    >
      <ul class="s-settings__exports">
        <li v-for="item in dataExportItems" :key="item.key">
          <FileSpreadsheet :size="20" :stroke-width="1.75" aria-hidden="true" />
          <div>
            <p class="s-settings__row-label">{{ item.label }}</p>
            <p class="s-settings__row-hint">{{ item.description }}</p>
          </div>
        </li>
      </ul>
      <template #footer>
        <p v-if="dataExportStatus" class="s-settings__status" role="status">{{ dataExportStatus }}</p>
        <SButton variant="primary" :loading="dataExporting" :disabled="dataExporting" @click="handleExportAllStoreData">
          <template #leading><Download :size="16" :stroke-width="2" aria-hidden="true" /></template>
          {{ dataExporting ? 'Exporting…' : 'Export all to Excel' }}
        </SButton>
      </template>
    </SCard>

    <SDialog
      v-model:open="cancelConfirmOpen"
      role="alertdialog"
      title="Cancel auto-renew?"
      :description="cancelConfirmSubtitle"
    >
      <p class="s-settings__dialog-text">
        Paystack will stop charging on your next billing date. You keep {{ currentSubscriptionLabel }} until
        {{ cancelGraceEndLabel || 'the end of your current billing period' }}, then your account moves to
        Storvv Micro.
      </p>
      <template #footer>
        <SButton variant="secondary" @click="cancelConfirmOpen = false">Keep auto-renew</SButton>
        <SButton variant="danger" @click="proceedCancelSubscription">Cancel auto-renew</SButton>
      </template>
    </SDialog>
  </div>

  <TotpConfirmModal
    v-model="totpModalOpen"
    :title="totpModalTitle"
    :description="totpModalDescription"
    @confirm="confirmTotp"
    @cancel="cancelTotp"
  />
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useUser } from '~/composables/useUser'
import { useFirestore } from '~/composables/useFirestore'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useStoresStore } from '~/stores/stores'
import { useInventoryStore } from '~/stores/inventory'
import { useAppToast } from '~/composables/useAppToast'
import StorefrontSettingsPanel from '~/components/dashboard/StorefrontSettingsPanel.vue'
import PaymentsV2SettingsCard from '~/components/payments/PaymentsV2SettingsCard.vue'
import { Download, FileSpreadsheet, Pencil, Plus, Store, Upload, X } from '@lucide/vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SCheckbox from '~/components/s/SCheckbox.vue'
import SDialog from '~/components/s/SDialog.vue'
import SInput from '~/components/s/SInput.vue'
import SPageHeader from '~/components/s/SPageHeader.vue'
import SSelect from '~/components/s/SSelect.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import STabs from '~/components/s/STabs.vue'
import STextarea from '~/components/s/STextarea.vue'
import CancelDataPolicyPanel from '~/components/growth/CancelDataPolicyPanel.vue'
import InventoryAuditPanel from '~/components/growth/InventoryAuditPanel.vue'
import ScheduledBackupPanel from '~/components/growth/ScheduledBackupPanel.vue'
import { EMPTY_CELL } from '~/utils/ui-empty'
import { isStorefrontDashboardHidden } from '~/utils/storefront-launch'
import { collection, query, where, getDocs } from 'firebase/firestore'
import {
  ADD_ON_ELIGIBLE_PLAN,
  formatNaira,
  getLiveSubscriptionAddOns,
  SUBSCRIPTION_ADD_ON_LABELS,
  SUBSCRIPTION_PLANS,
  type SubscriptionAddOnKind,
  type SubscriptionPlan,
  resolveEffectiveSubscriptionPlan,
  normalizeSubscriptionPlan,
} from '~/types/subscription'
import {
  BILLING_CYCLE_LABELS,
  type SubscriptionBillingCycle,
} from '~/types/subscription-billing'
import {
  initializePaystackSubscription,
  type PaystackInitializeFetcher,
} from '~/utils/paystack-upgrade'
import {
  cancelPaystackSubscription,
  type PaystackCancelFetcher,
} from '~/utils/paystack-cancel-subscription'
import {
  canShowDevPlanSwitcher,
  getChangeablePaidPlans,
} from '~/utils/subscription-plan-switcher'
import { isDemoModeActive } from '~/utils/demo-mode'
import SubscriptionPlanPanel from '~/components/settings/SubscriptionPlanPanel.vue'
import ExperienceModePicker from '~/components/settings/ExperienceModePicker.vue'
import type { BillingHistoryEntry } from '~/server/api/paystack/billing-history.get'
import {
  subscriptionStatusLabel,
} from '~/utils/subscription-billing-ui'
import { formatUpgradeSuccessMessage } from '~/utils/subscription-upgrade-unlocks'
import { scrollDashboardToElement } from '~/utils/native-dashboard-scroll'
import type { ExperienceMode } from '~/types/business-experience'
import { normalizeExperienceMode } from '~/types/business-experience'
import { getEffectiveApiBase } from '~/utils/capacitor-api-base'
import TotpConfirmModal from '~/components/security/TotpConfirmModal.vue'
import { useTotpConfirmModal } from '~/composables/useTotpConfirmModal'
import { resolveTotpForSensitiveAction } from '~/utils/security-api-errors'
import {
  BILLING_BLOCKED_USER_MESSAGE,
  extractUploadFailureMessage,
  isBillingDelinquentMessage,
} from '~/utils/storage-billing-errors'
import { isCloudinaryUrl, optimizeCloudinaryLogo } from '~/utils/cloudinary'
import { prepareImageUpload } from '~/utils/image-upload'
import {
  resolveStaffWorkspaceContext,
  applyWorkspaceToSettingsStoreInfo,
  fillSettingsStoreInfoFromStore,
  type StaffWorkspaceContext,
} from '~/composables/useStaffWorkspaceContext'
import { DEFAULT_PAYMENT_TENDERS, normalizePaymentTenderList } from '~/utils/payment-tenders'
import { useStoreDataExport } from '~/composables/useStoreDataExport'
import { useProductAnalytics } from '~/composables/useProductAnalytics'
import { useFunnelAnalytics } from '~/composables/useFunnelAnalytics'
import { openChurnSurveyModal } from '~/composables/growth-prompts-state'
import { useBackupPreferences } from '~/composables/useBackupPreferences'
import { useSensitiveAction } from '~/composables/useSensitiveAction'
import {
  applyEnabledCapabilitiesToStoreDetails,
  getProgressiveUnlockOptionsForPlan,
  isProgressiveCapabilityEnabled,
  isProgressiveUnlockAvailableForPlan,
  setProgressiveCapabilityEnabled,
} from '~/utils/business-experience-settings'

type AccountLogoUploadResult = { url: string; path: string }

definePageMeta({
  layout: 'dashboard',
})

useHead({
  title: 'Settings - Storvv',
})

const { dashPath } = useDashboardPaths()


// Store information
const storeInfo = reactive({
  name: '',
  businessType: '',
  email: '',
  phone: '',
  address: '',
})

const backupStoreInfo = reactive({ ...storeInfo })
const isEditingStore = ref(false)
const isLoadingStoreInfo = ref(true)

// Get user data and load store info
const { currentUser } = useFirebaseAuth()
const { getUserDocument, updateStoreDetails, updateUserDocument } = useUser()
const { getFirestoreInstance } = useFirestore()
const userStore = useUserStore()
const storesStore = useStoresStore()
const authStore = useAuthStore()
const { authFetch, getAuthHeaders } = useAuthenticatedFetch()
const inventoryStore = useInventoryStore()
const toast = useAppToast()

const { isSoloExperience, enabledCapabilities } = useBusinessCapabilities()
const effectiveSubscriptionPlan = computed(() =>
  resolveEffectiveSubscriptionPlan(userStore.userData)
)
const soloProgressiveUnlockOptions = computed(() =>
  getProgressiveUnlockOptionsForPlan(effectiveSubscriptionPlan.value)
)
const showProgressiveUnlockPanel = computed(
  () =>
    userStore.isSuperAdmin &&
    isSoloExperience.value &&
    soloProgressiveUnlockOptions.value.length > 0
)
const togglingProgressiveCapability = ref<BusinessCapability | null>(null)

const {
  exporting: dataExporting,
  exportStatus: dataExportStatus,
  exportAllStoreData,
} = useStoreDataExport()

const dataExportItems = [
  {
    key: 'inventory',
    label: 'Inventory',
    description: 'ZIP archive - one folder per category with items.xlsx inside.',
  },
  {
    key: 'receipts',
    label: 'Sales',
    description: 'Sales with line items, totals, and payment status.',
  },
  {
    key: 'buybacks',
    label: 'Customer buybacks',
    description: 'Items bought from customers, prices, and payment method.',
  },
  {
    key: 'stock-loans',
    label: 'Stock loans',
    description: 'Loaned inventory with borrower details and item lines.',
  },
] as const

const { confirm: confirmSensitive } = useSensitiveAction()

async function handleExportAllStoreData() {
  if (!(await confirmSensitive('export-data'))) return
  try {
    const summary = await exportAllStoreData()
    toast.success(
      `Exported: inventory ZIP (${summary.inventory.folders} categories, ${summary.inventory.items} product(s)), ${summary.receipts.count} sale(s), ${summary.buybacks.count} buyback(s), ${summary.stockLoans.count} stock loan(s).`
    )
    await markBackupExported()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Export failed'
    toast.error(message)
  }
}
const {
  loadPricing,
  formatUpgradePrice,
  formatPlanPrice,
  getAddOnAmountKobo,
  pricingLoading,
} = useSubscriptionPlanPricing()
const { syncSubscriptionStatus } = useSubscriptionBillingUi()
const route = useRoute()

// Check if user is super admin (only super admins can edit settings)
const canEditSettings = computed(() => {
  return userStore.isSuperAdmin
})

// Subscription
const currentSubscription = computed<SubscriptionPlan>(() => {
  return resolveEffectiveSubscriptionPlan(userStore.userData)
})
const currentSubscriptionLabel = computed(() => {
  return SUBSCRIPTION_PLANS.find((p) => p.id === currentSubscription.value)?.name || 'Storvv Micro'
})

/** Stored plan (not grace-effective), used for Paystack change-plan targets. */
const storedSubscriptionPlan = computed(() =>
  normalizeSubscriptionPlan(userStore.userData?.subscription)
)

const changePlanOptions = computed(() => getChangeablePaidPlans(storedSubscriptionPlan.value))

const billingHistory = ref<BillingHistoryEntry[]>([])
const cancelConfirmOpen = ref(false)
const isSavingExperienceMode = ref(false)
const selectedExperienceMode = ref<ExperienceMode>(
  normalizeExperienceMode(userStore.userData?.storeDetails?.experienceMode)
)

watch(
  () => userStore.userData?.storeDetails?.experienceMode,
  (mode) => {
    selectedExperienceMode.value = normalizeExperienceMode(mode)
  }
)

const currentBillingCycleLabel = computed(() => {
  const cycle = userStore.userData?.subscriptionBillingCycle
  return cycle ? BILLING_CYCLE_LABELS[cycle] : null
})

const currentPlanPriceLabel = computed(() => {
  const cycle = userStore.userData?.subscriptionBillingCycle || 'monthly'
  return formatPlanPrice(currentSubscription.value, cycle)
})

const subscriptionStatusBadgeLabel = computed(() =>
  subscriptionStatusLabel(
    userStore.userData?.subscriptionStatus,
    normalizeSubscriptionPlan(userStore.userData?.subscription),
    resolveEffectiveSubscriptionPlan(userStore.userData)
  )
)

const subscriptionStatusTone = computed(() => {
  const status = userStore.userData?.subscriptionStatus
  if (status === 'past_due') return 'error'
  if (status === 'canceled') return 'warning'
  if (currentSubscription.value === 'storvv_micro') return 'neutral'
  return 'success'
})

const upgradePricePreview = computed(() => {
  if (!selectedUpgradePlan.value) return null
  return formatUpgradePrice(selectedUpgradePlan.value, selectedBillingCycle.value)
})

const cancelGraceEndLabel = computed(() => {
  const iso = userStore.userData?.subscriptionCurrentPeriodEnd
  if (!iso) return null
  const date = new Date(iso)
  if (!Number.isFinite(date.getTime())) return null
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
})

const cancelConfirmSubtitle = computed(() =>
  cancelGraceEndLabel.value
    ? `Access continues until ${cancelGraceEndLabel.value}`
    : 'Your paid period will remain active until it ends'
)

const selectedUpgradePlan = ref<SubscriptionPlan | ''>('')
const selectedBillingCycle = ref<SubscriptionBillingCycle>('monthly')
const isUpgradingSubscription = ref(false)
const isQaSwitchingPlan = ref(false)

const showQaPlanSwitcher = computed(() =>
  canShowDevPlanSwitcher({
    isDemo: isDemoModeActive(),
  })
)

watch(
  changePlanOptions,
  (options) => {
    if (options.length === 0) {
      selectedUpgradePlan.value = ''
      return
    }
    const selectionStillValid = options.some((plan) => plan.id === selectedUpgradePlan.value)
    if (!selectedUpgradePlan.value || !selectionStillValid) {
      selectedUpgradePlan.value = options[0].id
    }
  },
  { immediate: true }
)

const subscriptionRenewalLabel = computed(() => {
  const status = userStore.userData?.subscriptionStatus
  const cycle = userStore.userData?.subscriptionBillingCycle
  const periodEnd = userStore.userData?.subscriptionCurrentPeriodEnd
  if (!cycle || currentSubscription.value === 'storvv_micro') return null

  const cycleLabel = BILLING_CYCLE_LABELS[cycle].toLowerCase()
  if (status === 'past_due') {
    return 'Last renewal failed. Update your card or switch plan below.'
  }
  if (status === 'canceled') {
    if (periodEnd) {
      const formatted = new Date(periodEnd).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
      return `Auto-renew off · access until ${formatted}`
    }
    return 'Auto-renew off · pick a plan below to subscribe again'
  }
  if (periodEnd) {
    const formatted = new Date(periodEnd).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    return `Next charge · ${formatted}`
  }
  if (status === 'active') {
    return `Renews ${cycleLabel}`
  }
  return null
})

const canCancelSubscription = computed(() => {
  if (!canEditSettings.value) return false
  if (currentSubscription.value === 'storvv_micro') return false
  return userStore.userData?.subscriptionStatus !== 'canceled'
})

const isCancelingSubscription = ref(false)
const totpModalTitle = ref('Confirm upgrade')
const totpModalDescription = ref('Enter your authenticator code to start the subscription upgrade.')
const {
  open: totpModalOpen,
  prompt: promptTotp,
  confirm: confirmTotp,
  cancel: cancelTotp,
} = useTotpConfirmModal()

const { trackEvent } = useProductAnalytics()
const { recordMilestone } = useFunnelAnalytics()
const { markBackupExported } = useBackupPreferences()

const handleUpgradeSubscription = async () => {
  if (!canEditSettings.value) {
    toast.error('Only super admins can change subscription')
    return
  }
  if (!currentUser.value) {
    toast.error('You must be signed in to change your plan')
    return
  }
  if (!selectedUpgradePlan.value) return

  const direction =
    changePlanOptions.value.find((p) => p.id === selectedUpgradePlan.value)?.direction || 'upgrade'

  trackEvent('upgrade_started', {
    plan: selectedUpgradePlan.value,
    billing_cycle: selectedBillingCycle.value,
    direction,
  })

  totpModalTitle.value = direction === 'downgrade' ? 'Confirm downgrade' : 'Confirm plan change'
  totpModalDescription.value =
    direction === 'downgrade'
      ? 'Enter your authenticator code to switch to a lower paid plan via Paystack.'
      : 'Enter your authenticator code to start the subscription checkout.'
  isUpgradingSubscription.value = true
  try {
    const totpCode = await resolveTotpForSensitiveAction(promptTotp)
    const headers = await getAuthHeaders()
    const result = await initializePaystackSubscription(
      {
        planId: selectedUpgradePlan.value,
        email: currentUser.value.email || '',
        userId: currentUser.value.uid,
        billingCycle: selectedBillingCycle.value,
        totpCode,
      },
      $fetch as PaystackInitializeFetcher,
      getEffectiveApiBase() || undefined,
      headers
    )
    if (result.ok) {
      window.location.href = result.authorizationUrl
      return
    }
    toast.error(result.message)
  } finally {
    isUpgradingSubscription.value = false
  }
}

async function handleQaSetPlan(planId: SubscriptionPlan) {
  if (!showQaPlanSwitcher.value || !canEditSettings.value) return
  isQaSwitchingPlan.value = true
  try {
    if (isDemoModeActive()) {
      const { applyDemoSubscriptionPlan } = await import('~/utils/demo-bridge')
      applyDemoSubscriptionPlan(planId)
      await storesStore.applyPlanToCurrentStoreSelection()
      toast.success(`Demo plan set to ${SUBSCRIPTION_PLANS.find((p) => p.id === planId)?.name}`)
      return
    }

    const headers = await getAuthHeaders()
    await $fetch('/api/dev/set-subscription', {
      method: 'POST',
      headers,
      body: { planId, billingCycle: selectedBillingCycle.value || 'monthly' },
      baseURL: getEffectiveApiBase() || undefined,
    })
    if (currentUser.value) {
      await userStore.fetchUserData(currentUser.value.uid)
    }
    await storesStore.applyPlanToCurrentStoreSelection()
    toast.success(`Plan set to ${SUBSCRIPTION_PLANS.find((p) => p.id === planId)?.name}`)
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string }
    toast.error(e?.data?.message || e?.message || 'Could not switch plan')
  } finally {
    isQaSwitchingPlan.value = false
  }
}

const addOnBusy = ref<string | null>(null)

const addOnsAvailable = computed(
  () => canEditSettings.value && currentSubscription.value === ADD_ON_ELIGIBLE_PLAN
)

const addOnPriceLabels = computed(() => ({
  store: formatNaira(getAddOnAmountKobo('store') / 100),
  staff: formatNaira(getAddOnAmountKobo('staff') / 100),
}))

const addOnStoreOptions = computed(() =>
  storesStore.stores.map((store) => ({ value: store.id, label: store.name || 'Unnamed store' }))
)

const addOnRows = computed(() =>
  getLiveSubscriptionAddOns(userStore.userData?.subscriptionAddOns).map((addOn) => {
    const storeName = addOn.storeId ? storesStore.getStoreById(addOn.storeId)?.name : null
    const label =
      addOn.kind === 'staff'
        ? `Staff seat · ${storeName || 'Removed store'}`
        : SUBSCRIPTION_ADD_ON_LABELS.store
    let detail = `${addOnPriceLabels.value[addOn.kind]} / month · renews monthly`
    if (addOn.status === 'past_due') detail = 'Payment failed · Paystack will retry your card'
    if (addOn.status === 'canceled' && addOn.endsAt) {
      detail = `Removed · available until ${new Date(addOn.endsAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`
    }
    return { id: addOn.id, label, detail, canCancel: addOn.status !== 'canceled' }
  })
)

function apiErrorMessage(err: unknown, fallback: string): string {
  const e = err as { data?: { message?: string }; message?: string }
  return e?.data?.message || e?.message || fallback
}

async function handleBuyAddOn(kind: SubscriptionAddOnKind, storeId?: string) {
  if (!addOnsAvailable.value || !currentUser.value) return
  totpModalTitle.value = kind === 'store' ? 'Add a store' : 'Add a staff seat'
  totpModalDescription.value = `Enter your authenticator code to continue to Paystack. ${addOnPriceLabels.value[kind]} / month, billed separately from your plan.`
  addOnBusy.value = kind
  try {
    const totpCode = await resolveTotpForSensitiveAction(promptTotp)
    const headers = await getAuthHeaders()
    const result = await $fetch<{ authorization_url?: string }>('/api/paystack/addons/initialize', {
      method: 'POST',
      headers,
      body: { kind, storeId, totpCode },
      baseURL: getEffectiveApiBase() || undefined,
    })
    if (result.authorization_url) {
      trackEvent('addon_checkout_started', { kind })
      window.location.href = result.authorization_url
      return
    }
    toast.error('Could not start checkout')
  } catch (err: unknown) {
    toast.error(apiErrorMessage(err, 'Could not start checkout'))
  } finally {
    addOnBusy.value = null
  }
}

async function handleCancelAddOn(addOnId: string) {
  if (!canEditSettings.value || !currentUser.value) return
  totpModalTitle.value = 'Remove add-on'
  totpModalDescription.value =
    'Enter your authenticator code to stop this add-on. It stays available until the end of the month you paid for.'
  addOnBusy.value = addOnId
  try {
    const totpCode = await resolveTotpForSensitiveAction(promptTotp)
    const headers = await getAuthHeaders()
    const result = await $fetch<{ endsAt?: string | null }>('/api/paystack/addons/cancel', {
      method: 'POST',
      headers,
      body: { addOnId, totpCode },
      baseURL: getEffectiveApiBase() || undefined,
    })
    await userStore.fetchUserData(currentUser.value.uid)
    toast.success(
      result.endsAt
        ? `Add-on removed. You can keep using it until ${new Date(result.endsAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}.`
        : 'Add-on removed.'
    )
  } catch (err: unknown) {
    toast.error(apiErrorMessage(err, 'Could not remove add-on'))
  } finally {
    addOnBusy.value = null
  }
}

async function loadBillingHistory() {
  if (!canEditSettings.value) return
  try {
    const data = (await authFetch('/api/paystack/billing-history')) as {
      entries?: BillingHistoryEntry[]
    }
    billingHistory.value = data.entries || []
  } catch {
    billingHistory.value = []
  }
}

function openCancelConfirm() {
  if (!canCancelSubscription.value) return
  cancelConfirmOpen.value = true
}

async function proceedCancelSubscription() {
  cancelConfirmOpen.value = false
  await handleCancelSubscription()
}

async function onExperienceModeChange(mode: ExperienceMode) {
  if (!currentUser.value || !canEditSettings.value) return
  if (mode === selectedExperienceMode.value) return

  isSavingExperienceMode.value = true
  try {
    const targetUserId = await getTargetUserId()
    if (!targetUserId) return
    const userData = await getUserDocument(targetUserId)
    const currentStoreDetails = userData?.storeDetails
    if (!currentStoreDetails?.storeName) {
      toast.error('Store details are missing. Complete store setup first.')
      selectedExperienceMode.value = normalizeExperienceMode(currentStoreDetails?.experienceMode)
      return
    }

    await updateUserDocument(targetUserId, {
      storeDetails: {
        ...currentStoreDetails,
        experienceMode: mode,
        onboardingExperienceChosen: true,
      },
    })
    selectedExperienceMode.value = mode
    await userStore.fetchUserData(currentUser.value.uid)
    toast.success(mode === 'solo' ? 'Switched to simple workspace' : 'Switched to full workspace')
  } catch (error: unknown) {
    toast.error(error instanceof Error ? error.message : 'Could not update workspace style')
    selectedExperienceMode.value = normalizeExperienceMode(userStore.userData?.storeDetails?.experienceMode)
  } finally {
    isSavingExperienceMode.value = false
  }
}

const handleCancelSubscription = async () => {
  if (!canCancelSubscription.value) return
  if (!currentUser.value) {
    toast.error('You must be signed in to cancel')
    return
  }

  totpModalTitle.value = 'Cancel auto-renew'
  totpModalDescription.value =
    'Enter your authenticator code to stop future Paystack charges. Your current plan stays active until the billing period ends.'

  isCancelingSubscription.value = true
  try {
    const totpCode = await resolveTotpForSensitiveAction(promptTotp)
    if (!totpCode) return

    const headers = await getAuthHeaders()
    const result = await cancelPaystackSubscription(
      { totpCode },
      $fetch as PaystackCancelFetcher,
      getEffectiveApiBase() || undefined,
      headers
    )

    if (!result.ok) {
      toast.error(result.message)
      return
    }

    await userStore.fetchUserData(currentUser.value.uid)

    if (result.subscriptionCurrentPeriodEnd) {
      const formatted = new Date(result.subscriptionCurrentPeriodEnd).toLocaleDateString(
        undefined,
        { month: 'short', day: 'numeric', year: 'numeric' }
      )
      toast.success(`Auto-renew canceled. Your plan stays active until ${formatted}.`)
    } else {
      toast.success('Auto-renew canceled.')
    }

    await recordMilestone('subscriptionCanceledAt', {
      plan: currentSubscription.value,
      grace_end: result.subscriptionCurrentPeriodEnd,
    })
    openChurnSurveyModal()
  } finally {
    isCancelingSubscription.value = false
  }
}

const isStaff = computed(() => userStore.userData?.role === 'staff')

const settingsTabs = computed(() => {
  const tabs: Array<{ value: string; label: string }> = []
  if (userStore.isSuperAdmin) tabs.push({ value: 'account', label: 'Account & workspace' })
  if (isStaff.value) tabs.push({ value: 'assignment', label: 'Your assignment' })
  tabs.push({ value: 'store-info', label: isStaff.value ? 'Branch details' : 'Store information' })
  tabs.push({ value: 'inventory', label: 'Inventory' })
  if (userStore.isSuperAdmin && !isStorefrontDashboardHidden()) {
    tabs.push({ value: 'storefront', label: 'Storefront' })
  }
  tabs.push({ value: 'payments', label: 'Checkout payments' })
  tabs.push({ value: 'sales-receipts', label: 'Sales & receipts' })
  if (!isStaff.value) tabs.push({ value: 'data-export', label: 'Data export' })
  return tabs
})

const activeSettingsTab = ref(settingsTabs.value[0]?.value ?? 'account')
// Role/plan data (userStore.isSuperAdmin, isStaff) can still be loading when this component is
// set up, so the very first computed tab list may be missing "Account & workspace"/"Your
// assignment". keep snapping to the first tab until the user actually picks one themselves,
// not just until the current value happens to still be valid.
let hasPickedSettingsTab = false

watch(
  settingsTabs,
  (tabs) => {
    if (!hasPickedSettingsTab || !tabs.some((tab) => tab.value === activeSettingsTab.value)) {
      activeSettingsTab.value = tabs[0]?.value ?? 'account'
    }
  },
  { immediate: true }
)

function onSettingsTabChange(value: string) {
  hasPickedSettingsTab = true
  activeSettingsTab.value = value
}

const staffWorkspace = ref<StaffWorkspaceContext>({
  staff: null,
  store: null,
  storeName: '',
  storeEmail: '',
  storePhone: '',
  storeAddress: '',
  businessType: '',
  departmentName: '',
  departmentId: '',
  staffRole: '',
  position: '',
})

const accountLogoInput = ref<HTMLInputElement | null>(null)
const isUploadingAccountLogo = ref(false)

const accountLogoUrl = computed(() => userStore.userData?.storeLogoUrl || '')
const displayAccountLogoSrc = computed(() => optimizeCloudinaryLogo(accountLogoUrl.value))

function isFirebaseStorageUnknown(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === 'storage/unknown'
  )
}

/**
 * When Cloudinary env is set, upload there (no Firebase Storage / billing required for logos).
 * Otherwise: Firebase client → server Admin fallback.
 */
async function uploadAccountLogoWithFallback(
  file: File,
  userId: string
): Promise<{ url: string; path: string }> {
  const cloudinary = useCloudinary()
  if (cloudinary.isConfigured.value) {
    const { url } = await cloudinary.uploadImage(file)
    if (import.meta.dev) console.info('[Account logo] Uploaded via Cloudinary')
    return { url, path: '' }
  }

  const { uploadImage } = useFirebaseStorage()
  try {
    return await uploadImage(file, userId, { folder: 'account-logo' })
  } catch (err) {
    if (!isFirebaseStorageUnknown(err)) throw err
    if (import.meta.dev) {
      console.warn('[Account logo] Browser Storage upload failed; retrying via server…', err)
    }
    const body = new FormData()
    body.append('file', file)
    try {
      return await authFetch<AccountLogoUploadResult>('/api/storage/upload-account-logo', {
        method: 'POST',
        body,
      })
    } catch (apiErr: unknown) {
      const serverHint = extractUploadFailureMessage(apiErr)
      if (isBillingDelinquentMessage(serverHint)) {
        throw new Error(BILLING_BLOCKED_USER_MESSAGE)
      }
      throw new Error(
        `Could not complete upload (${serverHint}). Please try again or contact Storvv support if this continues.`
      )
    }
  }
}

const handleAccountLogoUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !authStore.currentUser || !userStore.isSuperAdmin) return

  isUploadingAccountLogo.value = true
  input.value = ''

  try {
    const userId = authStore.currentUser.uid
    const logo = await prepareImageUpload(file, { maxEdge: 512, name: 'logo' })
    const { url } = await uploadAccountLogoWithFallback(logo, userId)

    await updateUserDocument(userId, { storeLogoUrl: url })
    userStore.$patch((state) => {
      if (state.userData) state.userData = { ...state.userData, storeLogoUrl: url }
    })
    await storesStore.updateAllStoresLogo(url)
    toast.success('Company logo updated for all stores')
  } catch (err: unknown) {
    if (import.meta.dev) console.error('[Company logo upload]', err)
    const { getFirebaseStorageErrorMessage } = useFirebaseStorage()
    const msg = err instanceof Error ? err.message : getFirebaseStorageErrorMessage(err)
    toast.error(msg)
  } finally {
    isUploadingAccountLogo.value = false
  }
}

const removeAccountLogo = async () => {
  if (!authStore.currentUser || !userStore.isSuperAdmin) return

  const currentLogoUrl = accountLogoUrl.value
  try {
    if (currentLogoUrl && !isCloudinaryUrl(currentLogoUrl)) {
      const { deleteImageByUrl } = useFirebaseStorage()
      await deleteImageByUrl(currentLogoUrl)
    }
    await updateUserDocument(authStore.currentUser!.uid, { storeLogoUrl: '' })
    userStore.$patch((state) => {
      if (state.userData) state.userData = { ...state.userData, storeLogoUrl: '' }
    })
    await storesStore.updateAllStoresLogo('')
    toast.success('Company logo removed from all stores')
  } catch (err: unknown) {
    const { getFirebaseStorageErrorMessage } = useFirebaseStorage()
    toast.error(getFirebaseStorageErrorMessage(err))
  }
}

// Inventory settings
const inventorySettings = reactive({
  lowStockThreshold: 10,
  autoReorder: false,
  defaultCategory: 'general',
})

const defaultCategoryOptions = [
  { value: 'general', label: 'General' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'food', label: 'Food & Beverages' },
  { value: 'office', label: 'Office Supplies' },
]

// Receipt settings
const receiptSettings = reactive({
  prefix: 'REC-',
  nextNumber: 1001,
  autoPrint: false,
})

const paymentTenders = ref<string[]>([...DEFAULT_PAYMENT_TENDERS])
const newPaymentTender = ref('')

function addPaymentTender() {
  const label = newPaymentTender.value.trim()
  if (!label) return
  if (!paymentTenders.value.some((t) => t.toLowerCase() === label.toLowerCase())) {
    paymentTenders.value.push(label)
  }
  newPaymentTender.value = ''
}

function removePaymentTender(index: number) {
  paymentTenders.value.splice(index, 1)
}

function resetPaymentTendersToDefault() {
  paymentTenders.value = [...DEFAULT_PAYMENT_TENDERS]
}

// Helper function to get the correct user ID (super admin UID if staff)
const getTargetUserId = async (): Promise<string | null> => {
  if (!currentUser.value) return null

  // Fetch user data if not loaded
  if (!userStore.userData) {
    await userStore.fetchUserData(currentUser.value.uid)
  }

  let userId = currentUser.value.uid

  // If the current user is staff, get the super admin UID from the staff document
  if (userStore.userData?.role === 'staff') {
    try {
      const db = getFirestoreInstance()
      if (!db) {
        console.warn('[Settings] Firestore not initialized')
        return userId
      }

      // Find the staff document for this user
      const staffRef = collection(db, 'staff')
      const staffQuery = query(staffRef, where('authUid', '==', userId))
      const staffSnapshot = await getDocs(staffQuery)

      if (!staffSnapshot.empty && staffSnapshot.docs.length > 0) {
        const staffDoc = staffSnapshot.docs[0]
        if (staffDoc) {
          const staffData = staffDoc.data()
          // Use the super admin's UID who created this staff member
          if (staffData.createdBy) {
            userId = staffData.createdBy
            // console.log('[Settings] Staff user detected, using super admin UID:', userId)
          }
        }
      }
    } catch (error: any) {
      console.warn(
        '[Settings] Could not fetch staff document, using current user UID:',
        error.message
      )
    }
  }

  return userId
}

async function loadSettingsFromFirestore() {
  if (!currentUser.value) {
    isLoadingStoreInfo.value = false
    return
  }
  isLoadingStoreInfo.value = true
  try {
    const { isDemoModeActive } = await import('~/utils/demo-mode')
    if (isDemoModeActive()) {
      await userStore.fetchUserData(currentUser.value.uid)
      await storesStore.fetchStores()
      await storesStore.initializeCurrentStore()
      const userData = userStore.userData
      if (userData?.storeDetails) {
        storeInfo.name = userData.storeDetails.storeName || storeInfo.name
        storeInfo.email = userData.storeDetails.storeEmail || storeInfo.email
        storeInfo.phone = userData.storeDetails.storePhone || storeInfo.phone
        storeInfo.address = userData.storeDetails.storeAddress || storeInfo.address
        storeInfo.businessType = userData.storeDetails.storeDescription || storeInfo.businessType
        const settings = userData.storeDetails.settings
        if (settings?.inventory) {
          inventorySettings.lowStockThreshold =
            settings.inventory.lowStockThreshold ?? inventorySettings.lowStockThreshold
          inventorySettings.autoReorder =
            settings.inventory.autoReorder ?? inventorySettings.autoReorder
          inventorySettings.defaultCategory =
            settings.inventory.defaultCategory || inventorySettings.defaultCategory
        }
        if (settings?.receipt) {
          receiptSettings.prefix = settings.receipt.prefix || receiptSettings.prefix
          receiptSettings.nextNumber = settings.receipt.nextNumber ?? receiptSettings.nextNumber
          receiptSettings.autoPrint = settings.receipt.autoPrint ?? receiptSettings.autoPrint
        }
        if (settings?.payment?.paymentMethods) {
          paymentTenders.value = normalizePaymentTenderList(settings.payment.paymentMethods)
        }
        Object.assign(backupStoreInfo, { ...storeInfo })
      }
      return
    }
    if (!userStore.userData) {
      await userStore.fetchUserData(currentUser.value.uid)
    }
    if (userStore.userData?.subscriptionBillingCycle) {
      selectedBillingCycle.value = userStore.userData.subscriptionBillingCycle
    }
    if (userStore.isSuperAdmin) {
      await storesStore.fetchStores()
      await storesStore.initializeCurrentStore()
    } else if (isStaff.value) {
      const ctx = await resolveStaffWorkspaceContext()
      staffWorkspace.value = ctx
      applyWorkspaceToSettingsStoreInfo(storeInfo, ctx)
      fillSettingsStoreInfoFromStore(storeInfo, ctx.store || storesStore.currentStore)
      Object.assign(backupStoreInfo, { ...storeInfo })
    }
    const targetUserId = await getTargetUserId()
    if (!targetUserId) return
    const userData = await getUserDocument(targetUserId)
    if (userData?.storeDetails) {
      if (!isStaff.value) {
        storeInfo.name = userData.storeDetails.storeName || ''
        storeInfo.email = userData.storeDetails.storeEmail || ''
        storeInfo.phone = userData.storeDetails.storePhone || ''
        storeInfo.address = userData.storeDetails.storeAddress || ''
        storeInfo.businessType = userData.storeDetails.storeDescription || ''
        Object.assign(backupStoreInfo, { ...storeInfo })
      } else if (!storeInfo.name) {
        storeInfo.name = userData.storeDetails.storeName || ''
        storeInfo.email = userData.storeDetails.storeEmail || storeInfo.email
        storeInfo.phone = userData.storeDetails.storePhone || storeInfo.phone
        storeInfo.address = userData.storeDetails.storeAddress || storeInfo.address
        storeInfo.businessType = userData.storeDetails.storeDescription || storeInfo.businessType
        Object.assign(backupStoreInfo, { ...storeInfo })
      }
      if (userData.storeDetails.settings) {
        const settings = userData.storeDetails.settings
        if (settings.inventory) {
          inventorySettings.lowStockThreshold = settings.inventory.lowStockThreshold ?? 10
          inventorySettings.autoReorder = settings.inventory.autoReorder ?? false
          inventorySettings.defaultCategory = settings.inventory.defaultCategory || 'general'
        }
        if (settings.receipt) {
          receiptSettings.prefix = settings.receipt.prefix || 'REC-'
          receiptSettings.nextNumber = settings.receipt.nextNumber ?? 1001
          receiptSettings.autoPrint = settings.receipt.autoPrint ?? false
        }
        if (settings.payment?.paymentMethods) {
          paymentTenders.value = normalizePaymentTenderList(settings.payment.paymentMethods)
        }
      }
    }
  } catch (error) {
    console.error('Error loading store info:', error)
  } finally {
    isLoadingStoreInfo.value = false
  }
}

// Load store information and settings from Firestore
onMounted(async () => {
  // Deep links (#settings-subscription, #advanced-features) both land in the "account" tab.
  if (
    import.meta.client &&
    (window.location.hash === '#settings-subscription' || window.location.hash === '#advanced-features') &&
    settingsTabs.value.some((tab) => tab.value === 'account')
  ) {
    activeSettingsTab.value = 'account'
    hasPickedSettingsTab = true
  }

  const tabParam = String(route.query.tab || '').trim()
  if (tabParam === 'branches') {
    await navigateTo({ path: dashPath('/branches'), replace: true })
    return
  }
  if (tabParam && settingsTabs.value.some((tab) => tab.value === tabParam)) {
    activeSettingsTab.value = tabParam
    hasPickedSettingsTab = true
  }

  // Handle Paystack callback after payment redirect
  const refParam = route.query.reference as string | undefined
  const isPaystackCallback =
    route.query.paystack_callback === '1' || (refParam && String(refParam).startsWith('storvv_'))
  if (currentUser.value && refParam && isPaystackCallback) {
    try {
      const verify = (await authFetch(
        `/api/paystack/verify?reference=${encodeURIComponent(refParam)}`
      )) as {
        success?: boolean
        paid?: boolean
        userId?: string
        planId?: string
        addOn?: SubscriptionAddOnKind
        message?: string
      }
      if (verify.paid && verify.userId === currentUser.value.uid && verify.addOn) {
        await userStore.fetchUserData(currentUser.value.uid)
        await storesStore.applyPlanToCurrentStoreSelection()
        toast.success(
          verify.addOn === 'store'
            ? 'Extra store added. You can create another branch now.'
            : 'Staff seat added. You can invite another team member to that store.'
        )
        trackEvent('addon_purchased', { kind: verify.addOn })
        if (import.meta.client && window.history.replaceState) {
          window.history.replaceState({}, '', '/dashboard/settings')
        }
      } else if (verify.paid && verify.userId === currentUser.value.uid && verify.planId) {
        const previousPlan = currentSubscription.value
        await userStore.fetchUserData(currentUser.value.uid)
        toast.success(
          formatUpgradeSuccessMessage(verify.planId as SubscriptionPlan, previousPlan)
        )
        await recordMilestone('firstUpgradeSuccessAt', {
          plan: verify.planId,
          previous_plan: previousPlan,
        })
        trackEvent('upgrade_success', { plan: verify.planId, previous_plan: previousPlan })
        selectedUpgradePlan.value = ''
        if (import.meta.client && window.history.replaceState) {
          window.history.replaceState({}, '', '/dashboard/settings')
        }
      } else if (!verify.paid && verify.message) {
        toast.error(verify.message)
        if (import.meta.client && window.history.replaceState) {
          window.history.replaceState({}, '', '/dashboard/settings')
        }
      }
    } catch (e) {
      toast.error('Could not verify payment')
      if (import.meta.client && window.history.replaceState) {
        window.history.replaceState({}, '', '/dashboard/settings')
      }
    }
  }

  if (currentUser.value) {
    await loadSettingsFromFirestore()
    await syncSubscriptionStatus()
    await loadPricing()
    await loadBillingHistory()
    if (route.query.upgrade === '1' && import.meta.client) {
      await nextTick()
      scrollDashboardToElement('#settings-subscription', { offset: 16 })
    }
  } else {
    isLoadingStoreInfo.value = false
  }
})

// Functions
const enableEditing = (section: string) => {
  if (!canEditSettings.value) {
    toast.error('Only super admins can edit settings')
    return
  }

  if (section === 'store') {
    isEditingStore.value = true
    Object.assign(backupStoreInfo, { ...storeInfo })
  }
}

const cancelEditing = (section: string) => {
  if (section === 'store') {
    isEditingStore.value = false
    Object.assign(storeInfo, { ...backupStoreInfo })
  }
}

const updateStoreSettings = async (settings: any) => {
  if (!currentUser.value) {
    toast.error('You must be signed in to save settings')
    return
  }

  try {
    const targetUserId = await getTargetUserId()
    if (!targetUserId) {
      toast.error('Unable to determine target user. Please try again.')
      return
    }

    const userData = await getUserDocument(targetUserId)
    const currentStoreDetails = userData?.storeDetails || {}
    const currentSettings = (currentStoreDetails as any).settings || {}
    const nextStoreDetails = {
      ...currentStoreDetails,
      settings: {
        ...currentSettings,
        ...settings,
      },
    }

    const { updateUserDocument } = useUser()
    await updateUserDocument(targetUserId, {
      storeDetails: nextStoreDetails,
    } as any)

    // Keep live checkout pickers in sync with the saved account methods
    if (userStore.userData?.uid === targetUserId) {
      userStore.userData = {
        ...userStore.userData,
        storeDetails: nextStoreDetails as any,
      }
    }

    toast.success('Settings saved successfully!')
  } catch (error: any) {
    console.error('Error saving settings:', error)
    toast.error(error.message || 'Failed to save settings. Please try again.')
  }
}

const onProgressiveCapabilityToggle = async (
  capability: BusinessCapability,
  enabled: boolean
) => {
  if (!currentUser.value) {
    toast.error('You must be signed in to save settings')
    return
  }

  if (!canEditSettings.value) {
    toast.error('Only super admins can edit settings')
    return
  }

  const plan = resolveEffectiveSubscriptionPlan(userStore.userData)
  if (enabled && !isProgressiveUnlockAvailableForPlan(capability, plan)) {
    toast.error('This feature is not included on your current plan.')
    return
  }

  togglingProgressiveCapability.value = capability
  try {
    const targetUserId = await getTargetUserId()
    if (!targetUserId) {
      toast.error('Unable to determine target user. Please try again.')
      return
    }

    const userData = await getUserDocument(targetUserId)
    const currentStoreDetails = userData?.storeDetails
    if (!currentStoreDetails?.storeName) {
      toast.error('Store details are missing. Complete store setup first.')
      return
    }

    const nextEnabled = setProgressiveCapabilityEnabled(
      currentStoreDetails.enabledCapabilities,
      capability,
      enabled
    )

    await updateUserDocument(targetUserId, {
      storeDetails: applyEnabledCapabilitiesToStoreDetails(
        currentStoreDetails,
        nextEnabled
      ),
    })

    await userStore.fetchUserData(currentUser.value.uid)
    toast.success(enabled ? 'Feature enabled' : 'Feature turned off')
  } catch (error: any) {
    console.error('Error saving experience settings:', error)
    toast.error(error.message || 'Failed to save experience settings. Please try again.')
  } finally {
    togglingProgressiveCapability.value = null
  }
}

const saveStoreInfo = async () => {
  if (!currentUser.value) {
    toast.error('You must be signed in to save store information')
    return
  }

  if (!canEditSettings.value) {
    toast.error('Only super admins can edit store settings')
    return
  }

  try {
    const targetUserId = await getTargetUserId()
    if (!targetUserId) {
      toast.error('Unable to determine target user. Please try again.')
      return
    }

    await updateStoreDetails(targetUserId, {
      storeName: storeInfo.name,
      storeEmail: storeInfo.email,
      storePhone: storeInfo.phone,
      storeAddress: storeInfo.address,
      storeDescription: storeInfo.businessType,
    })

    isEditingStore.value = false
    Object.assign(backupStoreInfo, { ...storeInfo })
    toast.success('Store information updated successfully!')
  } catch (error: any) {
    console.error('Error saving store info:', error)
    toast.error(error.message || 'Failed to save store information. Please try again.')
  }
}

// Save inventory settings
const saveInventorySettings = async () => {
  if (!canEditSettings.value) {
    toast.error('Only super admins can edit settings')
    return
  }

  await updateStoreSettings({
    inventory: {
      lowStockThreshold: inventorySettings.lowStockThreshold,
      autoReorder: inventorySettings.autoReorder,
      defaultCategory: inventorySettings.defaultCategory,
    },
  })

  // Refresh user data to get updated settings
  if (currentUser.value) {
    await userStore.fetchUserData(currentUser.value.uid)
  }

  // Update low stock counts for all folders with the new threshold
  try {
    const folders = inventoryStore.folders
    for (const folder of folders) {
      await inventoryStore.updateLowStockCount(folder.id)
    }
    toast.success('Low stock counts updated with new threshold!')
  } catch (error: any) {
    console.error('Error updating low stock counts:', error)
    // Don't show error to user, just log it - the threshold is saved anyway
  }
}

const savePaymentSettings = async () => {
  if (!canEditSettings.value) {
    toast.error('Only super admins can edit settings')
    return
  }
  const methods = normalizePaymentTenderList(paymentTenders.value)
  paymentTenders.value = methods
  await updateStoreSettings({
    payment: { paymentMethods: methods },
  })
}

// Save receipt settings
const saveReceiptSettings = async () => {
  if (!canEditSettings.value) {
    toast.error('Only super admins can edit settings')
    return
  }

  await updateStoreSettings({
    receipt: {
      prefix: receiptSettings.prefix,
      nextNumber: receiptSettings.nextNumber,
      autoPrint: receiptSettings.autoPrint,
    },
  })
}
</script>

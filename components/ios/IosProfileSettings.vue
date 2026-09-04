<template>
  <div class="ios-profile-settings">
    <div class="ios-profile-settings__hero">
      <div v-if="isLoading" class="ios-profile-settings__hero-skeleton">
        <div class="ios-profile-settings__hero-avatar ios-profile-settings__hero-avatar--skeleton" />
        <div class="ios-profile-settings__hero-lines">
          <div class="ios-profile-settings__skeleton-line ios-profile-settings__skeleton-line--lg" />
          <div class="ios-profile-settings__skeleton-line" />
        </div>
      </div>
      <template v-else>
        <div class="ios-profile-settings__hero-avatar">
          <AccountAvatar :initials="avatarInitials" />
        </div>
        <div class="ios-profile-settings__hero-body">
          <p class="ios-profile-settings__hero-name">{{ displayName }}</p>
          <p class="ios-profile-settings__hero-email">{{ email || '—' }}</p>
          <button type="button" class="ios-profile-settings__hero-edit" @click="emit('edit-profile')">
            <PencilSquareIcon aria-hidden="true" />
            Edit profile
          </button>
        </div>
      </template>
    </div>

    <CategoryTabs
      :model-value="activeTab"
      :options="tabs"
      ariaLabel="Profile sections"
      scroll
      @update:model-value="onTabChange"
    />

    <div v-show="activeTab === 'account'">
    <IosSettingsGroup title="Account details">
      <IosSettingsRow :icon="UserCircleIcon" label="Profile" @click="emit('edit-profile')" />
      <IosSettingsRow
        v-if="!isStaff"
        :icon="BuildingStorefrontIcon"
        label="Store settings"
        to="/dashboard/settings"
        last
      />
      <IosSettingsRow
        v-else
        :icon="BuildingStorefrontIcon"
        label="Store information"
        last
        @click="emit('open-store-info')"
      />
    </IosSettingsGroup>
    </div>

    <div v-show="activeTab === 'billing'">
    <IosSettingsGroup v-if="showBilling" title="Billing">
      <IosSettingsRow
        :icon="CreditCardIcon"
        label="Subscription & billing"
        :value="subscriptionLabel"
        to="/dashboard/settings#settings-subscription"
        last
      />
    </IosSettingsGroup>
    </div>

    <div v-show="activeTab === 'business'">
    <IosSettingsGroup v-if="showStoreInfo" title="Business">
      <IosSettingsRow
        :icon="BuildingStorefrontIcon"
        label="Branch & store details"
        :value="storeSummary || undefined"
        last
        @click="emit('open-store-info')"
      />
    </IosSettingsGroup>
    </div>

    <div v-show="activeTab === 'general'">
    <IosSettingsGroup title="General">
      <IosSettingsRow
        :icon="BellIcon"
        label="Notifications"
        @click="emit('open-notifications')"
      />
      <IosSettingsRow
        :icon="LanguageIcon"
        label="Language"
        :value="language"
        @click="emit('open-language')"
      />
      <IosSettingsRow
        :icon="MoonIcon"
        label="Light / dark mode"
        :value="theme"
        @click="emit('open-theme')"
      />
      <IosSettingsRow
        :icon="GlobeAltIcon"
        label="Region"
        :value="region"
        @click="emit('open-region')"
      />
      <IosSettingsRow
        :icon="CurrencyDollarIcon"
        label="Currency"
        :value="currency"
        @click="emit('open-currency')"
      />
      <IosSettingsRow
        :icon="CalendarIcon"
        label="Timezone"
        :value="timezone"
        last
        @click="emit('open-timezone')"
      />
    </IosSettingsGroup>
    </div>

    <div v-show="activeTab === 'security'">
    <IosSettingsGroup title="Security">
      <IosSettingsRow :icon="KeyIcon" label="Password" @click="emit('open-password')" />
      <IosSettingsRow
        :icon="ShieldCheckIcon"
        label="Two-factor authentication"
        :value="twoFactorEnabled ? 'On' : 'Off'"
        @click="emit('toggle-two-factor')"
      />
      <IosSettingsRow
        :icon="DevicePhoneMobileIcon"
        label="Active sessions"
        :value="sessionCountLabel"
        last
        @click="emit('open-sessions')"
      />
    </IosSettingsGroup>
    </div>

    <div v-show="activeTab === 'access'">
    <IosSettingsGroup title="Access">
      <IosSettingsRow
        :icon="ClipboardDocumentListIcon"
        label="Roles & permissions"
        :value="roleLabel"
        last
        @click="emit('open-roles')"
      />
    </IosSettingsGroup>
    </div>

    <div v-show="activeTab === 'receipts'">
    <IosSettingsGroup v-if="showReceiptPolicies" title="Receipts">
      <IosSettingsRow
        :icon="ReceiptPercentIcon"
        label="Receipt terms & policies"
        last
        @click="emit('open-receipt-policies')"
      />
    </IosSettingsGroup>
    </div>

    <div v-show="activeTab === 'support'">
    <IosSettingsGroup title="Support">
      <IosSettingsRow :icon="SparklesIcon" label="Dashboard tour" @click="emit('replay-tour')" />
      <IosSettingsRow :icon="InformationCircleIcon" label="Help center" to="/dashboard/help" />
      <IosSettingsRow
        :icon="SparklesIcon"
        label="Ask assistant"
        last
        @click="emit('open-assistant')"
      />
    </IosSettingsGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import CategoryTabs from '~/components/ui/CategoryTabs.vue'
import {
  BellIcon,
  BuildingStorefrontIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  KeyIcon,
  LanguageIcon,
  MoonIcon,
  PencilSquareIcon,
  ReceiptPercentIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserCircleIcon,
} from '~/utils/app-icons'
import AccountAvatar from '~/components/ui/AccountAvatar.vue'

const props = withDefaults(
  defineProps<{
    displayName: string
    email: string
    avatarInitials: string
    isLoading?: boolean
    isStaff?: boolean
    showBilling?: boolean
    showStoreInfo?: boolean
    showReceiptPolicies?: boolean
    subscriptionLabel?: string
    storeSummary?: string
    language: string
    theme: string
    region: string
    currency: string
    timezone: string
    twoFactorEnabled: boolean
    sessionCount: number
    roleLabel: string
  }>(),
  {
    isLoading: false,
    isStaff: false,
    showBilling: false,
    showStoreInfo: false,
    showReceiptPolicies: false,
    subscriptionLabel: '',
    storeSummary: '',
    twoFactorEnabled: false,
    sessionCount: 0,
  }
)

const emit = defineEmits<{
  'edit-profile': []
  'open-store-info': []
  'open-notifications': []
  'open-language': []
  'open-theme': []
  'open-region': []
  'open-currency': []
  'open-timezone': []
  'open-password': []
  'toggle-two-factor': []
  'open-sessions': []
  'open-roles': []
  'open-receipt-policies': []
  'replay-tour': []
  'open-assistant': []
}>()

const sessionCountLabel = computed(() => {
  const count = props.sessionCount
  return count === 1 ? '1 device' : `${count} devices`
})

const tabs = computed(() => {
  const list: Array<{ value: string; label: string }> = [{ value: 'account', label: 'Account details' }]
  if (props.showBilling) list.push({ value: 'billing', label: 'Billing' })
  if (props.showStoreInfo) list.push({ value: 'business', label: 'Business' })
  list.push({ value: 'general', label: 'General' })
  list.push({ value: 'security', label: 'Security' })
  list.push({ value: 'access', label: 'Access' })
  if (props.showReceiptPolicies) list.push({ value: 'receipts', label: 'Receipts' })
  list.push({ value: 'support', label: 'Support' })
  return list
})

const activeTab = ref('account')

// showBilling/showStoreInfo/showReceiptPolicies can still be loading when this component mounts
// (role/plan data resolving) — keep snapping to "account" until the user picks a tab themselves.
let hasPickedTab = false
watch(
  tabs,
  (list) => {
    if (!hasPickedTab || !list.some((tab) => tab.value === activeTab.value)) {
      activeTab.value = 'account'
    }
  }
)

function onTabChange(value: string) {
  hasPickedTab = true
  activeTab.value = value
}
</script>

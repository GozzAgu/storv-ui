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
        <div class="ios-profile-settings__hero-avatar">{{ avatarInitials }}</div>
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

    <IosSettingsGroup v-if="showBilling" title="Billing">
      <IosSettingsRow
        :icon="CreditCardIcon"
        label="Subscription & billing"
        :value="subscriptionLabel"
        to="/dashboard/settings#settings-subscription"
        last
      />
    </IosSettingsGroup>

    <IosSettingsGroup v-if="showStoreInfo" title="Business">
      <IosSettingsRow
        :icon="BuildingStorefrontIcon"
        label="Branch & store details"
        :value="storeSummary || undefined"
        last
        @click="emit('open-store-info')"
      />
    </IosSettingsGroup>

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

    <IosSettingsGroup title="Access">
      <IosSettingsRow
        :icon="ClipboardDocumentListIcon"
        label="Roles & permissions"
        :value="roleLabel"
        last
        @click="emit('open-roles')"
      />
    </IosSettingsGroup>

    <IosSettingsGroup v-if="showReceiptPolicies" title="Receipts">
      <IosSettingsRow
        :icon="ReceiptPercentIcon"
        label="Receipt terms & policies"
        last
        @click="emit('open-receipt-policies')"
      />
    </IosSettingsGroup>

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
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
</script>

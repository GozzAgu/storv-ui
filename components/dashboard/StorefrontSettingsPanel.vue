<template>
  <div class="s-c s-storefront-settings">
    <SCard
      title="Public storefront"
      description="Share a digital showroom of selected stock. Customers browse as guests. No accounts."
    >
      <div class="s-storefront-settings__body">
        <p v-if="!canEdit" class="s-callout">Only the account owner can publish or change the storefront.</p>

        <div v-if="loading" class="s-storefront-settings__loading" aria-busy="true">
          <SSkeleton height="40px" />
          <SSkeleton height="96px" />
        </div>

        <template v-else>
          <div class="s-settings__rows">
            <div class="s-settings__row">
              <SCheckbox
                v-model="draft.enabled"
                variant="switch"
                label="Show storefront"
                description="When on, anyone with the link can view published products."
                :disabled="!canEdit || saving"
              />
            </div>
          </div>

          <SFormSection title="Details">
            <div class="s-form-pair">
              <SInput
                v-model="draft.displayName"
                label="Public name"
                placeholder="Your shop name"
                :disabled="!canEdit || saving"
              />
              <SInput
                v-model="draft.slug"
                label="URL slug"
                placeholder="my-shop"
                :disabled="!canEdit || saving"
                @blur="normalizeSlug"
              >
                <template #prefix>/store/</template>
              </SInput>
            </div>
            <SInput
              v-model="draft.tagline"
              label="Short tagline"
              placeholder="Know what’s available before you visit"
              :disabled="!canEdit || saving"
            />
            <STextarea
              v-model="draft.description"
              label="About"
              hint="Optional"
              :rows="3"
              placeholder="Optional intro for customers"
              :disabled="!canEdit || saving"
            />
            <div class="s-form-pair">
              <STextarea
                v-model="draft.collectionInfo"
                label="Collection / pickup info"
                :rows="2"
                placeholder="e.g. Collect from our Ikeja shop Mon-Sat"
                :disabled="!canEdit || saving"
              />
              <STextarea
                v-model="draft.warrantyInfo"
                label="Warranty info"
                :rows="2"
                placeholder="e.g. 30-day seller warranty on phones"
                :disabled="!canEdit || saving"
              />
            </div>
          </SFormSection>

          <SFormSection title="Contact">
            <div class="s-form-pair">
              <SInput
                v-model="draft.phonePublic"
                type="tel"
                label="Public phone"
                placeholder="+234…"
                :disabled="!canEdit || saving"
              />
              <SInput
                v-model="draft.whatsappE164"
                type="tel"
                label="WhatsApp (E.164)"
                placeholder="2348012345678"
                :disabled="!canEdit || saving"
              />
            </div>
            <div class="s-form-pair">
              <SInput
                v-model="draft.emailPublic"
                type="email"
                label="Public email"
                placeholder="hello@shop.com"
                :disabled="!canEdit || saving"
              />
              <SInput
                v-model="draft.city"
                label="City"
                placeholder="Lagos"
                :disabled="!canEdit || saving"
              />
            </div>
          </SFormSection>

          <SFormSection title="Social links">
            <div class="s-form-pair">
              <SInput
                v-model="draft.social!.instagram"
                type="url"
                label="Instagram URL"
                placeholder="https://instagram.com/…"
                :disabled="!canEdit || saving"
              />
              <SInput
                v-model="draft.social!.facebook"
                type="url"
                label="Facebook URL"
                placeholder="https://facebook.com/…"
                :disabled="!canEdit || saving"
              />
            </div>
            <div class="s-form-pair">
              <SInput
                v-model="draft.social!.tiktok"
                type="url"
                label="TikTok URL"
                placeholder="https://tiktok.com/@…"
                :disabled="!canEdit || saving"
              />
              <SInput
                v-model="draft.social!.website"
                type="url"
                label="Website"
                placeholder="https://"
                :disabled="!canEdit || saving"
              />
            </div>
          </SFormSection>

          <SFormSection title="What guests can do">
            <div class="s-settings__rows">
              <div class="s-settings__row">
                <SCheckbox
                  v-model="draft.listAvailableOnly"
                  variant="switch"
                  label="Only show available stock"
                  description="Sold, reserved, or on-loan units stay off the public list."
                  :disabled="!canEdit || saving"
                />
              </div>
              <div class="s-settings__row">
                <SCheckbox
                  v-model="draft.allowReservations"
                  variant="switch"
                  label="Allow reservation requests"
                  description="Guests can ask you to soft-hold an available item. Inventory stays under your control."
                  :disabled="!canEdit || saving"
                />
              </div>
              <div class="s-settings__row">
                <SCheckbox
                  v-model="draft.allowOnlineCheckout"
                  variant="switch"
                  label="Accept online payments"
                  description="Guests can pay for available items via Paystack. Requires a connected payout account in Payment links."
                  :disabled="!canEdit || saving"
                />
              </div>
            </div>
          </SFormSection>

          <p v-if="error" class="s-storefront-settings__error" role="alert">{{ error }}</p>
          <p v-if="success" class="s-storefront-settings__success" role="status">{{ success }}</p>

          <p v-if="!draft.enabled && draft.slug" class="s-notice">
            Turn on “Show storefront” and Save. The public link stays hidden until it is published.
          </p>

          <section
            v-if="draft.enabled && draft.slug"
            class="s-storefront-share"
            aria-labelledby="storefront-share-title"
          >
            <div class="s-storefront-share__qr">
              <div class="s-storefront-share__qr-frame">
                <img
                  v-if="qrDataUrl"
                  :src="qrDataUrl"
                  alt="Storefront QR code"
                  class="s-storefront-share__qr-img"
                  width="128"
                  height="128"
                />
                <SSkeleton v-else width="128px" height="128px" />
              </div>
              <a
                v-if="qrDataUrl"
                :href="qrDataUrl"
                :download="`${draft.slug}-storefront-qr.png`"
                class="s-link s-storefront-share__download"
              >
                Download QR
              </a>
            </div>
            <div class="s-storefront-share__main">
              <h3 id="storefront-share-title" class="s-storefront-share__title">Share & track</h3>
              <p class="s-form-meta">
                Copy a tracked link for WhatsApp or Instagram. QR opens your public showroom.
              </p>
              <div class="s-storefront-share__actions">
                <SButton size="sm" @click="copyTrackedLink">
                  <template #leading>
                    <component :is="copiedLink ? Check : Copy" :size="14" :stroke-width="2" aria-hidden="true" />
                  </template>
                  {{ copiedLink ? 'Copied' : 'Copy tracked link' }}
                </SButton>
                <a
                  :href="whatsappShareHref"
                  target="_blank"
                  rel="noopener"
                  class="s-c s-btn s-btn--secondary s-btn--sm"
                >
                  <MessageCircle :size="14" :stroke-width="2" aria-hidden="true" />
                  <span>Share on WhatsApp</span>
                </a>
              </div>
              <dl v-if="analyticsSummary" class="s-metrics s-metrics--inline s-storefront-share__metrics">
                <div class="s-metrics__item">
                  <dt class="s-metrics__label">Store views</dt>
                  <dd class="s-metrics__value">{{ analyticsSummary.storeViews }}</dd>
                </div>
                <div class="s-metrics__item">
                  <dt class="s-metrics__label">Product views</dt>
                  <dd class="s-metrics__value">{{ analyticsSummary.productViews }}</dd>
                </div>
                <div class="s-metrics__item">
                  <dt class="s-metrics__label">Last 7 days</dt>
                  <dd class="s-metrics__value">{{ viewsLast7Days }}</dd>
                </div>
              </dl>
              <SBadge v-if="analyticsSummary && pendingInquiryCount" tone="warning" dot>
                {{ pendingInquiryCount }} pending
              </SBadge>
              <p v-else-if="!analyticsSummary && analyticsError" class="s-form-meta">{{ analyticsError }}</p>
            </div>
          </section>
        </template>
      </div>

      <template v-if="canEdit && !loading" #footer>
        <span class="s-storefront-settings__links">
          <a
            v-if="draft.enabled && draft.slug"
            :href="publicHref"
            target="_blank"
            rel="noopener"
            class="s-link s-storefront-settings__link"
          >
            Open public page
            <ExternalLink :size="14" :stroke-width="2" aria-hidden="true" />
          </a>
          <NuxtLink to="/dashboard/storefront" class="s-link s-storefront-settings__link">View inquiries</NuxtLink>
        </span>
        <SButton
          :loading="syncing"
          :disabled="saving || !draft.enabled || !draft.slug"
          @click="onSync"
        >
          Sync products now
        </SButton>
        <SButton variant="primary" :loading="saving" :disabled="syncing" @click="onSave">
          Save storefront
        </SButton>
      </template>
    </SCard>

    <SCard
      title="Categories on storefront"
      description="Choose which categories appear, and which product fields customers can see. Cost, serials, and supplier fields stay private."
    >
      <p v-if="!leafFolders.length" class="s-form-meta">
        Create inventory categories first, then enable them here.
      </p>
      <ul v-else class="s-storefront-cats">
        <li v-for="folder in leafFolders" :key="folder.id" class="s-storefront-cats__item">
          <SCheckbox
            variant="switch"
            :label="folderLabel(folder)"
            :description="`${folder.itemCount || 0} products`"
            :model-value="Boolean(draft.folderPublish[folder.id]?.enabled)"
            :disabled="!canEdit || saving"
            @update:model-value="(on: boolean) => toggleFolder(folder, on)"
          />
          <div v-if="draft.folderPublish[folder.id]?.enabled" class="s-storefront-cats__fields">
            <template v-if="allowlistableFields(folder).length">
              <p class="s-storefront-cats__fields-label">Visible fields</p>
              <div class="s-storefront-cats__chips">
                <SCheckbox
                  v-for="field in allowlistableFields(folder)"
                  :key="field.id"
                  :label="field.label"
                  :model-value="Boolean(draft.folderPublish[folder.id]?.publicFieldIds?.includes(field.id))"
                  :disabled="!canEdit || saving"
                  @update:model-value="(on: boolean) => toggleField(folder.id, field.id, on)"
                />
              </div>
            </template>
            <p v-else class="s-form-meta">
              Only name and price will show (no extra public columns on this template).
            </p>
          </div>
        </li>
      </ul>
    </SCard>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import QRCode from 'qrcode'
import { Check, Copy, ExternalLink, MessageCircle } from '@lucide/vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SCheckbox from '~/components/s/SCheckbox.vue'
import SFormSection from '~/components/s/SFormSection.vue'
import SInput from '~/components/s/SInput.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import STextarea from '~/components/s/STextarea.vue'
import { useInventoryStore, type InventoryFolder } from '~/stores/inventory'
import { useStorefrontStore, isStorefrontSlugTaken } from '~/stores/storefront'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { getQueryUserId } from '~/composables/useFirestorePaths'
import { canAllowlistStorefrontField, suggestDefaultPublicFieldIds } from '~/utils/storefront-fields'
import { slugifyStorefrontName, storefrontPublicPath } from '~/utils/storefront-slug'
import {
  buildStorefrontShareMessage,
  buildStorefrontWhatsAppShareHref,
  storefrontAbsoluteUrl,
} from '~/utils/storefront-share'
import {
  EMPTY_STOREFRONT_CONFIG,
  type StorefrontConfig,
} from '~/types/storefront'

const props = defineProps<{ canEdit: boolean }>()

const storefront = useStorefrontStore()
const inventory = useInventoryStore()
const authStore = useAuthStore()
const userStore = useUserStore()
const { loading, saving, syncing, analyticsError, pendingInquiryCount, viewsLast7Days } =
  storeToRefs(storefront)

const draft = ref<StorefrontConfig>(EMPTY_STOREFRONT_CONFIG())
const error = ref('')
const success = ref('')
const qrDataUrl = ref('')
const copiedLink = ref(false)

const analyticsSummary = computed(() => {
  if (!storefront.analyticsLoadedStoreId) return null
  return storefront.analyticsSummary
})

const leafFolders = computed(() => inventory.leafFolders)

const publicHref = computed(() => {
  if (!import.meta.client || !draft.value.slug) return storefrontPublicPath(draft.value.slug)
  return `${window.location.origin}${storefrontPublicPath(draft.value.slug)}`
})

const trackedShareUrl = computed(() => {
  if (!import.meta.client || !draft.value.slug) return ''
  return storefrontAbsoluteUrl(window.location.origin, storefrontPublicPath(draft.value.slug), {
    source: 'dashboard',
    medium: 'share',
    campaign: draft.value.slug,
  })
})

const whatsappShareHref = computed(() => {
  const message = buildStorefrontShareMessage({
    storeName: draft.value.displayName || 'our store',
    url: trackedShareUrl.value || publicHref.value,
  })
  return buildStorefrontWhatsAppShareHref(message)
})

watch(
  () => trackedShareUrl.value,
  async (url) => {
    if (!url) {
      qrDataUrl.value = ''
      return
    }
    try {
      qrDataUrl.value = await QRCode.toDataURL(url, {
        margin: 1,
        width: 256,
        color: { dark: '#1a1523', light: '#ffffff' },
      })
    } catch {
      qrDataUrl.value = ''
    }
  },
  { immediate: true }
)

async function copyTrackedLink() {
  if (!trackedShareUrl.value) return
  try {
    await navigator.clipboard.writeText(trackedShareUrl.value)
    copiedLink.value = true
    setTimeout(() => {
      copiedLink.value = false
    }, 2000)
  } catch {
    error.value = 'Could not copy link'
  }
}

async function loadAnalytics() {
  try {
    await storefront.fetchAnalytics({ force: true })
  } catch {
    /* store sets analyticsError */
  }
}

function folderLabel(folder: InventoryFolder) {
  if (folder.parentId) {
    const parent = inventory.folders.find((f) => f.id === folder.parentId)
    return parent ? `${parent.name} / ${folder.name}` : folder.name
  }
  return folder.name
}

function allowlistableFields(folder: InventoryFolder) {
  return (folder.template?.fields || []).filter((f) =>
    canAllowlistStorefrontField(f.name, f.label)
  )
}

function toggleFolder(folder: InventoryFolder, enabled: boolean) {
  if (!enabled) {
    draft.value.folderPublish = {
      ...draft.value.folderPublish,
      [folder.id]: {
        enabled: false,
        publicFieldIds: draft.value.folderPublish[folder.id]?.publicFieldIds || [],
      },
    }
    return
  }
  const fields = folder.template?.fields || []
  const existing = draft.value.folderPublish[folder.id]?.publicFieldIds
  draft.value.folderPublish = {
    ...draft.value.folderPublish,
    [folder.id]: {
      enabled: true,
      publicFieldIds: existing?.length ? existing : suggestDefaultPublicFieldIds(fields),
    },
  }
}

function toggleField(folderId: string, fieldId: string, on: boolean) {
  const current = draft.value.folderPublish[folderId] || {
    enabled: true,
    publicFieldIds: [] as string[],
  }
  const set = new Set(current.publicFieldIds || [])
  if (on) set.add(fieldId)
  else set.delete(fieldId)
  draft.value.folderPublish = {
    ...draft.value.folderPublish,
    [folderId]: { ...current, enabled: true, publicFieldIds: Array.from(set) },
  }
}

function normalizeSlug() {
  draft.value.slug = slugifyStorefrontName(draft.value.slug || draft.value.displayName)
}

async function onSave() {
  error.value = ''
  success.value = ''
  if (!props.canEdit) return
  normalizeSlug()
  try {
    if (draft.value.enabled && draft.value.slug) {
      const ownerUid = (await getQueryUserId()) ?? authStore.currentUser?.uid ?? ''
      const taken = await isStorefrontSlugTaken(draft.value.slug, ownerUid)
      if (taken) {
        error.value = 'That URL slug is already in use. Pick another.'
        return
      }
    }
    if (!draft.value.displayName.trim()) {
      draft.value.displayName =
        userStore.userData?.storeDetails?.storeName ||
        userStore.userData?.name ||
        'My store'
    }
    if (!draft.value.social) draft.value.social = {}
    await storefront.saveConfig({ ...draft.value })
    success.value = draft.value.enabled
      ? 'Storefront saved. Run “Sync products now” to refresh listings.'
      : 'Storefront turned off.'
    void loadAnalytics()
  } catch (e: any) {
    error.value = e?.message || 'Could not save storefront'
  }
}

async function onSync() {
  error.value = ''
  success.value = ''
  try {
    await storefront.saveConfig({ ...draft.value })
    await storefront.republishAllListedItems()
    success.value = 'Products synced to the public storefront.'
  } catch (e: any) {
    error.value = e?.message || 'Sync failed'
  }
}

onMounted(async () => {
  try {
    if (!inventory.folders.length) {
      await inventory.fetchFolders().catch(() => undefined)
    }
    await storefront.loadConfig(true)
    draft.value = {
      ...EMPTY_STOREFRONT_CONFIG(),
      ...storefront.config,
      social: { ...(storefront.config.social || {}) },
      folderPublish: { ...(storefront.config.folderPublish || {}) },
      itemOverrides: { ...(storefront.config.itemOverrides || {}) },
    }
    if (!draft.value.displayName) {
      draft.value.displayName =
        userStore.userData?.storeDetails?.storeName ||
        userStore.userData?.name ||
        ''
    }
    if (!draft.value.slug && draft.value.displayName) {
      draft.value.slug = slugifyStorefrontName(draft.value.displayName)
    }
    if (!draft.value.phonePublic && userStore.userData?.storeDetails?.storePhone) {
      draft.value.phonePublic = userStore.userData.storeDetails.storePhone
    }
    if (!draft.value.emailPublic && userStore.userData?.storeDetails?.storeEmail) {
      draft.value.emailPublic = userStore.userData.storeDetails.storeEmail
    }
    void loadAnalytics()
  } catch (e: any) {
    error.value = e?.message || 'Failed to load storefront settings'
  }
})
</script>

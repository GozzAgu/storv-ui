<template>
  <div class="space-y-4">
    <DashboardSettingsPanel
      title="Public storefront"
      subtitle="Share a digital showroom of selected stock. Customers browse as guests — no accounts."
    >
      <p
        v-if="!canEdit"
        class="mb-3 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400"
      >
        Only the account owner can publish or change the storefront.
      </p>

      <div v-if="loading" class="space-y-3">
        <div class="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-white/[0.06]" />
        <div class="h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-white/[0.06]" />
      </div>

      <template v-else>
        <label class="dash-setting-row flex items-start justify-between gap-3">
          <span>
            <span class="block text-sm font-medium text-gray-900 dark:text-gray-100"
              >Show storefront</span
            >
            <span class="mt-0.5 block text-[11px] text-gray-500 dark:text-gray-400">
              When on, anyone with the link can view published products.
            </span>
          </span>
          <input
            v-model="draft.enabled"
            type="checkbox"
            class="mt-1 h-4 w-4 rounded border-gray-300"
            :disabled="!canEdit || saving"
          />
        </label>

        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="dash-field-label">Public name</span>
            <input
              v-model="draft.displayName"
              type="text"
              class="app-field w-full"
              placeholder="Your shop name"
              :disabled="!canEdit || saving"
            />
          </label>
          <label class="block">
            <span class="dash-field-label">URL slug</span>
            <div class="flex items-center gap-1">
              <span class="shrink-0 text-[11px] text-gray-400">/store/</span>
              <input
                v-model="draft.slug"
                type="text"
                class="app-field w-full"
                placeholder="my-shop"
                :disabled="!canEdit || saving"
                @blur="normalizeSlug"
              />
            </div>
          </label>
        </div>

        <label class="mt-3 block">
          <span class="dash-field-label">Short tagline</span>
          <input
            v-model="draft.tagline"
            type="text"
            class="app-field w-full"
            placeholder="Know what’s available before you visit"
            :disabled="!canEdit || saving"
          />
        </label>

        <label class="mt-3 block">
          <span class="dash-field-label">About</span>
          <textarea
            v-model="draft.description"
            rows="3"
            class="app-field w-full"
            placeholder="Optional intro for customers"
            :disabled="!canEdit || saving"
          />
        </label>

        <div class="mt-3 grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="dash-field-label">Collection / pickup info</span>
            <textarea
              v-model="draft.collectionInfo"
              rows="2"
              class="app-field w-full"
              placeholder="e.g. Collect from our Ikeja shop Mon–Sat"
              :disabled="!canEdit || saving"
            />
          </label>
          <label class="block">
            <span class="dash-field-label">Warranty info</span>
            <textarea
              v-model="draft.warrantyInfo"
              rows="2"
              class="app-field w-full"
              placeholder="e.g. 30-day seller warranty on phones"
              :disabled="!canEdit || saving"
            />
          </label>
        </div>

        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="dash-field-label">Public phone</span>
            <input
              v-model="draft.phonePublic"
              type="tel"
              class="app-field w-full"
              placeholder="+234…"
              :disabled="!canEdit || saving"
            />
          </label>
          <label class="block">
            <span class="dash-field-label">WhatsApp (E.164)</span>
            <input
              v-model="draft.whatsappE164"
              type="tel"
              class="app-field w-full"
              placeholder="2348012345678"
              :disabled="!canEdit || saving"
            />
          </label>
          <label class="block">
            <span class="dash-field-label">Public email</span>
            <input
              v-model="draft.emailPublic"
              type="email"
              class="app-field w-full"
              placeholder="hello@shop.com"
              :disabled="!canEdit || saving"
            />
          </label>
          <label class="block">
            <span class="dash-field-label">City</span>
            <input
              v-model="draft.city"
              type="text"
              class="app-field w-full"
              placeholder="Lagos"
              :disabled="!canEdit || saving"
            />
          </label>
        </div>

        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="dash-field-label">Instagram URL</span>
            <input
              v-model="draft.social!.instagram"
              type="url"
              class="app-field w-full"
              placeholder="https://instagram.com/…"
              :disabled="!canEdit || saving"
            />
          </label>
          <label class="block">
            <span class="dash-field-label">Facebook URL</span>
            <input
              v-model="draft.social!.facebook"
              type="url"
              class="app-field w-full"
              placeholder="https://facebook.com/…"
              :disabled="!canEdit || saving"
            />
          </label>
          <label class="block">
            <span class="dash-field-label">TikTok URL</span>
            <input
              v-model="draft.social!.tiktok"
              type="url"
              class="app-field w-full"
              placeholder="https://tiktok.com/@…"
              :disabled="!canEdit || saving"
            />
          </label>
          <label class="block">
            <span class="dash-field-label">Website</span>
            <input
              v-model="draft.social!.website"
              type="url"
              class="app-field w-full"
              placeholder="https://"
              :disabled="!canEdit || saving"
            />
          </label>
        </div>

        <label class="mt-4 flex items-start justify-between gap-3">
          <span>
            <span class="block text-sm font-medium text-gray-900 dark:text-gray-100"
              >Only show available stock</span
            >
            <span class="mt-0.5 block text-[11px] text-gray-500 dark:text-gray-400">
              Sold, reserved, or on-loan units stay off the public list.
            </span>
          </span>
          <input
            v-model="draft.listAvailableOnly"
            type="checkbox"
            class="mt-1 h-4 w-4 rounded border-gray-300"
            :disabled="!canEdit || saving"
          />
        </label>

        <label class="mt-4 flex items-start justify-between gap-3">
          <span>
            <span class="block text-sm font-medium text-gray-900 dark:text-gray-100"
              >Allow reservation requests</span
            >
            <span class="mt-0.5 block text-[11px] text-gray-500 dark:text-gray-400">
              Guests can ask you to soft-hold an available item. Inventory stays under your control.
            </span>
          </span>
          <input
            v-model="draft.allowReservations"
            type="checkbox"
            class="mt-1 h-4 w-4 rounded border-gray-300"
            :disabled="!canEdit || saving"
          />
        </label>

        <label class="mt-4 flex items-start justify-between gap-3">
          <span>
            <span class="block text-sm font-medium text-gray-900 dark:text-gray-100"
              >Accept online payments</span
            >
            <span class="mt-0.5 block text-[11px] text-gray-500 dark:text-gray-400">
              Guests can pay for available items via Paystack. Requires a connected payout account in
              Payment links.
            </span>
          </span>
          <input
            v-model="draft.allowOnlineCheckout"
            type="checkbox"
            class="mt-1 h-4 w-4 rounded border-gray-300"
            :disabled="!canEdit || saving"
          />
        </label>

        <p v-if="error" class="mt-3 text-xs text-red-600 dark:text-red-400">{{ error }}</p>
        <p v-if="success" class="mt-3 text-xs text-emerald-700 dark:text-emerald-400">{{ success }}</p>

        <div v-if="canEdit" class="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="btn-primary"
            :disabled="saving || syncing"
            @click="onSave"
          >
            {{ saving ? 'Saving…' : 'Save storefront' }}
          </button>
          <button
            type="button"
            class="btn-outline"
            :disabled="saving || syncing || !draft.enabled || !draft.slug"
            @click="onSync"
          >
            {{ syncing ? 'Syncing…' : 'Sync products now' }}
          </button>
          <a
            v-if="draft.enabled && draft.slug"
            :href="publicHref"
            target="_blank"
            rel="noopener"
            class="text-xs font-semibold text-gray-600 underline-offset-2 hover:underline dark:text-gray-300"
          >
            Open public page →
          </a>
          <NuxtLink
            to="/dashboard/storefront"
            class="text-xs font-semibold text-gray-600 underline-offset-2 hover:underline dark:text-gray-300"
          >
            View inquiries →
          </NuxtLink>
        </div>

        <p
          v-if="!draft.enabled && draft.slug"
          class="mt-3 text-xs text-amber-700 dark:text-amber-300"
        >
          Turn on “Show storefront” and Save — the public link stays hidden until it is published.
        </p>

        <div
          v-if="draft.enabled && draft.slug"
          class="mt-5 grid gap-4 rounded-2xl border border-gray-100 p-4 dark:border-white/[0.06] sm:grid-cols-[auto_1fr]"
        >
          <div class="flex flex-col items-center gap-2">
            <div
              class="rounded-xl bg-white p-2 ring-1 ring-gray-200 dark:bg-white dark:ring-white/10"
            >
              <img
                v-if="qrDataUrl"
                :src="qrDataUrl"
                alt="Storefront QR code"
                class="h-32 w-32"
                width="128"
                height="128"
              />
              <div v-else class="h-32 w-32 animate-pulse rounded bg-gray-100" />
            </div>
            <a
              v-if="qrDataUrl"
              :href="qrDataUrl"
              :download="`${draft.slug}-storefront-qr.png`"
              class="text-[11px] font-medium text-gray-500 underline-offset-2 hover:underline dark:text-gray-400"
            >
              Download QR
            </a>
          </div>
          <div class="min-w-0 space-y-2">
            <p class="text-sm font-semibold text-gray-900 dark:text-gray-50">Share & track</p>
            <p class="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
              Copy a tracked link for WhatsApp or Instagram. QR opens your public showroom.
            </p>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="btn-outline !min-h-8 !px-3 !text-xs" @click="copyTrackedLink">
                {{ copiedLink ? 'Copied ✓' : 'Copy tracked link' }}
              </button>
              <a
                :href="whatsappShareHref"
                target="_blank"
                rel="noopener"
                class="btn-outline !min-h-8 !px-3 !text-xs inline-flex items-center"
              >
                Share on WhatsApp
              </a>
            </div>
            <div
              v-if="analyticsSummary"
              class="mt-2 grid grid-cols-2 gap-2 text-[11px] text-gray-600 dark:text-gray-300"
            >
              <p>
                <span class="font-semibold text-gray-900 dark:text-gray-100">{{
                  analyticsSummary.storeViews
                }}</span>
                store views
              </p>
              <p>
                <span class="font-semibold text-gray-900 dark:text-gray-100">{{
                  analyticsSummary.productViews
                }}</span>
                product views
              </p>
              <p class="col-span-2">
                <span class="font-semibold text-gray-900 dark:text-gray-100">{{
                  viewsLast7Days
                }}</span>
                views in last 7 days
                <span v-if="pendingInquiryCount" class="text-amber-700 dark:text-amber-300">
                  · {{ pendingInquiryCount }} pending
                </span>
              </p>
            </div>
            <p v-else-if="analyticsError" class="text-[11px] text-gray-400">{{ analyticsError }}</p>
          </div>
        </div>
      </template>
    </DashboardSettingsPanel>

    <DashboardSettingsPanel
      title="Categories on storefront"
      subtitle="Choose which categories appear, and which product fields customers can see. Cost, serials, and supplier fields stay private."
      compact
    >
      <div v-if="!leafFolders.length" class="text-[11px] text-gray-500 dark:text-gray-400">
        Create inventory categories first, then enable them here.
      </div>
      <ul v-else class="divide-y divide-gray-100 dark:divide-white/[0.06]">
        <li v-for="folder in leafFolders" :key="folder.id" class="py-3">
          <label class="flex items-start justify-between gap-3">
            <span>
              <span class="block text-sm font-medium text-gray-900 dark:text-gray-100">{{
                folderLabel(folder)
              }}</span>
              <span class="text-[11px] text-gray-500">{{ folder.itemCount || 0 }} products</span>
            </span>
            <input
              type="checkbox"
              class="mt-1 h-4 w-4 rounded border-gray-300"
              :checked="Boolean(draft.folderPublish[folder.id]?.enabled)"
              :disabled="!canEdit || saving"
              @change="toggleFolder(folder, ($event.target as HTMLInputElement).checked)"
            />
          </label>
          <div
            v-if="draft.folderPublish[folder.id]?.enabled"
            class="mt-2 flex flex-wrap gap-2 pl-0.5"
          >
            <label
              v-for="field in allowlistableFields(folder)"
              :key="field.id"
              class="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] text-gray-700 dark:bg-white/[0.08] dark:text-gray-200"
            >
              <input
                type="checkbox"
                class="h-3 w-3 rounded border-gray-300"
                :checked="draft.folderPublish[folder.id]?.publicFieldIds?.includes(field.id)"
                :disabled="!canEdit || saving"
                @change="toggleField(folder.id, field.id, ($event.target as HTMLInputElement).checked)"
              />
              {{ field.label }}
            </label>
            <p
              v-if="!allowlistableFields(folder).length"
              class="text-[11px] text-gray-500 dark:text-gray-400"
            >
              Only name and price will show (no extra public columns on this template).
            </p>
          </div>
        </li>
      </ul>
    </DashboardSettingsPanel>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import QRCode from 'qrcode'
import DashboardSettingsPanel from '~/components/dashboard/DashboardSettingsPanel.vue'
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

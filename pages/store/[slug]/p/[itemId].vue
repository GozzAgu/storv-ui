<template>
  <div class="ds-root s-c s-sf s-sf--product">
    <header class="s-sf-bar">
      <div class="s-sf-bar__inner">
        <NuxtLink :to="catalogueHref" class="s-sf-bar__back">
          <ArrowLeft :size="18" aria-hidden="true" />
          <span>{{ store?.displayName || 'All products' }}</span>
        </NuxtLink>
        <div class="s-sf-bar__actions">
          <StorefrontThemeButton />
          <SIconButton :label="shareLabel" tooltip @click="shareProduct">
            <Check v-if="shareLabel !== 'Share'" :size="18" aria-hidden="true" />
            <Share2 v-else :size="18" aria-hidden="true" />
          </SIconButton>
        </div>
      </div>
    </header>

    <main class="s-sf-main">
      <div v-if="pending" class="s-sf-detail" aria-hidden="true">
        <SSkeleton height="auto" class="s-sf-detail__skeleton-media" />
        <div class="s-sf-detail__info">
          <SSkeleton height="14px" width="30%" />
          <SSkeleton height="36px" width="85%" />
          <SSkeleton height="28px" width="40%" />
          <SSkeleton :lines="3" height="14px" />
        </div>
      </div>

      <SEmptyState
        v-else-if="error"
        class="s-sf-state"
        title="This product isn’t available"
        :description="error"
      >
        <template #icon><PackageSearch :size="24" /></template>
        <template #actions>
          <SButton :to="catalogueHref">Back to the shop</SButton>
        </template>
      </SEmptyState>

      <article v-else-if="item" class="s-sf-detail">
        <div class="s-sf-detail__media">
          <StorefrontMedia
            :src="item.imageUrl"
            :title="item.title"
            :kind="item.categoryKind"
            :category-name="item.categoryName"
            :category-path="item.categoryPath"
            :alt="item.title"
            size="hero"
          />
        </div>

        <div class="s-sf-detail__info">
          <p v-if="item.categoryPath" class="s-sf-detail__cat">{{ item.categoryPath }}</p>
          <h1 class="s-sf-detail__title">{{ item.title }}</h1>
          <div class="s-sf-detail__price-row">
            <p class="s-sf-detail__price">{{ formatMoney(item.price, item.currency) }}</p>
            <SBadge :tone="availabilityTone" size="md" dot>{{ availabilityLabel }}</SBadge>
          </div>

          <p v-if="item.description" class="s-sf-detail__desc">{{ item.description }}</p>

          <dl v-if="item.attributes?.length" class="s-sf-detail__attrs">
            <div v-for="attr in item.attributes" :key="attr.key" class="s-sf-detail__attr">
              <dt>{{ attr.label }}</dt>
              <dd>{{ attr.value }}</dd>
            </div>
          </dl>

          <p v-if="item.availability === 'reserved' && activePanel !== 'inquiry'" class="s-sf-note">
            <Clock :size="16" aria-hidden="true" />
            This item is on hold for another customer. You can still message the shop.
          </p>

          <div class="s-sf-detail__actions s-sf-detail__actions--inline">
            <SButton
              v-if="canCheckout"
              variant="primary"
              size="lg"
              block
              @click="openPanel('checkout')"
            >
              <template #leading><ShoppingBag :size="18" aria-hidden="true" /></template>
              Pay {{ formatMoney(item.price, item.currency) }}
            </SButton>
            <SButton
              v-else-if="store?.whatsappE164"
              variant="primary"
              size="lg"
              block
              @click="openWhatsApp"
            >
              <template #leading><MessageCircle :size="18" aria-hidden="true" /></template>
              Message on WhatsApp
            </SButton>
            <SButton v-else variant="primary" size="lg" block @click="openPanel('inquiry')">
              <template #leading><MessageCircle :size="18" aria-hidden="true" /></template>
              Contact the shop
            </SButton>
            <SButton
              v-if="canCheckout || store?.whatsappE164"
              size="lg"
              block
              @click="openPanel('inquiry')"
            >
              {{ canReserve ? 'Ask or reserve' : 'Ask the shop' }}
            </SButton>
            <SButton v-else-if="store?.phonePublic" size="lg" block @click="callShop">
              <template #leading><Phone :size="18" aria-hidden="true" /></template>
              Call
            </SButton>
          </div>

          <section
            v-if="activePanel === 'checkout' && canCheckout"
            id="s-sf-action-panel"
            class="s-sf-panel"
            aria-labelledby="s-sf-pay-title"
          >
            <div class="s-sf-panel__head">
              <h2 id="s-sf-pay-title" class="s-sf-panel__title">Pay securely</h2>
              <p class="s-sf-panel__hint">
                You’ll confirm on Paystack. Stock updates automatically when payment succeeds.
              </p>
            </div>
            <form class="s-sf-form" @submit.prevent="submitCheckout">
              <SInput
                v-model="payName"
                label="Your name"
                name="pay-name"
                autocomplete="name"
                required
              />
              <SInput
                v-model="payPhone"
                label="Phone"
                hint="Optional"
                type="tel"
                name="pay-phone"
                autocomplete="tel"
                placeholder="+234…"
              />
              <SInput
                v-model="payEmail"
                label="Email"
                hint="Optional"
                type="email"
                name="pay-email"
                autocomplete="email"
                placeholder="you@email.com"
              />
              <p v-if="checkoutError" class="s-sf-msg s-sf-msg--error" role="alert">
                {{ checkoutError }}
              </p>
              <div class="s-sf-form__actions">
                <SButton variant="ghost" @click="activePanel = null">Cancel</SButton>
                <SButton type="submit" variant="primary" :loading="paying">
                  Pay {{ formatMoney(item.price, item.currency) }}
                </SButton>
              </div>
            </form>
          </section>

          <section
            v-else-if="activePanel === 'inquiry'"
            id="s-sf-action-panel"
            class="s-sf-panel"
            aria-labelledby="s-sf-inquiry-title"
          >
            <div class="s-sf-panel__head">
              <h2 id="s-sf-inquiry-title" class="s-sf-panel__title">
                {{ canReserve ? 'Ask or reserve' : 'Contact the shop' }}
              </h2>
              <p class="s-sf-panel__hint">
                Leave your details and the shop will get back to you. No account needed.
              </p>
            </div>

            <STabs
              v-if="canReserve"
              v-model="inquiryType"
              :tabs="inquiryTabs"
              label="What would you like to do?"
              block
            />

            <div v-if="inquirySuccess" class="s-sf-success" role="status">
              <span class="s-sf-success__icon" aria-hidden="true"><Check :size="18" /></span>
              <p>{{ inquirySuccess }}</p>
            </div>

            <form class="s-sf-form" @submit.prevent="submitInquiry">
              <SInput
                v-model="formName"
                label="Your name"
                name="name"
                autocomplete="name"
                required
              />
              <SInput
                v-model="formPhone"
                label="Phone"
                type="tel"
                name="phone"
                autocomplete="tel"
                placeholder="+234…"
                required
              />
              <STextarea
                v-model="formNote"
                label="Note"
                hint="Optional"
                name="note"
                :rows="3"
                :placeholder="
                  inquiryType === 'reserve'
                    ? 'When can you collect? Any questions?'
                    : 'What would you like to know?'
                "
              />
              <p v-if="inquiryError" class="s-sf-msg s-sf-msg--error" role="alert">
                {{ inquiryError }}
              </p>
              <div class="s-sf-form__actions">
                <SButton variant="ghost" @click="activePanel = null">Cancel</SButton>
                <SButton type="submit" variant="primary" :loading="submitting">
                  {{ inquiryType === 'reserve' ? 'Request reservation' : 'Send message' }}
                </SButton>
              </div>
            </form>
          </section>

          <div
            v-if="store?.collectionInfo || store?.warrantyInfo || hasSecondaryContacts"
            class="s-sf-about"
          >
            <h2 class="s-sf-about__title">Good to know</h2>
            <dl v-if="store?.collectionInfo || store?.warrantyInfo" class="s-sf-about__facts">
              <div v-if="store?.collectionInfo">
                <dt>Collection &amp; delivery</dt>
                <dd>{{ store.collectionInfo }}</dd>
              </div>
              <div v-if="store?.warrantyInfo">
                <dt>Warranty &amp; returns</dt>
                <dd>{{ store.warrantyInfo }}</dd>
              </div>
            </dl>
            <nav v-if="hasSecondaryContacts" class="s-sf-contacts" aria-label="Contact the shop">
              <a
                v-if="store?.whatsappE164"
                :href="whatsappHref"
                target="_blank"
                rel="noopener"
                class="s-sf-contact"
              >
                <MessageCircle :size="16" aria-hidden="true" />WhatsApp
              </a>
              <a v-if="store?.phonePublic" :href="`tel:${store.phonePublic}`" class="s-sf-contact">
                <Phone :size="16" aria-hidden="true" />Call
              </a>
              <a
                v-if="store?.emailPublic"
                :href="`mailto:${store.emailPublic}?subject=${encodeURIComponent(item.title)}`"
                class="s-sf-contact"
              >
                <Mail :size="16" aria-hidden="true" />Email
              </a>
            </nav>
          </div>
        </div>

        <div v-if="!activePanel" class="s-sf-dock" role="region" aria-label="Product actions">
          <div class="s-sf-dock__price">
            <span class="s-sf-dock__amount">{{ formatMoney(item.price, item.currency) }}</span>
            <span class="s-sf-dock__avail">{{ availabilityLabel }}</span>
          </div>
          <SButton v-if="canCheckout" variant="primary" size="lg" @click="openPanel('checkout')">
            Pay online
          </SButton>
          <SButton
            v-else-if="store?.whatsappE164"
            variant="primary"
            size="lg"
            @click="openWhatsApp"
          >
            <template #leading><MessageCircle :size="18" aria-hidden="true" /></template>
            WhatsApp
          </SButton>
          <SButton v-else variant="primary" size="lg" @click="openPanel('inquiry')">
            Contact shop
          </SButton>
          <SIconButton
            v-if="canCheckout || store?.whatsappE164"
            variant="secondary"
            :label="canReserve ? 'Ask or reserve' : 'Ask the shop'"
            @click="openPanel('inquiry')"
          >
            <Mail :size="18" aria-hidden="true" />
          </SIconButton>
          <SIconButton
            v-else-if="store?.phonePublic"
            variant="secondary"
            label="Call the shop"
            @click="callShop"
          >
            <Phone :size="18" aria-hidden="true" />
          </SIconButton>
        </div>
      </article>
    </main>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeft,
  Check,
  Clock,
  Mail,
  MessageCircle,
  PackageSearch,
  Phone,
  Share2,
  ShoppingBag,
} from '@lucide/vue'
import type {
  StorefrontInquiryType,
  StorefrontPublicItemView,
  StorefrontPublicStoreView,
} from '~/types/storefront'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SIconButton from '~/components/s/SIconButton.vue'
import SInput from '~/components/s/SInput.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import STabs from '~/components/s/STabs.vue'
import STextarea from '~/components/s/STextarea.vue'
import StorefrontMedia from '~/components/storefront/StorefrontMedia.vue'
import StorefrontThemeButton from '~/components/storefront/StorefrontThemeButton.vue'
import {
  buildStorefrontShareMessage,
  buildStorefrontWhatsAppShareHref,
  fetchErrorMessage,
  formatStorefrontMoney,
  storefrontAbsoluteUrl,
  withStorefrontUtm,
} from '~/utils/storefront-share'
import { storefrontProductPath, storefrontPublicPath } from '~/utils/storefront-slug'

definePageMeta({
  layout: false,
})

const route = useRoute()
const slug = computed(() => String(route.params.slug || '').toLowerCase())
const itemId = computed(() => String(route.params.itemId || ''))
const { ping } = useStorefrontViewPing()

const pending = ref(true)
const error = ref('')
const store = ref<StorefrontPublicStoreView | null>(null)
const item = ref<StorefrontPublicItemView | null>(null)
const shareLabel = ref('Share')

const inquiryType = ref<StorefrontInquiryType>('contact')
const inquiryTabs = [
  { value: 'contact', label: 'Ask a question' },
  { value: 'reserve', label: 'Request a hold' },
]
const formName = ref('')
const formPhone = ref('')
const formNote = ref('')
const submitting = ref(false)
const inquiryError = ref('')
const inquirySuccess = ref('')

const payName = ref('')
const payPhone = ref('')
const payEmail = ref('')
const paying = ref(false)
const checkoutError = ref('')

const activePanel = ref<'checkout' | 'inquiry' | null>(null)

const catalogueHref = computed(() =>
  withStorefrontUtm(storefrontPublicPath(slug.value), {
    source: 'storefront',
    medium: 'product_back',
    campaign: slug.value,
  })
)

const canReserve = computed(
  () => store.value?.allowReservations !== false && item.value?.availability === 'available'
)

const canCheckout = computed(
  () =>
    Boolean(store.value?.acceptsPayments) &&
    store.value?.allowOnlineCheckout === true &&
    item.value?.availability === 'available'
)

const availabilityLabel = computed(() => {
  const a = item.value?.availability
  if (a === 'available') return 'Available now'
  if (a === 'reserved') return 'On hold'
  return 'Unavailable'
})

const availabilityTone = computed(() => {
  const a = item.value?.availability
  if (a === 'available') return 'success'
  if (a === 'reserved') return 'warning'
  return 'neutral'
})

const hasSecondaryContacts = computed(() =>
  Boolean(store.value?.whatsappE164 || store.value?.phonePublic || store.value?.emailPublic)
)

const whatsappHref = computed(() => {
  const n = String(store.value?.whatsappE164 || '').replace(/\D/g, '')
  if (!n || !item.value) return '#'
  const text = encodeURIComponent(
    `Hi, I am interested in "${item.value.title}" (${formatMoney(
      item.value.price,
      item.value.currency
    )}) from your Storvv showroom.`
  )
  return `https://wa.me/${n}?text=${text}`
})

function formatMoney(amount: number, currency?: string | null) {
  return formatStorefrontMoney(amount, currency)
}

function openWhatsApp() {
  window.open(whatsappHref.value, '_blank', 'noopener')
}

function callShop() {
  if (store.value?.phonePublic) window.location.href = `tel:${store.value.phonePublic}`
}

function openPanel(panel: 'checkout' | 'inquiry') {
  activePanel.value = panel
  inquirySuccess.value = ''
  if (import.meta.client) {
    requestAnimationFrame(() => {
      document
        .getElementById('s-sf-action-panel')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
}

async function shareProduct() {
  if (!store.value || !item.value) return
  const origin = window.location.origin
  const url = storefrontAbsoluteUrl(origin, storefrontProductPath(slug.value, item.value.id), {
    source: 'share',
    medium: 'social',
    campaign: slug.value,
    content: item.value.id,
  })
  const message = buildStorefrontShareMessage({
    storeName: store.value.displayName,
    productTitle: item.value.title,
    priceLabel: formatMoney(item.value.price, item.value.currency),
    url,
  })
  try {
    if (navigator.share) {
      await navigator.share({ title: item.value.title, text: message, url })
      shareLabel.value = 'Shared'
      return
    }
  } catch {
    /* fall through */
  }
  try {
    await navigator.clipboard.writeText(url)
    shareLabel.value = 'Link copied'
  } catch {
    window.open(buildStorefrontWhatsAppShareHref(message), '_blank', 'noopener')
    shareLabel.value = 'Shared'
  }
  setTimeout(() => {
    shareLabel.value = 'Share'
  }, 2000)
}

async function load() {
  pending.value = true
  error.value = ''
  inquirySuccess.value = ''
  inquiryError.value = ''
  activePanel.value = null
  try {
    const data = await $fetch<{ store: StorefrontPublicStoreView; item: StorefrontPublicItemView }>(
      `/api/storefront/${slug.value}/items/${itemId.value}`
    )
    store.value = data.store
    item.value = data.item
    inquiryType.value = 'contact'
    ping(slug.value, data.item.id)

    const origin = import.meta.client ? window.location.origin : ''
    const pageUrl = storefrontAbsoluteUrl(origin, storefrontProductPath(slug.value, data.item.id))
    const desc = `${formatMoney(data.item.price, data.item.currency)} · ${
      data.item.availability === 'available'
        ? 'Available'
        : data.item.availability === 'reserved'
        ? 'Reserved'
        : 'Unavailable'
    }. ${data.item.description || data.store.tagline || ''}`.trim()

    useHead({
      title: `${data.item.title} · ${data.store.displayName}`,
      meta: [
        { name: 'description', content: desc },
        { property: 'og:title', content: `${data.item.title} · ${data.store.displayName}` },
        { property: 'og:description', content: desc },
        { property: 'og:url', content: pageUrl },
        ...(data.item.imageUrl || data.store.logoUrl
          ? [{ property: 'og:image', content: data.item.imageUrl || data.store.logoUrl }]
          : []),
      ],
      link: [{ rel: 'canonical', href: pageUrl }],
    })
  } catch (e) {
    error.value = fetchErrorMessage(e, 'Product not found')
  } finally {
    pending.value = false
  }
}

async function submitCheckout() {
  checkoutError.value = ''
  if (!item.value) return
  paying.value = true
  try {
    const res = await $fetch<{ url: string }>(`/api/storefront/${slug.value}/checkout`, {
      method: 'POST',
      body: {
        listingId: item.value.id,
        customerName: payName.value,
        customerPhone: payPhone.value,
        customerEmail: payEmail.value,
      },
    })
    item.value = { ...item.value, availability: 'reserved' }
    if (res.url) {
      window.location.href = res.url
      return
    }
    checkoutError.value = 'Checkout link missing. Try again.'
  } catch (e) {
    checkoutError.value = fetchErrorMessage(e, 'Could not start checkout')
  } finally {
    paying.value = false
  }
}

async function submitInquiry() {
  inquiryError.value = ''
  inquirySuccess.value = ''
  if (!item.value) return

  const type: StorefrontInquiryType =
    inquiryType.value === 'reserve' && canReserve.value ? 'reserve' : 'contact'

  submitting.value = true
  try {
    const res = await $fetch<{ success: boolean; message?: string }>(
      `/api/storefront/${slug.value}/inquiries`,
      {
        method: 'POST',
        body: {
          type,
          customerName: formName.value,
          customerPhone: formPhone.value,
          customerNote: formNote.value,
          listingId: item.value.id,
        },
      }
    )
    inquirySuccess.value = res.message || 'Sent. The shop will be in touch.'
    formNote.value = ''
    if (type === 'reserve') {
      item.value = { ...item.value, availability: 'reserved' }
      inquiryType.value = 'contact'
    }
  } catch (e) {
    inquiryError.value = fetchErrorMessage(e, 'Could not send. Try again.')
  } finally {
    submitting.value = false
  }
}

watch([slug, itemId], () => void load(), { immediate: true })
</script>

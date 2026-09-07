<template>
  <div class="sf" :class="{ 'sf--dark': isDark }">
    <header class="sf-chrome">
      <div class="sf-chrome__inner">
        <NuxtLink :to="catalogueHref" class="sf-chrome__back">
          <span aria-hidden="true">←</span>
          {{ store?.displayName || 'All products' }}
        </NuxtLink>
        <div class="sf-chrome__actions">
          <ThemeToggle />
          <button type="button" class="sf-btn sf-btn--ghost" @click="shareProduct">
            {{ shareLabel }}
          </button>
        </div>
      </div>
    </header>

    <div v-if="pending" class="sf-state">Loading product…</div>
    <div v-else-if="error" class="sf-state sf-state--error">{{ error }}</div>

    <article v-else-if="item" class="sf-detail">
      <StorefrontMedia
        :src="item.imageUrl"
        :title="item.title"
        :seed="item.id"
        :category-name="item.categoryName"
        :category-path="item.categoryPath"
        :alt="item.title"
        size="hero"
      />

      <div class="sf-detail__panel">
        <p v-if="item.categoryPath" class="sf-detail__cat">{{ item.categoryPath }}</p>
        <h1 class="sf-detail__title">{{ item.title }}</h1>
        <div class="sf-detail__price-row">
          <p class="sf-detail__price">{{ formatMoney(item.price, item.currency) }}</p>
          <span
            class="sf-detail__avail"
            :class="{
              'is-yes': item.availability === 'available',
              'is-hold': item.availability === 'reserved',
              'is-no': item.availability === 'unavailable',
            }"
          >
            {{ availabilityLabel }}
          </span>
        </div>

        <p class="sf-detail__guide">
          Choose how you want to continue below. Pay online if available, or contact the shop. No
          account needed.
        </p>

        <p v-if="item.description" class="sf-detail__desc">{{ item.description }}</p>

        <dl v-if="item.attributes?.length" class="sf-detail__attrs">
          <div v-for="attr in item.attributes" :key="attr.key" class="sf-detail__row">
            <dt>{{ attr.label }}</dt>
            <dd>{{ attr.value }}</dd>
          </div>
        </dl>

        <section
          v-if="activePanel === 'checkout' && canCheckout"
          id="sf-action-panel"
          class="sf-panel"
        >
          <h2 class="sf-panel__title">Pay securely</h2>
          <p class="sf-panel__hint">
            You’ll confirm on Paystack. Stock updates automatically when payment succeeds.
          </p>
          <form class="sf-form" @submit.prevent="submitCheckout">
            <label class="sf-field">
              <span>Your name</span>
              <input v-model="payName" type="text" name="pay-name" autocomplete="name" required />
            </label>
            <label class="sf-field">
              <span>Phone (optional)</span>
              <input
                v-model="payPhone"
                type="tel"
                name="pay-phone"
                autocomplete="tel"
                placeholder="+234…"
              />
            </label>
            <label class="sf-field">
              <span>Email (optional)</span>
              <input
                v-model="payEmail"
                type="email"
                name="pay-email"
                autocomplete="email"
                placeholder="you@email.com"
              />
            </label>
            <p v-if="checkoutError" class="sf-msg sf-msg--error">{{ checkoutError }}</p>
            <button type="submit" class="sf-btn sf-btn--primary sf-btn--block" :disabled="paying">
              {{ paying ? 'Preparing checkout…' : `Pay ${formatMoney(item.price, item.currency)}` }}
            </button>
            <button type="button" class="sf-text-btn" @click="activePanel = null">Cancel</button>
          </form>
        </section>

        <section
          v-else-if="activePanel === 'inquiry'"
          id="sf-action-panel"
          class="sf-panel"
        >
          <h2 class="sf-panel__title">
            {{ canReserve ? 'Contact or reserve' : 'Contact the shop' }}
          </h2>
          <p class="sf-panel__hint">
            Leave your details. The shop will reply. No account needed.
          </p>

          <div v-if="canReserve" class="sf-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              class="sf-tab"
              :class="{ 'is-on': inquiryType === 'contact' }"
              :aria-selected="inquiryType === 'contact'"
              @click="inquiryType = 'contact'"
            >
              Ask a question
            </button>
            <button
              type="button"
              role="tab"
              class="sf-tab"
              :class="{ 'is-on': inquiryType === 'reserve' }"
              :aria-selected="inquiryType === 'reserve'"
              @click="inquiryType = 'reserve'"
            >
              Request hold
            </button>
          </div>

          <form class="sf-form" @submit.prevent="submitInquiry">
            <label class="sf-field">
              <span>Your name</span>
              <input v-model="formName" type="text" name="name" autocomplete="name" required />
            </label>
            <label class="sf-field">
              <span>Phone</span>
              <input
                v-model="formPhone"
                type="tel"
                name="phone"
                autocomplete="tel"
                required
                placeholder="+234…"
              />
            </label>
            <label class="sf-field">
              <span>Note (optional)</span>
              <textarea
                v-model="formNote"
                name="note"
                rows="3"
                :placeholder="
                  inquiryType === 'reserve'
                    ? 'When can you collect? Any questions?'
                    : 'What would you like to know?'
                "
              />
            </label>
            <p v-if="inquiryError" class="sf-msg sf-msg--error">{{ inquiryError }}</p>
            <p v-if="inquirySuccess" class="sf-msg sf-msg--ok">{{ inquirySuccess }}</p>
            <button type="submit" class="sf-btn sf-btn--primary sf-btn--block" :disabled="submitting">
              {{
                submitting
                  ? 'Sending…'
                  : inquiryType === 'reserve'
                    ? 'Request reservation'
                    : 'Send message'
              }}
            </button>
            <button type="button" class="sf-text-btn" @click="activePanel = null">Cancel</button>
          </form>
        </section>

        <p v-if="item.availability === 'reserved' && activePanel !== 'inquiry'" class="sf-note">
          This item is on hold for another customer. You can still message the shop.
        </p>

        <details
          v-if="store?.collectionInfo || store?.warrantyInfo || hasSecondaryContacts"
          class="sf-more"
        >
          <summary>Shop info &amp; other ways to reach them</summary>
          <p v-if="store?.collectionInfo">{{ store.collectionInfo }}</p>
          <p v-if="store?.warrantyInfo">{{ store.warrantyInfo }}</p>
          <nav v-if="hasSecondaryContacts" class="sf-more__links">
            <a
              v-if="store?.whatsappE164"
              :href="whatsappHref"
              target="_blank"
              rel="noopener"
              >WhatsApp</a
            >
            <a v-if="store?.phonePublic" :href="`tel:${store.phonePublic}`">Call</a>
            <a
              v-if="store?.emailPublic"
              :href="`mailto:${store.emailPublic}?subject=${encodeURIComponent(item.title)}`"
              >Email</a
            >
          </nav>
        </details>
      </div>

      <div class="sf-dock" role="region" aria-label="Product actions">
        <button
          v-if="canCheckout"
          type="button"
          class="sf-btn sf-btn--primary sf-dock__primary"
          @click="openPanel('checkout')"
        >
          Pay online
        </button>
        <a
          v-else-if="store?.whatsappE164"
          :href="whatsappHref"
          class="sf-btn sf-btn--primary sf-dock__primary"
          target="_blank"
          rel="noopener"
        >
          Message on WhatsApp
        </a>
        <button
          v-else
          type="button"
          class="sf-btn sf-btn--primary sf-dock__primary"
          @click="openPanel('inquiry')"
        >
          Contact shop
        </button>

        <button
          v-if="canCheckout || store?.whatsappE164"
          type="button"
          class="sf-btn sf-btn--ghost sf-dock__secondary"
          @click="openPanel('inquiry')"
        >
          {{ canReserve ? 'Ask / reserve' : 'Ask shop' }}
        </button>
        <a
          v-else-if="store?.phonePublic"
          :href="`tel:${store.phonePublic}`"
          class="sf-btn sf-btn--ghost sf-dock__secondary"
        >
          Call
        </a>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { StorefrontInquiryType } from '~/types/storefront'
import ThemeToggle from '~/components/ui/ThemeToggle.vue'
import StorefrontMedia from '~/components/storefront/StorefrontMedia.vue'
import {
  buildStorefrontShareMessage,
  buildStorefrontWhatsAppShareHref,
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
const { actualTheme, initTheme } = useTheme()
const isDark = computed(() => actualTheme.value === 'dark')

onMounted(() => {
  initTheme()
})

const pending = ref(true)
const error = ref('')
const store = ref<any>(null)
const item = ref<any>(null)
const shareLabel = ref('Share')

const inquiryType = ref<StorefrontInquiryType>('contact')
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
  () =>
    store.value?.allowReservations !== false &&
    item.value?.availability === 'available'
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

const hasSecondaryContacts = computed(
  () =>
    Boolean(store.value?.whatsappE164 || store.value?.phonePublic || store.value?.emailPublic)
)

const whatsappHref = computed(() => {
  const n = String(store.value?.whatsappE164 || '').replace(/\D/g, '')
  if (!n || !item.value) return '#'
  const text = encodeURIComponent(
    `Hi, I am interested in "${item.value.title}" (${formatMoney(item.value.price, item.value.currency)}) from your Storvv showroom.`
  )
  return `https://wa.me/${n}?text=${text}`
})

function formatMoney(amount: number, currency?: string | null) {
  return formatStorefrontMoney(amount, currency)
}

function openPanel(panel: 'checkout' | 'inquiry') {
  activePanel.value = panel
  if (import.meta.client) {
    requestAnimationFrame(() => {
      document.getElementById('sf-action-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
    shareLabel.value = 'Copied'
  } catch {
    window.open(buildStorefrontWhatsAppShareHref(message), '_blank', 'noopener')
    shareLabel.value = 'WhatsApp'
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
    const data = await $fetch<{ store: any; item: any }>(
      `/api/storefront/${slug.value}/items/${itemId.value}`
    )
    store.value = data.store
    item.value = data.item
    inquiryType.value = 'contact'
    ping(slug.value, data.item.id)

    const origin = import.meta.client ? window.location.origin : ''
    const pageUrl = storefrontAbsoluteUrl(
      origin,
      storefrontProductPath(slug.value, data.item.id)
    )
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
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Product not found'
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
  } catch (e: any) {
    checkoutError.value = e?.data?.message || e?.message || 'Could not start checkout'
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
    inquirySuccess.value = res.message || 'Sent.'
    formNote.value = ''
    if (type === 'reserve') {
      item.value = { ...item.value, availability: 'reserved' }
      inquiryType.value = 'contact'
    }
  } catch (e: any) {
    inquiryError.value = e?.data?.message || e?.message || 'Could not send. Try again.'
  } finally {
    submitting.value = false
  }
}

watch([slug, itemId], () => void load(), { immediate: true })
</script>

<style scoped>
.sf {
  --sf-ink: #1a1523;
  --sf-muted: rgb(26 21 35 / 0.58);
  --sf-faint: rgb(26 21 35 / 0.42);
  --sf-line: rgb(26 21 35 / 0.1);
  --sf-canvas: #f3f2f0;
  --sf-surface: #ffffff;
  --sf-chrome: rgb(243 242 240 / 0.9);
  --sf-dock: rgb(243 242 240 / 0.94);
  --sf-ok: #047857;
  --sf-hold: #b45309;
  min-height: 100dvh;
  padding-bottom: 6.5rem;
  background: var(--sf-canvas);
  color: var(--sf-ink);
  font-family:
    'Quicksand',
    'Plus Jakarta Sans',
    system-ui,
    sans-serif;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.sf--dark {
  --sf-ink: #f4f1ea;
  --sf-muted: rgb(244 241 234 / 0.68);
  --sf-faint: rgb(244 241 234 / 0.45);
  --sf-line: rgb(255 255 255 / 0.12);
  --sf-canvas: #0c0b0e;
  --sf-surface: #1a1820;
  --sf-chrome: rgb(12 11 14 / 0.92);
  --sf-dock: rgb(12 11 14 / 0.94);
  --sf-ok: #34d399;
  --sf-hold: #fbbf24;
}

.sf-chrome {
  position: sticky;
  top: 0;
  z-index: 30;
  backdrop-filter: blur(12px);
  background: var(--sf-chrome);
  border-bottom: 1px solid var(--sf-line);
}

.sf-chrome__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  max-width: 40rem;
  margin: 0 auto;
  padding: 0.75rem 1.15rem;
}

.sf-chrome__actions {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-shrink: 0;
}

.sf-chrome__back {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--sf-ink);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sf-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.35rem;
  padding: 0.4rem 0.95rem;
  border-radius: 9999px;
  border: 1px solid var(--sf-line);
  background: var(--sf-surface);
  color: var(--sf-ink);
  font-size: 0.8125rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  font-family: inherit;
}

.sf-btn--primary {
  background: var(--sf-ink);
  border-color: transparent;
  color: var(--sf-surface);
}

.sf--dark .sf-btn--primary {
  color: #0c0b0e;
}

.sf-btn--ghost {
  background: transparent;
}

.sf-btn--block {
  width: 100%;
}

.sf-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.sf-state {
  max-width: 40rem;
  margin: 4rem auto;
  padding: 0 1.25rem;
  text-align: center;
  color: var(--sf-muted);
}

.sf-state--error {
  color: #b91c1c;
}

.sf-detail {
  max-width: 40rem;
  margin: 0 auto;
}

.sf-detail__panel {
  padding: 1.25rem 1.15rem 1.5rem;
}

.sf-detail__cat {
  margin: 0;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sf-faint);
}

.sf-detail__title {
  margin: 0.35rem 0 0;
  font-size: clamp(1.55rem, 5vw, 2rem);
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1.15;
}

.sf-detail__price-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.55rem 0.85rem;
  margin-top: 0.75rem;
}

.sf-detail__price {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
}

.sf-detail__avail {
  display: inline-flex;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  background: rgb(26 21 35 / 0.06);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--sf-faint);
}

.sf-detail__avail.is-yes {
  background: rgb(4 120 87 / 0.12);
  color: var(--sf-ok);
}

.sf-detail__avail.is-hold {
  background: rgb(180 83 9 / 0.12);
  color: var(--sf-hold);
}

.sf-detail__guide {
  margin: 1rem 0 0;
  padding: 0.75rem 0.85rem;
  border-radius: 0.85rem;
  background: var(--sf-surface);
  border: 1px solid var(--sf-line);
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--sf-muted);
}

.sf-detail__desc {
  margin: 1.15rem 0 0;
  font-size: 0.9375rem;
  line-height: 1.55;
  color: rgb(26 21 35 / 0.78);
}

.sf-detail__attrs {
  margin: 1.35rem 0 0;
  padding: 0;
  border-top: 1px solid var(--sf-line);
}

.sf-detail__row {
  display: grid;
  grid-template-columns: minmax(6rem, 8rem) 1fr;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--sf-line);
  font-size: 0.875rem;
}

.sf-detail__row dt {
  margin: 0;
  color: var(--sf-faint);
  font-weight: 650;
}

.sf-detail__row dd {
  margin: 0;
  font-weight: 650;
}

.sf-panel {
  margin-top: 1.5rem;
  padding: 1.1rem;
  border-radius: 1.1rem;
  background: var(--sf-surface);
  border: 1px solid var(--sf-line);
  scroll-margin-top: 4.5rem;
}

.sf-panel__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.sf-panel__hint {
  margin: 0.35rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--sf-muted);
}

.sf-tabs {
  display: flex;
  gap: 0.4rem;
  margin-top: 1rem;
}

.sf-tab {
  flex: 1;
  min-height: 2.35rem;
  border-radius: 9999px;
  border: 1px solid var(--sf-line);
  background: var(--sf-canvas);
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--sf-muted);
  cursor: pointer;
  font-family: inherit;
}

.sf-tab.is-on {
  background: var(--sf-ink);
  border-color: transparent;
  color: var(--sf-surface);
}

.sf--dark .sf-tab.is-on {
  color: #0c0b0e;
}

.sf-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.sf-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--sf-muted);
}

.sf-field input,
.sf-field textarea {
  min-height: 2.6rem;
  padding: 0.6rem 0.8rem;
  border-radius: 0.8rem;
  border: 1px solid var(--sf-line);
  background: var(--sf-canvas);
  font-size: 1rem;
  font-weight: 500;
  color: var(--sf-ink);
  font-family: inherit;
}

.sf-field textarea {
  min-height: 4.75rem;
  resize: vertical;
}

.sf-msg {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 650;
}

.sf-msg--error {
  color: #b91c1c;
}

.sf-msg--ok {
  color: var(--sf-ok);
}

.sf-text-btn {
  border: 0;
  background: transparent;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--sf-ink);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
  font-family: inherit;
  align-self: center;
}

.sf-note {
  margin: 1rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--sf-hold);
}

.sf-more {
  margin-top: 1.35rem;
  border-radius: 0.95rem;
  border: 1px solid var(--sf-line);
  background: var(--sf-surface);
  padding: 0.85rem 1rem;
}

.sf-more summary {
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: 700;
}

.sf-more p {
  margin: 0.65rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--sf-muted);
}

.sf-more__links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem 1.1rem;
  margin-top: 0.85rem;
}

.sf-more__links a {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--sf-ink);
}

.sf-dock {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1.15rem calc(0.75rem + env(safe-area-inset-bottom));
  background: var(--sf-dock);
  border-top: 1px solid var(--sf-line);
  backdrop-filter: blur(14px);
  max-width: 40rem;
  margin: 0 auto;
}

.sf-dock__primary {
  flex: 1.35;
  min-height: 2.85rem;
  font-size: 0.9rem;
}

.sf-dock__secondary {
  flex: 1;
  min-height: 2.85rem;
}
</style>

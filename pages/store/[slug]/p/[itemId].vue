<template>
  <div class="storefront-page">
    <header class="storefront-page__top">
      <NuxtLink :to="`/store/${slug}`" class="storefront-page__back"
        >&larr; {{ store?.displayName || 'Store' }}</NuxtLink
      >
      <button type="button" class="storefront-share-btn" @click="shareProduct">
        {{ shareLabel }}
      </button>
    </header>

    <div v-if="pending" class="storefront-page__state">Loading...</div>
    <div v-else-if="error" class="storefront-page__state storefront-page__state--error">
      {{ error }}
    </div>
    <article v-else-if="item" class="storefront-detail">
      <div
        v-if="item.imageUrl"
        class="storefront-detail__hero"
        :style="{ backgroundImage: `url(${item.imageUrl})` }"
        role="img"
        :aria-label="item.title"
      />
      <p class="storefront-detail__cat">{{ item.categoryPath }}</p>
      <h1 class="storefront-detail__title">{{ item.title }}</h1>
      <p class="storefront-detail__price">{{ formatMoney(item.price, item.currency) }}</p>
      <p
        class="storefront-detail__avail"
        :class="{
          'is-yes': item.availability === 'available',
          'is-hold': item.availability === 'reserved',
          'is-no': item.availability === 'unavailable',
        }"
      >
        {{ availabilityLabel }}
      </p>

      <p v-if="item.description" class="storefront-detail__desc">{{ item.description }}</p>

      <dl v-if="item.attributes?.length" class="storefront-detail__attrs">
        <div v-for="attr in item.attributes" :key="attr.key" class="storefront-detail__row">
          <dt>{{ attr.label }}</dt>
          <dd>{{ attr.value }}</dd>
        </div>
      </dl>

      <div class="storefront-detail__cta">
        <button
          v-if="canCheckout"
          type="button"
          class="storefront-cta storefront-cta--primary"
          @click="showCheckout = true"
        >
          Pay online
        </button>
        <a
          v-if="store?.whatsappE164"
          :href="whatsappHref"
          class="storefront-cta"
          :class="{ 'storefront-cta--primary': !canCheckout }"
          target="_blank"
          rel="noopener"
          >Message on WhatsApp</a
        >
        <a v-if="store?.phonePublic" :href="`tel:${store.phonePublic}`" class="storefront-cta"
          >Call {{ store.displayName }}</a
        >
        <a
          v-if="store?.emailPublic"
          :href="`mailto:${store.emailPublic}?subject=${encodeURIComponent(item.title)}`"
          class="storefront-cta"
          >Email</a
        >
      </div>

      <section v-if="showCheckout && canCheckout" class="storefront-inquiry">
        <h2 class="storefront-inquiry__title">Pay securely</h2>
        <p class="storefront-inquiry__hint">
          You’ll confirm payment on Paystack. Stock updates automatically when paid.
        </p>
        <form class="storefront-inquiry__form" @submit.prevent="submitCheckout">
          <label class="storefront-inquiry__field">
            <span>Your name</span>
            <input v-model="payName" type="text" name="pay-name" autocomplete="name" required />
          </label>
          <label class="storefront-inquiry__field">
            <span>Phone (optional)</span>
            <input
              v-model="payPhone"
              type="tel"
              name="pay-phone"
              autocomplete="tel"
              placeholder="+234…"
            />
          </label>
          <label class="storefront-inquiry__field">
            <span>Email (optional)</span>
            <input
              v-model="payEmail"
              type="email"
              name="pay-email"
              autocomplete="email"
              placeholder="you@email.com"
            />
          </label>
          <p v-if="checkoutError" class="storefront-inquiry__error">{{ checkoutError }}</p>
          <button type="submit" class="storefront-cta storefront-cta--primary" :disabled="paying">
            {{ paying ? 'Preparing checkout…' : `Pay ${formatMoney(item.price, item.currency)}` }}
          </button>
          <button type="button" class="storefront-link-btn" @click="showCheckout = false">
            Cancel
          </button>
        </form>
      </section>

      <section v-if="showInquirySection" class="storefront-inquiry">
        <h2 class="storefront-inquiry__title">
          {{ canReserve ? 'Contact or reserve' : 'Contact the shop' }}
        </h2>
        <p class="storefront-inquiry__hint">
          No account needed. Leave your details and the shop will reply.
        </p>

        <div v-if="canReserve" class="storefront-inquiry__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            class="storefront-inquiry__tab"
            :class="{ 'is-on': inquiryType === 'contact' }"
            :aria-selected="inquiryType === 'contact'"
            @click="inquiryType = 'contact'"
          >
            Ask a question
          </button>
          <button
            type="button"
            role="tab"
            class="storefront-inquiry__tab"
            :class="{ 'is-on': inquiryType === 'reserve' }"
            :aria-selected="inquiryType === 'reserve'"
            @click="inquiryType = 'reserve'"
          >
            Request hold
          </button>
        </div>

        <form class="storefront-inquiry__form" @submit.prevent="submitInquiry">
          <label class="storefront-inquiry__field">
            <span>Your name</span>
            <input v-model="formName" type="text" name="name" autocomplete="name" required />
          </label>
          <label class="storefront-inquiry__field">
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
          <label class="storefront-inquiry__field">
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

          <p v-if="inquiryError" class="storefront-inquiry__error">{{ inquiryError }}</p>
          <p v-if="inquirySuccess" class="storefront-inquiry__ok">{{ inquirySuccess }}</p>

          <button
            type="submit"
            class="storefront-cta storefront-cta--primary"
            :disabled="submitting"
          >
            {{
              submitting
                ? 'Sending…'
                : inquiryType === 'reserve'
                  ? 'Request reservation'
                  : 'Send message'
            }}
          </button>
        </form>
      </section>

      <p v-else-if="item.availability === 'reserved'" class="storefront-detail__note">
        This item is currently on hold for another customer. You can still message the shop above.
      </p>

      <p v-if="store?.collectionInfo" class="storefront-detail__note">
        {{ store.collectionInfo }}
      </p>
      <p v-if="store?.warrantyInfo" class="storefront-detail__note">{{ store.warrantyInfo }}</p>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { StorefrontInquiryType } from '~/types/storefront'
import {
  buildStorefrontShareMessage,
  buildStorefrontWhatsAppShareHref,
  formatStorefrontMoney,
  storefrontAbsoluteUrl,
} from '~/utils/storefront-share'
import { storefrontProductPath } from '~/utils/storefront-slug'

definePageMeta({
  layout: false,
})

const route = useRoute()
const slug = computed(() => String(route.params.slug || '').toLowerCase())
const itemId = computed(() => String(route.params.itemId || ''))
const { ping } = useStorefrontViewPing()

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

const showCheckout = ref(false)
const payName = ref('')
const payPhone = ref('')
const payEmail = ref('')
const paying = ref(false)
const checkoutError = ref('')

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

const showInquirySection = computed(() => Boolean(item.value))
const availabilityLabel = computed(() => {
  const a = item.value?.availability
  if (a === 'available') return 'Available now'
  if (a === 'reserved') return 'Reserved — on hold'
  return 'Currently unavailable'
})

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
.storefront-page {
  min-height: 100dvh;
  padding: 1.25rem 1.25rem 3rem;
  background: #f5f5f7;
  color: #1a1523;
}
.storefront-page__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 36rem;
  margin: 0 auto 1.75rem;
}
.storefront-page__back,
.storefront-page__brand {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1a1523;
  text-decoration: none;
}
.storefront-share-btn {
  border: 1px solid rgb(26 21 35 / 0.14);
  background: #fff;
  border-radius: 9999px;
  padding: 0.35rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}
.storefront-detail__hero {
  height: min(52vw, 16rem);
  border-radius: 1rem;
  background: center / cover no-repeat #ececef;
  margin-bottom: 1.25rem;
}
.storefront-page__state {
  max-width: 36rem;
  margin: 3rem auto;
  text-align: center;
  color: rgb(26 21 35 / 0.55);
}
.storefront-page__state--error {
  color: #b91c1c;
}
.storefront-detail {
  max-width: 36rem;
  margin: 0 auto;
}
.storefront-detail__cat {
  margin: 0;
  font-size: 0.75rem;
  color: rgb(26 21 35 / 0.45);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.storefront-detail__title {
  margin: 0.35rem 0 0;
  font-size: clamp(1.5rem, 3.5vw, 2rem);
  font-weight: 650;
  letter-spacing: -0.03em;
  line-height: 1.2;
}
.storefront-detail__price {
  margin: 0.75rem 0 0;
  font-size: 1.25rem;
  font-weight: 650;
}
.storefront-detail__avail {
  margin: 0.35rem 0 0;
  font-size: 0.8125rem;
  font-weight: 600;
}
.storefront-detail__avail.is-yes {
  color: #047857;
}
.storefront-detail__avail.is-hold {
  color: #b45309;
}
.storefront-detail__avail.is-no {
  color: rgb(26 21 35 / 0.45);
}
.storefront-detail__desc {
  margin: 1.25rem 0 0;
  font-size: 0.9375rem;
  line-height: 1.55;
  color: rgb(26 21 35 / 0.72);
}
.storefront-detail__attrs {
  margin: 1.5rem 0 0;
  padding: 0;
  border-top: 1px solid rgb(26 21 35 / 0.08);
}
.storefront-detail__row {
  display: grid;
  grid-template-columns: 8rem 1fr;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgb(26 21 35 / 0.08);
  font-size: 0.875rem;
}
.storefront-detail__row dt {
  margin: 0;
  color: rgb(26 21 35 / 0.45);
  font-weight: 500;
}
.storefront-detail__row dd {
  margin: 0;
  font-weight: 550;
}
.storefront-detail__cta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1.75rem;
}
.storefront-cta {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-height: 2.75rem;
  padding: 0.625rem 1rem;
  border-radius: 9999px;
  background: #fff;
  border: 1px solid rgb(26 21 35 / 0.12);
  color: #1a1523;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}
.storefront-cta:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.storefront-cta--primary {
  background: #1a1523;
  border-color: transparent;
  color: #fff;
}
.storefront-detail__note {
  margin: 1rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: rgb(26 21 35 / 0.55);
}
.storefront-inquiry {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgb(26 21 35 / 0.1);
}
.storefront-inquiry__title {
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 650;
  letter-spacing: -0.02em;
}
.storefront-inquiry__hint {
  margin: 0.35rem 0 0;
  font-size: 0.8125rem;
  color: rgb(26 21 35 / 0.55);
  line-height: 1.45;
}
.storefront-inquiry__tabs {
  display: flex;
  gap: 0.35rem;
  margin-top: 1rem;
}
.storefront-inquiry__tab {
  flex: 1;
  min-height: 2.25rem;
  border-radius: 9999px;
  border: 1px solid rgb(26 21 35 / 0.12);
  background: #fff;
  font-size: 0.8125rem;
  font-weight: 600;
  color: rgb(26 21 35 / 0.65);
  cursor: pointer;
}
.storefront-inquiry__tab.is-on {
  background: #1a1523;
  border-color: transparent;
  color: #fff;
}
.storefront-inquiry__form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}
.storefront-inquiry__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(26 21 35 / 0.55);
}
.storefront-inquiry__field input,
.storefront-inquiry__field textarea {
  min-height: 2.5rem;
  padding: 0.55rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid rgb(26 21 35 / 0.14);
  background: #fff;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #1a1523;
  font-family: inherit;
}
.storefront-inquiry__field textarea {
  min-height: 4.5rem;
  resize: vertical;
}
.storefront-inquiry__error {
  margin: 0;
  font-size: 0.8125rem;
  color: #b91c1c;
}
.storefront-inquiry__ok {
  margin: 0;
  font-size: 0.8125rem;
  color: #047857;
}
.storefront-link-btn {
  border: 0;
  background: transparent;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1a1523;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
  margin-top: 0.25rem;
}
</style>

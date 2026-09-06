<template>
  <div class="storefront-page">
    <header class="storefront-page__top">
      <NuxtLink :to="`/store/${slug}`" class="storefront-page__back"
        >&larr; {{ store?.displayName || 'Store' }}</NuxtLink
      >
      <NuxtLink to="/" class="storefront-page__brand">Storvv</NuxtLink>
    </header>

    <div v-if="pending" class="storefront-page__state">Loading...</div>
    <div v-else-if="error" class="storefront-page__state storefront-page__state--error">
      {{ error }}
    </div>
    <article v-else-if="item" class="storefront-detail">
      <p class="storefront-detail__cat">{{ item.categoryPath }}</p>
      <h1 class="storefront-detail__title">{{ item.title }}</h1>
      <p class="storefront-detail__price">{{ formatMoney(item.price, item.currency) }}</p>
      <p
        class="storefront-detail__avail"
        :class="item.availability === 'available' ? 'is-yes' : 'is-no'"
      >
        {{ item.availability === 'available' ? 'Available now' : 'Currently unavailable' }}
      </p>

      <p v-if="item.description" class="storefront-detail__desc">{{ item.description }}</p>

      <dl v-if="item.attributes?.length" class="storefront-detail__attrs">
        <div v-for="attr in item.attributes" :key="attr.key" class="storefront-detail__row">
          <dt>{{ attr.label }}</dt>
          <dd>{{ attr.value }}</dd>
        </div>
      </dl>

      <div class="storefront-detail__cta">
        <a
          v-if="store?.whatsappE164"
          :href="whatsappHref"
          class="storefront-cta storefront-cta--primary"
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

      <p v-if="store?.collectionInfo" class="storefront-detail__note">
        {{ store.collectionInfo }}
      </p>
      <p v-if="store?.warrantyInfo" class="storefront-detail__note">{{ store.warrantyInfo }}</p>
    </article>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
})

const route = useRoute()
const slug = computed(() => String(route.params.slug || '').toLowerCase())
const itemId = computed(() => String(route.params.itemId || ''))

const pending = ref(true)
const error = ref('')
const store = ref<any>(null)
const item = ref<any>(null)

const whatsappHref = computed(() => {
  const n = String(store.value?.whatsappE164 || '').replace(/\D/g, '')
  if (!n || !item.value) return '#'
  const text = encodeURIComponent(
    `Hi, I am interested in "${item.value.title}" (${formatMoney(item.value.price, item.value.currency)}) from your Storvv showroom.`
  )
  return `https://wa.me/${n}?text=${text}`
})

function formatMoney(amount: number, currency?: string | null) {
  const cur = currency || 'NGN'
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: cur,
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0)
  } catch {
    return `${cur} ${Number(amount) || 0}`
  }
}

async function load() {
  pending.value = true
  error.value = ''
  try {
    const data = await $fetch<{ store: any; item: any }>(
      `/api/storefront/${slug.value}/items/${itemId.value}`
    )
    store.value = data.store
    item.value = data.item
    useHead({
      title: `${data.item.title} · ${data.store.displayName}`,
      meta: [
        {
          name: 'description',
          content: `${data.item.title} — ${formatMoney(data.item.price, data.item.currency)}. ${
            data.item.availability === 'available' ? 'Available' : 'Unavailable'
          }.`,
        },
      ],
    })
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Product not found'
  } finally {
    pending.value = false
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
</style>

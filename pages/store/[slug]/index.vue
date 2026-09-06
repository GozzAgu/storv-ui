<template>
  <div class="storefront-page">
    <header class="storefront-page__top">
      <NuxtLink to="/" class="storefront-page__brand">Storvv</NuxtLink>
      <p class="storefront-page__brand-note">Digital showroom</p>
    </header>

    <div v-if="pending" class="storefront-page__state">Loading catalogue...</div>
    <div v-else-if="error" class="storefront-page__state storefront-page__state--error">
      {{ error }}
    </div>
    <template v-else-if="store">
      <section class="storefront-hero">
        <h1 class="storefront-hero__title">{{ store.displayName }}</h1>
        <p v-if="store.tagline" class="storefront-hero__tagline">{{ store.tagline }}</p>
        <p v-if="store.description" class="storefront-hero__desc">{{ store.description }}</p>
        <p v-if="store.city" class="storefront-hero__meta">{{ store.city }}</p>
        <div class="storefront-hero__contacts">
          <a v-if="store.phonePublic" :href="`tel:${store.phonePublic}`" class="storefront-link">Call</a>
          <a
            v-if="store.whatsappE164"
            :href="whatsappHref"
            class="storefront-link"
            target="_blank"
            rel="noopener"
            >WhatsApp</a
          >
          <a v-if="store.emailPublic" :href="`mailto:${store.emailPublic}`" class="storefront-link">Email</a>
          <a
            v-if="store.social?.instagram"
            :href="store.social.instagram"
            class="storefront-link"
            target="_blank"
            rel="noopener"
            >Instagram</a
          >
        </div>
      </section>

      <div class="storefront-filters">
        <input
          v-model="search"
          type="search"
          class="storefront-search"
          placeholder="Search products..."
          @input="debouncedReload"
        />
        <div class="storefront-chips">
          <button
            type="button"
            class="storefront-chip"
            :class="{ 'storefront-chip--on': !category }"
            @click="setCategory('')"
          >
            All
          </button>
          <button
            v-for="c in categories"
            :key="c"
            type="button"
            class="storefront-chip"
            :class="{ 'storefront-chip--on': category === c }"
            @click="setCategory(c)"
          >
            {{ c }}
          </button>
        </div>
      </div>

      <p class="storefront-count">{{ items.length }} product{{ items.length === 1 ? '' : 's' }}</p>

      <ul v-if="items.length" class="storefront-list">
        <li v-for="item in items" :key="item.id">
          <NuxtLink :to="`/store/${slug}/p/${item.id}`" class="storefront-card">
            <div class="storefront-card__main">
              <p class="storefront-card__title">{{ item.title }}</p>
              <p class="storefront-card__cat">{{ item.categoryPath }}</p>
              <p v-if="item.attributes?.length" class="storefront-card__attrs">
                {{
                  item.attributes
                    .slice(0, 3)
                    .map((a) => a.value)
                    .join(' · ')
                }}
              </p>
            </div>
            <div class="storefront-card__side">
              <p class="storefront-card__price">{{ formatMoney(item.price, item.currency) }}</p>
              <span
                class="storefront-card__avail"
                :class="
                  item.availability === 'available'
                    ? 'storefront-card__avail--yes'
                    : 'storefront-card__avail--no'
                "
              >
                {{ item.availability === 'available' ? 'Available' : 'Unavailable' }}
              </span>
            </div>
          </NuxtLink>
        </li>
      </ul>
      <p v-else class="storefront-page__state">No products match these filters.</p>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
})

const route = useRoute()
const slug = computed(() => String(route.params.slug || '').toLowerCase())

const pending = ref(true)
const error = ref('')
const store = ref<any>(null)
const items = ref<any[]>([])
const categories = ref<string[]>([])
const search = ref('')
const category = ref('')

const whatsappHref = computed(() => {
  const n = String(store.value?.whatsappE164 || '').replace(/\D/g, '')
  if (!n) return '#'
  const text = encodeURIComponent(
    `Hi, I am browsing your Storvv showroom (${store.value?.displayName}).`
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

let timer: ReturnType<typeof setTimeout> | null = null
function debouncedReload() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    void load()
  }, 220)
}

function setCategory(c: string) {
  category.value = c
  void load()
}

async function load() {
  if (!slug.value) {
    error.value = 'Store not found'
    pending.value = false
    return
  }
  pending.value = true
  error.value = ''
  try {
    const data = await $fetch<{
      store: any
      items: any[]
      categories: string[]
    }>(`/api/storefront/${slug.value}`, {
      query: {
        q: search.value || undefined,
        category: category.value || undefined,
      },
    })
    store.value = data.store
    items.value = data.items || []
    categories.value = data.categories || []
    useHead({
      title: `${data.store.displayName} · Storvv`,
      meta: [
        {
          name: 'description',
          content:
            data.store.tagline ||
            data.store.description ||
            `Browse available products from ${data.store.displayName}`,
        },
      ],
    })
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Store not found'
    store.value = null
    items.value = []
  } finally {
    pending.value = false
  }
}

watch(slug, () => void load(), { immediate: true })
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
  align-items: baseline;
  justify-content: space-between;
  max-width: 42rem;
  margin: 0 auto 1.75rem;
}
.storefront-page__brand {
  font-weight: 700;
  letter-spacing: -0.03em;
  color: #1a1523;
  text-decoration: none;
}
.storefront-page__brand-note {
  margin: 0;
  font-size: 0.6875rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(26 21 35 / 0.45);
}
.storefront-page__state {
  max-width: 42rem;
  margin: 3rem auto;
  text-align: center;
  color: rgb(26 21 35 / 0.55);
  font-size: 0.9375rem;
}
.storefront-page__state--error {
  color: #b91c1c;
}
.storefront-hero,
.storefront-filters,
.storefront-count,
.storefront-list {
  max-width: 42rem;
  margin-left: auto;
  margin-right: auto;
}
.storefront-hero__title {
  margin: 0;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 650;
  letter-spacing: -0.03em;
  line-height: 1.15;
}
.storefront-hero__tagline {
  margin: 0.5rem 0 0;
  font-size: 1.0625rem;
  color: rgb(26 21 35 / 0.72);
}
.storefront-hero__desc,
.storefront-hero__meta {
  margin: 0.75rem 0 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: rgb(26 21 35 / 0.55);
}
.storefront-hero__contacts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  margin-top: 1rem;
}
.storefront-link {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1a1523;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.storefront-filters {
  margin-top: 1.75rem;
}
.storefront-search {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid rgb(26 21 35 / 0.1);
  border-radius: 0.875rem;
  background: #fff;
  font-size: 0.9375rem;
}
.storefront-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.75rem;
}
.storefront-chip {
  border: 0;
  border-radius: 9999px;
  padding: 0.375rem 0.75rem;
  background: transparent;
  color: rgb(26 21 35 / 0.55);
  font-size: 0.75rem;
  font-weight: 550;
  cursor: pointer;
}
.storefront-chip--on {
  background: #1a1523;
  color: #fff;
}
.storefront-count {
  margin: 1.25rem auto 0.75rem;
  font-size: 0.75rem;
  color: rgb(26 21 35 / 0.45);
}
.storefront-list {
  list-style: none;
  margin: 0 auto;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.storefront-card {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.125rem;
  border-radius: 1rem;
  background: #fff;
  border: 1px solid rgb(26 21 35 / 0.08);
  text-decoration: none;
  color: inherit;
}
.storefront-card__title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: -0.015em;
}
.storefront-card__cat,
.storefront-card__attrs {
  margin: 0.25rem 0 0;
  font-size: 0.75rem;
  color: rgb(26 21 35 / 0.5);
}
.storefront-card__side {
  text-align: right;
  flex-shrink: 0;
}
.storefront-card__price {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 650;
}
.storefront-card__avail {
  display: inline-block;
  margin-top: 0.35rem;
  font-size: 0.6875rem;
  font-weight: 600;
}
.storefront-card__avail--yes {
  color: #047857;
}
.storefront-card__avail--no {
  color: rgb(26 21 35 / 0.45);
}
</style>

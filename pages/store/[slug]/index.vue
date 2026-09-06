<template>
  <div class="storefront-page">
    <header class="storefront-page__top">
      <NuxtLink to="/" class="storefront-page__brand">Storvv</NuxtLink>
      <div class="storefront-page__top-actions">
        <button type="button" class="storefront-share-btn" @click="shareStore">
          {{ shareLabel }}
        </button>
        <p class="storefront-page__brand-note">Digital showroom</p>
      </div>
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
          <a v-if="store.phonePublic" :href="`tel:${store.phonePublic}`" class="storefront-link"
            >Call</a
          >
          <a
            v-if="store.whatsappE164"
            :href="whatsappHref"
            class="storefront-link"
            target="_blank"
            rel="noopener"
            >WhatsApp</a
          >
          <a v-if="store.emailPublic" :href="`mailto:${store.emailPublic}`" class="storefront-link"
            >Email</a
          >
          <a
            v-if="store.social?.instagram"
            :href="store.social.instagram"
            class="storefront-link"
            target="_blank"
            rel="noopener"
            >Instagram</a
          >
        </div>
        <p v-if="store.collectionInfo" class="storefront-hero__note">{{ store.collectionInfo }}</p>
        <p v-if="store.warrantyInfo" class="storefront-hero__note">{{ store.warrantyInfo }}</p>
      </section>

      <section v-if="recent.length && !search && !category" class="storefront-recent">
        <h2 class="storefront-recent__title">Recently added</h2>
        <ul class="storefront-recent__row">
          <li v-for="item in recent" :key="`r-${item.id}`">
            <NuxtLink :to="productHref(item.id)" class="storefront-recent__card">
              <div
                v-if="item.imageUrl"
                class="storefront-recent__img"
                :style="{ backgroundImage: `url(${item.imageUrl})` }"
              />
              <div v-else class="storefront-recent__img storefront-recent__img--empty" />
              <p class="storefront-recent__name">{{ item.title }}</p>
              <p class="storefront-recent__price">{{ formatMoney(item.price, item.currency) }}</p>
            </NuxtLink>
          </li>
        </ul>
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
        <div class="storefront-sort">
          <button
            type="button"
            class="storefront-chip"
            :class="{ 'storefront-chip--on': sort === '' }"
            @click="setSort('')"
          >
            Featured
          </button>
          <button
            type="button"
            class="storefront-chip"
            :class="{ 'storefront-chip--on': sort === 'recent' }"
            @click="setSort('recent')"
          >
            Newest
          </button>
          <button
            type="button"
            class="storefront-chip"
            :class="{ 'storefront-chip--on': sort === 'price_asc' }"
            @click="setSort('price_asc')"
          >
            Price ↑
          </button>
          <button
            type="button"
            class="storefront-chip"
            :class="{ 'storefront-chip--on': sort === 'price_desc' }"
            @click="setSort('price_desc')"
          >
            Price ↓
          </button>
        </div>
      </div>

      <p class="storefront-count">
        {{ items.length }} product{{ items.length === 1 ? '' : 's' }}
        <span v-if="compareIds.length" class="storefront-count__compare">
          · {{ compareIds.length }} selected to compare
        </span>
      </p>

      <ul v-if="items.length" class="storefront-list">
        <li v-for="item in items" :key="item.id" class="storefront-list__item">
          <NuxtLink :to="productHref(item.id)" class="storefront-card">
            <div
              v-if="item.imageUrl"
              class="storefront-card__thumb"
              :style="{ backgroundImage: `url(${item.imageUrl})` }"
            />
            <div class="storefront-card__main">
              <p class="storefront-card__title">{{ item.title }}</p>
              <p class="storefront-card__cat">{{ item.categoryPath }}</p>
              <p v-if="item.attributes?.length" class="storefront-card__attrs">
                {{
                  item.attributes
                    .slice(0, 3)
                    .map((a: { value: string }) => a.value)
                    .join(' · ')
                }}
              </p>
            </div>
            <div class="storefront-card__side">
              <p class="storefront-card__price">{{ formatMoney(item.price, item.currency) }}</p>
              <span
                class="storefront-card__avail"
                :class="{
                  'storefront-card__avail--yes': item.availability === 'available',
                  'storefront-card__avail--hold': item.availability === 'reserved',
                  'storefront-card__avail--no': item.availability === 'unavailable',
                }"
              >
                {{
                  item.availability === 'available'
                    ? 'Available'
                    : item.availability === 'reserved'
                      ? 'Reserved'
                      : 'Unavailable'
                }}
              </span>
            </div>
          </NuxtLink>
          <button
            type="button"
            class="storefront-compare-toggle"
            :class="{ 'is-on': compareIds.includes(item.id) }"
            :disabled="!compareIds.includes(item.id) && compareIds.length >= 3"
            @click="toggleCompare(item.id)"
          >
            {{ compareIds.includes(item.id) ? 'Comparing' : 'Compare' }}
          </button>
        </li>
      </ul>
      <p v-else class="storefront-page__state">No products match these filters.</p>

      <div v-if="compareIds.length >= 2" class="storefront-compare-bar">
        <p class="storefront-compare-bar__label">
          Compare {{ compareIds.length }} items
        </p>
        <button type="button" class="storefront-share-btn" @click="showCompare = true">
          View comparison
        </button>
        <button type="button" class="storefront-link-btn" @click="compareIds = []">Clear</button>
      </div>

      <div
        v-if="showCompare && compareItems.length >= 2"
        class="storefront-compare-modal"
        role="dialog"
        aria-modal="true"
        @click.self="showCompare = false"
      >
        <div class="storefront-compare-panel">
          <header class="storefront-compare-panel__head">
            <h2>Compare</h2>
            <button type="button" class="storefront-link-btn" @click="showCompare = false">
              Close
            </button>
          </header>
          <div class="storefront-compare-grid" :style="{ '--cols': compareItems.length }">
            <div v-for="item in compareItems" :key="item.id" class="storefront-compare-col">
              <div
                v-if="item.imageUrl"
                class="storefront-compare-col__img"
                :style="{ backgroundImage: `url(${item.imageUrl})` }"
              />
              <p class="storefront-compare-col__title">{{ item.title }}</p>
              <p class="storefront-compare-col__price">
                {{ formatMoney(item.price, item.currency) }}
              </p>
              <p class="storefront-compare-col__avail">{{ item.availability }}</p>
              <p class="storefront-compare-col__cat">{{ item.categoryPath }}</p>
              <dl>
                <div v-for="attr in item.attributes || []" :key="attr.key">
                  <dt>{{ attr.label }}</dt>
                  <dd>{{ attr.value }}</dd>
                </div>
              </dl>
              <NuxtLink :to="productHref(item.id)" class="storefront-link">Open →</NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
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
const { ping } = useStorefrontViewPing()

const pending = ref(true)
const error = ref('')
const store = ref<any>(null)
const items = ref<any[]>([])
const recent = ref<any[]>([])
const categories = ref<string[]>([])
const search = ref('')
const category = ref('')
const sort = ref('')
const compareIds = ref<string[]>([])
const showCompare = ref(false)
const shareLabel = ref('Share')

const whatsappHref = computed(() => {
  const n = String(store.value?.whatsappE164 || '').replace(/\D/g, '')
  if (!n) return '#'
  const text = encodeURIComponent(
    `Hi, I am browsing your Storvv showroom (${store.value?.displayName}).`
  )
  return `https://wa.me/${n}?text=${text}`
})

const compareItems = computed(() =>
  compareIds.value
    .map((id) => items.value.find((i) => i.id === id) || recent.value.find((i) => i.id === id))
    .filter(Boolean)
)

function formatMoney(amount: number, currency?: string | null) {
  return formatStorefrontMoney(amount, currency)
}

function productHref(itemId: string) {
  return withStorefrontUtm(storefrontProductPath(slug.value, itemId), {
    source: 'storefront',
    medium: 'catalogue',
    campaign: slug.value,
  })
}

function storeShareUrl() {
  const origin = import.meta.client ? window.location.origin : ''
  return storefrontAbsoluteUrl(origin, storefrontPublicPath(slug.value), {
    source: 'share',
    medium: 'social',
    campaign: slug.value,
  })
}

async function shareStore() {
  if (!store.value) return
  const url = storeShareUrl()
  const message = buildStorefrontShareMessage({
    storeName: store.value.displayName,
    url,
  })
  try {
    if (navigator.share) {
      await navigator.share({ title: store.value.displayName, text: message, url })
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

function toggleCompare(id: string) {
  const set = new Set(compareIds.value)
  if (set.has(id)) set.delete(id)
  else if (set.size < 3) set.add(id)
  compareIds.value = Array.from(set)
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

function setSort(s: string) {
  sort.value = s
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
      recent?: any[]
      categories: string[]
    }>(`/api/storefront/${slug.value}`, {
      query: {
        q: search.value || undefined,
        category: category.value || undefined,
        sort: sort.value || undefined,
      },
    })
    store.value = data.store
    items.value = data.items || []
    recent.value = data.recent || []
    categories.value = data.categories || []
    ping(slug.value)

    const origin = import.meta.client ? window.location.origin : ''
    const pageUrl = storefrontAbsoluteUrl(origin, storefrontPublicPath(slug.value))
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
        { property: 'og:title', content: `${data.store.displayName} · Storvv` },
        {
          property: 'og:description',
          content:
            data.store.tagline ||
            data.store.description ||
            `Browse available products from ${data.store.displayName}`,
        },
        { property: 'og:url', content: pageUrl },
        ...(data.store.logoUrl
          ? [{ property: 'og:image', content: data.store.logoUrl }]
          : []),
      ],
      link: [{ rel: 'canonical', href: pageUrl }],
    })
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Store not found'
    store.value = null
    items.value = []
    recent.value = []
  } finally {
    pending.value = false
  }
}

watch(slug, () => void load(), { immediate: true })
</script>

<style scoped>
.storefront-page {
  min-height: 100dvh;
  padding: 1.25rem 1.25rem 5rem;
  background: #f5f5f7;
  color: #1a1523;
}
.storefront-page__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 42rem;
  margin: 0 auto 1.75rem;
  gap: 1rem;
}
.storefront-page__top-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
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
.storefront-share-btn {
  border: 1px solid rgb(26 21 35 / 0.14);
  background: #fff;
  border-radius: 9999px;
  padding: 0.35rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
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
.storefront-list,
.storefront-recent {
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
.storefront-hero__meta,
.storefront-hero__note {
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
.storefront-link-btn {
  border: 0;
  background: transparent;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1a1523;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}
.storefront-recent {
  margin-top: 1.75rem;
}
.storefront-recent__title {
  margin: 0 0 0.75rem;
  font-size: 0.8125rem;
  font-weight: 650;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgb(26 21 35 / 0.45);
}
.storefront-recent__row {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(7.5rem, 1fr);
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
}
.storefront-recent__card {
  display: block;
  text-decoration: none;
  color: inherit;
  background: #fff;
  border: 1px solid rgb(26 21 35 / 0.08);
  border-radius: 0.875rem;
  overflow: hidden;
  padding-bottom: 0.65rem;
}
.storefront-recent__img {
  height: 5.5rem;
  background: center / cover no-repeat #ececef;
}
.storefront-recent__img--empty {
  background: linear-gradient(135deg, #ececef, #f7f7f8);
}
.storefront-recent__name,
.storefront-recent__price {
  margin: 0.4rem 0.55rem 0;
  font-size: 0.75rem;
}
.storefront-recent__name {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.storefront-recent__price {
  font-weight: 650;
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
.storefront-chips,
.storefront-sort {
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
.storefront-count__compare {
  color: #1a1523;
  font-weight: 600;
}
.storefront-list {
  list-style: none;
  margin: 0 auto;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.storefront-list__item {
  position: relative;
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
  align-items: stretch;
}
.storefront-card__thumb {
  width: 3.5rem;
  flex-shrink: 0;
  border-radius: 0.65rem;
  background: center / cover no-repeat #ececef;
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
.storefront-card__avail--hold {
  color: #b45309;
}
.storefront-card__avail--no {
  color: rgb(26 21 35 / 0.45);
}
.storefront-compare-toggle {
  position: absolute;
  right: 0.75rem;
  bottom: 0.55rem;
  border: 0;
  background: transparent;
  font-size: 0.6875rem;
  font-weight: 650;
  color: rgb(26 21 35 / 0.45);
  cursor: pointer;
}
.storefront-compare-toggle.is-on {
  color: #1a1523;
}
.storefront-compare-bar {
  position: fixed;
  left: 50%;
  bottom: 1.25rem;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 1rem;
  border-radius: 9999px;
  background: #1a1523;
  color: #fff;
  box-shadow: 0 10px 30px rgb(26 21 35 / 0.2);
  z-index: 20;
}
.storefront-compare-bar__label {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 600;
}
.storefront-compare-bar .storefront-share-btn {
  background: #fff;
}
.storefront-compare-bar .storefront-link-btn {
  color: #fff;
}
.storefront-compare-modal {
  position: fixed;
  inset: 0;
  background: rgb(26 21 35 / 0.45);
  z-index: 40;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 1rem;
}
.storefront-compare-panel {
  width: min(42rem, 100%);
  max-height: 85dvh;
  overflow: auto;
  background: #fff;
  border-radius: 1.25rem;
  padding: 1rem 1rem 1.5rem;
}
.storefront-compare-panel__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.storefront-compare-panel__head h2 {
  margin: 0;
  font-size: 1.0625rem;
}
.storefront-compare-grid {
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  gap: 0.75rem;
}
.storefront-compare-col__img {
  height: 5rem;
  border-radius: 0.75rem;
  background: center / cover no-repeat #ececef;
  margin-bottom: 0.5rem;
}
.storefront-compare-col__title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 650;
}
.storefront-compare-col__price {
  margin: 0.25rem 0 0;
  font-weight: 650;
  font-size: 0.875rem;
}
.storefront-compare-col__avail,
.storefront-compare-col__cat {
  margin: 0.2rem 0 0;
  font-size: 0.75rem;
  color: rgb(26 21 35 / 0.5);
  text-transform: capitalize;
}
.storefront-compare-col dl {
  margin: 0.75rem 0;
  padding: 0;
}
.storefront-compare-col dt {
  margin: 0.45rem 0 0;
  font-size: 0.6875rem;
  color: rgb(26 21 35 / 0.45);
}
.storefront-compare-col dd {
  margin: 0.1rem 0 0;
  font-size: 0.8125rem;
  font-weight: 550;
}
@media (max-width: 640px) {
  .storefront-compare-grid {
    grid-template-columns: 1fr;
  }
}
</style>

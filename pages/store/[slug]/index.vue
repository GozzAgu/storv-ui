<template>
  <div class="sf" :class="{ 'sf--dark': isDark }">
    <header class="sf-chrome">
      <div class="sf-chrome__inner">
        <div class="sf-chrome__brand">
          <img
            v-if="store?.logoUrl"
            :src="store.logoUrl"
            alt=""
            class="sf-chrome__logo"
            width="36"
            height="36"
          />
          <div class="sf-chrome__identity">
            <p class="sf-chrome__name">{{ store?.displayName || 'Showroom' }}</p>
            <p v-if="store?.city" class="sf-chrome__meta">{{ store.city }}</p>
          </div>
        </div>
        <div class="sf-chrome__actions">
          <ThemeToggle />
          <a
            v-if="primaryContactHref"
            :href="primaryContactHref"
            class="sf-btn sf-btn--ghost"
            :target="primaryContactIsExternal ? '_blank' : undefined"
            :rel="primaryContactIsExternal ? 'noopener' : undefined"
          >
            {{ primaryContactLabel }}
          </a>
          <button type="button" class="sf-btn sf-btn--ghost" @click="shareStore">
            {{ shareLabel }}
          </button>
        </div>
      </div>
    </header>

    <div v-if="pending" class="sf-state">Loading catalogue…</div>
    <div v-else-if="error" class="sf-state sf-state--error">{{ error }}</div>

    <template v-else-if="store">
      <section class="sf-hero">
        <p class="sf-hero__eyebrow">Digital showroom</p>
        <h1 class="sf-hero__title">{{ store.displayName }}</h1>
        <p class="sf-hero__tagline">
          {{ store.tagline || 'Browse what’s available, then message the shop or pay online.' }}
        </p>
        <div class="sf-hero__steps" aria-label="How to use this showroom">
          <p><span>1</span> Open a category</p>
          <p><span>2</span> Pick a product</p>
          <p><span>3</span> Pay or contact the shop</p>
        </div>
        <a href="#catalogue" class="sf-btn sf-btn--primary sf-hero__cta">Browse catalogue</a>
      </section>

      <section
        v-if="recent.length && !search && !folderPath"
        class="sf-section sf-recent"
        aria-labelledby="sf-recent-title"
      >
        <div class="sf-section__head">
          <h2 id="sf-recent-title" class="sf-section__title">Just in</h2>
          <p class="sf-section__hint">Newest arrivals. Tap any item for details</p>
        </div>
        <ul class="sf-recent__row">
          <li v-for="item in recent" :key="`r-${item.id}`">
            <NuxtLink :to="productHref(item.id)" class="sf-recent__card">
              <StorefrontMedia
                :src="item.imageUrl"
                :title="item.title"
                :seed="item.id"
                :category-name="item.categoryName"
                :category-path="item.categoryPath"
                size="recent"
              />
              <p class="sf-recent__name">{{ item.title }}</p>
              <p class="sf-recent__price">{{ formatMoney(item.price, item.currency) }}</p>
            </NuxtLink>
          </li>
        </ul>
      </section>

      <section id="catalogue" class="sf-section sf-catalogue" aria-labelledby="sf-catalogue-title">
        <div class="sf-section__head">
          <h2 id="sf-catalogue-title" class="sf-section__title">
            {{ catalogueTitle }}
          </h2>
          <p class="sf-section__hint">{{ catalogueHint }}</p>
        </div>

        <nav v-if="!isSearchMode && folderPath" class="sf-crumbs" aria-label="Catalogue location">
          <button type="button" class="sf-crumbs__link" @click="openFolder('')">
            Categories
          </button>
          <template v-if="folderParentPath">
            <span class="sf-crumbs__sep" aria-hidden="true">/</span>
            <button type="button" class="sf-crumbs__link" @click="openFolder(folderParentPath)">
              {{ folderParentName }}
            </button>
          </template>
          <span class="sf-crumbs__sep" aria-hidden="true">/</span>
          <span class="sf-crumbs__here">{{ currentFolderName }}</span>
        </nav>

        <label class="sf-search">
          <span class="sf-sr-only">Search products</span>
          <input
            v-model="search"
            type="search"
            placeholder="Search by name…"
            autocomplete="off"
            @input="debouncedReload"
          />
        </label>

        <div v-if="isSearchMode || showingProducts" class="sf-filter-block">
          <p class="sf-filter-label">Sort</p>
          <div class="sf-chips" role="group" aria-label="Sort products">
            <button
              type="button"
              class="sf-chip"
              :class="{ 'is-on': sort === '' }"
              @click="setSort('')"
            >
              Featured
            </button>
            <button
              type="button"
              class="sf-chip"
              :class="{ 'is-on': sort === 'recent' }"
              @click="setSort('recent')"
            >
              Newest
            </button>
            <button
              type="button"
              class="sf-chip"
              :class="{ 'is-on': sort === 'price_asc' }"
              @click="setSort('price_asc')"
            >
              Lowest price
            </button>
            <button
              type="button"
              class="sf-chip"
              :class="{ 'is-on': sort === 'price_desc' }"
              @click="setSort('price_desc')"
            >
              Highest price
            </button>
          </div>
        </div>

        <p class="sf-count" aria-live="polite">
          <template v-if="isSearchMode || showingProducts">
            {{ visibleProducts.length }} product{{ visibleProducts.length === 1 ? '' : 's' }}
            <span v-if="compareIds.length"> · {{ compareIds.length }} selected to compare</span>
          </template>
          <template v-else>
            {{ visibleFolders.length }} categor{{ visibleFolders.length === 1 ? 'y' : 'ies' }}
          </template>
        </p>

        <!-- Folder tiles (root or subcategory hub) -->
        <ul v-if="!isSearchMode && !showingProducts && visibleFolders.length" class="sf-folders">
          <li v-for="folder in visibleFolders" :key="folder.path">
            <button type="button" class="sf-folder" @click="openFolder(folder.path)">
              <StorefrontMedia
                :title="folder.name"
                :seed="folder.path"
                :category-name="folder.name"
                :category-path="folder.path"
                size="folder"
              />
              <span class="sf-folder__body">
                <span class="sf-folder__name">{{ folder.name }}</span>
                <span class="sf-folder__meta">
                  <template v-if="folder.childCount > 0">
                    {{ folder.childCount }} subcategor{{ folder.childCount === 1 ? 'y' : 'ies' }}
                    · {{ folder.itemCount }} product{{ folder.itemCount === 1 ? '' : 's' }}
                  </template>
                  <template v-else>
                    {{ folder.itemCount }} product{{ folder.itemCount === 1 ? '' : 's' }}
                  </template>
                </span>
              </span>
            </button>
          </li>
        </ul>

        <!-- Product grid -->
        <ul v-else-if="(isSearchMode || showingProducts) && visibleProducts.length" class="sf-grid">
          <li v-for="item in visibleProducts" :key="item.id" class="sf-grid__item">
            <NuxtLink :to="productHref(item.id)" class="sf-card">
              <div class="sf-card__media-wrap">
                <StorefrontMedia
                  :src="item.imageUrl"
                  :title="item.title"
                  :seed="item.id"
                  :category-name="item.categoryName"
                  :category-path="item.categoryPath"
                  size="card"
                >
                  <span
                    class="sf-card__badge"
                    :class="{
                      'is-yes': item.availability === 'available',
                      'is-hold': item.availability === 'reserved',
                      'is-no': item.availability === 'unavailable',
                    }"
                  >
                    {{
                      item.availability === 'available'
                        ? 'Available'
                        : item.availability === 'reserved'
                          ? 'On hold'
                          : 'Sold'
                    }}
                  </span>
                </StorefrontMedia>
              </div>
              <div class="sf-card__body">
                <p class="sf-card__title">{{ item.title }}</p>
                <p class="sf-card__price">{{ formatMoney(item.price, item.currency) }}</p>
                <p v-if="item.categoryPath" class="sf-card__cat">{{ item.categoryPath }}</p>
              </div>
            </NuxtLink>
            <button
              type="button"
              class="sf-card__compare"
              :class="{ 'is-on': compareIds.includes(item.id) }"
              :disabled="!compareIds.includes(item.id) && compareIds.length >= 3"
              :aria-pressed="compareIds.includes(item.id)"
              @click="toggleCompare(item.id)"
            >
              {{ compareIds.includes(item.id) ? 'Selected' : 'Compare' }}
            </button>
          </li>
        </ul>

        <div v-else class="sf-empty">
          <p class="sf-empty__title">
            {{ isSearchMode || showingProducts ? 'No products match' : 'No categories yet' }}
          </p>
          <p class="sf-empty__hint">
            <template v-if="isSearchMode">
              Try a different search, or browse categories instead.
            </template>
            <template v-else-if="showingProducts">
              Nothing listed in this category right now.
            </template>
            <template v-else>
              This shop has not published categories yet.
            </template>
          </p>
          <button
            v-if="search || folderPath"
            type="button"
            class="sf-btn sf-btn--ghost"
            @click="clearFilters"
          >
            {{ search ? 'Clear search' : 'Back to categories' }}
          </button>
        </div>
      </section>

      <footer class="sf-footer">
        <details v-if="store.description || store.collectionInfo || store.warrantyInfo" class="sf-about">
          <summary>About this shop</summary>
          <p v-if="store.description">{{ store.description }}</p>
          <p v-if="store.collectionInfo">{{ store.collectionInfo }}</p>
          <p v-if="store.warrantyInfo">{{ store.warrantyInfo }}</p>
        </details>
        <nav v-if="hasSecondaryContacts" class="sf-footer__contacts" aria-label="Contact">
          <a v-if="store.phonePublic" :href="`tel:${store.phonePublic}`">Call</a>
          <a
            v-if="store.whatsappE164"
            :href="whatsappHref"
            target="_blank"
            rel="noopener"
            >WhatsApp</a
          >
          <a v-if="store.emailPublic" :href="`mailto:${store.emailPublic}`">Email</a>
          <a
            v-if="store.social?.instagram"
            :href="store.social.instagram"
            target="_blank"
            rel="noopener"
            >Instagram</a
          >
        </nav>
        <p class="sf-footer__powered">Powered by Storvv</p>
      </footer>
    </template>

    <div v-if="compareIds.length >= 2" class="sf-compare-bar">
      <p>Compare {{ compareIds.length }} items</p>
      <button type="button" class="sf-btn sf-btn--light" @click="showCompare = true">
        View
      </button>
      <button type="button" class="sf-compare-bar__clear" @click="compareIds = []">Clear</button>
    </div>

    <div
      v-if="showCompare && compareItems.length >= 2"
      class="sf-compare-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Compare products"
      @click.self="showCompare = false"
    >
      <div class="sf-compare-panel">
        <header class="sf-compare-panel__head">
          <h2>Compare</h2>
          <button type="button" class="sf-btn sf-btn--ghost" @click="showCompare = false">
            Close
          </button>
        </header>
        <div class="sf-compare-grid" :style="{ '--cols': compareItems.length }">
          <div v-for="item in compareItems" :key="item.id" class="sf-compare-col">
            <StorefrontMedia
              :src="item.imageUrl"
              :title="item.title"
              :seed="item.id"
              :category-name="item.categoryName"
              :category-path="item.categoryPath"
              size="compare"
            />
            <p class="sf-compare-col__title">{{ item.title }}</p>
            <p class="sf-compare-col__price">{{ formatMoney(item.price, item.currency) }}</p>
            <p class="sf-compare-col__avail">{{ item.availability }}</p>
            <p v-if="item.categoryPath" class="sf-compare-col__cat">{{ item.categoryPath }}</p>
            <dl>
              <div v-for="attr in item.attributes || []" :key="attr.key">
                <dt>{{ attr.label }}</dt>
                <dd>{{ attr.value }}</dd>
              </div>
            </dl>
            <NuxtLink :to="productHref(item.id)" class="sf-btn sf-btn--primary sf-btn--block">
              Open product
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ThemeToggle from '~/components/ui/ThemeToggle.vue'
import StorefrontMedia from '~/components/storefront/StorefrontMedia.vue'
import {
  buildStorefrontFolderTree,
  filterStorefrontItemsByFolderPath,
  findStorefrontFolder,
  parseStorefrontCategoryPath,
  storefrontFolderParentPath,
  type StorefrontFolderNode,
} from '~/utils/storefront-catalogue'
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
const { actualTheme, initTheme } = useTheme()
const isDark = computed(() => actualTheme.value === 'dark')

onMounted(() => {
  initTheme()
})

const pending = ref(true)
const error = ref('')
const store = ref<any>(null)
const items = ref<any[]>([])
const recent = ref<any[]>([])
const search = ref('')
const folderPath = ref('')
const sort = ref('')
const compareIds = ref<string[]>([])
const showCompare = ref(false)
const shareLabel = ref('Share')

const isSearchMode = computed(() => Boolean(search.value.trim()))

const folderTree = computed(() => buildStorefrontFolderTree(items.value))

const currentFolder = computed((): StorefrontFolderNode | null => {
  if (!folderPath.value) return null
  return findStorefrontFolder(folderTree.value, folderPath.value)
})

const showingProducts = computed(() => {
  if (isSearchMode.value) return true
  if (!folderPath.value) return false
  const folder = currentFolder.value
  if (!folder) return true
  return folder.isLeaf
})

const visibleFolders = computed((): StorefrontFolderNode[] => {
  if (isSearchMode.value || showingProducts.value) return []
  if (!folderPath.value) return folderTree.value
  return currentFolder.value?.children ?? []
})

const visibleProducts = computed(() => {
  if (isSearchMode.value) return items.value
  if (!showingProducts.value || !folderPath.value) return []
  return filterStorefrontItemsByFolderPath(items.value, folderPath.value)
})

const folderParentPath = computed(() => storefrontFolderParentPath(folderPath.value))

const folderParentName = computed(() => {
  const parts = parseStorefrontCategoryPath(folderParentPath.value)
  return parts[parts.length - 1] || ''
})

const currentFolderName = computed(() => {
  const parts = parseStorefrontCategoryPath(folderPath.value)
  return parts[parts.length - 1] || folderPath.value
})

const catalogueTitle = computed(() => {
  if (isSearchMode.value) return 'Search results'
  if (!folderPath.value) return 'Categories'
  if (showingProducts.value) return currentFolderName.value || 'Products'
  return currentFolderName.value || 'Subcategories'
})

const catalogueHint = computed(() => {
  if (isSearchMode.value) return 'Matching products across the catalogue'
  if (!folderPath.value) return 'Open a category, then a subcategory when needed'
  if (showingProducts.value) return 'Tap a product to view details and act'
  return 'Choose a subcategory to see products'
})

const whatsappHref = computed(() => {
  const n = String(store.value?.whatsappE164 || '').replace(/\D/g, '')
  if (!n) return '#'
  const text = encodeURIComponent(
    `Hi, I am browsing your Storvv showroom (${store.value?.displayName}).`
  )
  return `https://wa.me/${n}?text=${text}`
})

const primaryContactHref = computed(() => {
  if (store.value?.whatsappE164) return whatsappHref.value
  if (store.value?.phonePublic) return `tel:${store.value.phonePublic}`
  return ''
})

const primaryContactLabel = computed(() =>
  store.value?.whatsappE164 ? 'WhatsApp' : store.value?.phonePublic ? 'Call' : ''
)

const primaryContactIsExternal = computed(() => Boolean(store.value?.whatsappE164))

const hasSecondaryContacts = computed(
  () =>
    Boolean(
      store.value?.phonePublic ||
        store.value?.whatsappE164 ||
        store.value?.emailPublic ||
        store.value?.social?.instagram
    )
)

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
    shareLabel.value = 'Copied'
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

function clearFilters() {
  search.value = ''
  folderPath.value = ''
  void load()
}

function openFolder(path: string) {
  folderPath.value = path
  search.value = ''
  if (import.meta.client) {
    document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

let timer: ReturnType<typeof setTimeout> | null = null
function debouncedReload() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    void load()
  }, 220)
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
        sort: sort.value || undefined,
      },
    })
    store.value = data.store
    items.value = data.items || []
    recent.value = data.recent || []
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
.sf {
  --sf-ink: #1a1523;
  --sf-muted: rgb(26 21 35 / 0.58);
  --sf-faint: rgb(26 21 35 / 0.42);
  --sf-line: rgb(26 21 35 / 0.1);
  --sf-canvas: #f3f2f0;
  --sf-surface: #ffffff;
  --sf-chrome: rgb(243 242 240 / 0.88);
  --sf-ok: #047857;
  --sf-hold: #b45309;
  --sf-chip-bg: #ffffff;
  --sf-empty-bg: rgb(255 255 255 / 0.55);
  min-height: 100dvh;
  padding-bottom: 5.5rem;
  background:
    radial-gradient(ellipse 80% 50% at 50% -10%, rgb(26 21 35 / 0.05), transparent),
    var(--sf-canvas);
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
  --sf-chrome: rgb(12 11 14 / 0.9);
  --sf-ok: #34d399;
  --sf-hold: #fbbf24;
  --sf-chip-bg: #1a1820;
  --sf-empty-bg: rgb(26 24 32 / 0.7);
  background:
    radial-gradient(ellipse 80% 45% at 50% -8%, rgb(154 181 227 / 0.08), transparent),
    var(--sf-canvas);
}

.sf-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
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
  max-width: 44rem;
  margin: 0 auto;
  padding: 0.75rem 1.25rem;
}

.sf-chrome__brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
}

.sf-chrome__logo {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.65rem;
  object-fit: cover;
  background: var(--sf-surface);
  flex-shrink: 0;
}

.sf-chrome__name {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sf-chrome__meta {
  margin: 0.1rem 0 0;
  font-size: 0.6875rem;
  color: var(--sf-faint);
}

.sf-chrome__actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.sf-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.25rem;
  padding: 0.4rem 0.9rem;
  border-radius: 9999px;
  border: 1px solid var(--sf-line);
  background: var(--sf-surface);
  color: var(--sf-ink);
  font-size: 0.75rem;
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

.sf-btn--light {
  background: #fff;
  border-color: transparent;
  color: #1a1523;
}

.sf-btn--block {
  width: 100%;
  margin-top: 0.75rem;
}

.sf-state {
  max-width: 44rem;
  margin: 4rem auto;
  padding: 0 1.25rem;
  text-align: center;
  color: var(--sf-muted);
  font-size: 0.9375rem;
}

.sf-state--error {
  color: #b91c1c;
}

.sf-hero,
.sf-section,
.sf-footer {
  max-width: 44rem;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1.25rem;
  padding-right: 1.25rem;
}

.sf-hero {
  padding-top: 1.75rem;
  padding-bottom: 0.5rem;
}

.sf-hero__eyebrow {
  margin: 0;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--sf-faint);
}

.sf-hero__title {
  margin: 0.4rem 0 0;
  font-size: clamp(2rem, 7vw, 2.75rem);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1.05;
}

.sf-hero__tagline {
  margin: 0.65rem 0 0;
  max-width: 28rem;
  font-size: 1rem;
  line-height: 1.45;
  color: var(--sf-muted);
}

.sf-hero__steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  margin: 1.25rem 0 0;
}

.sf-hero__steps p {
  margin: 0;
  padding: 0.65rem 0.55rem;
  border-radius: 0.85rem;
  background: var(--sf-surface);
  border: 1px solid var(--sf-line);
  font-size: 0.6875rem;
  font-weight: 650;
  line-height: 1.35;
  color: var(--sf-muted);
}

.sf-hero__steps span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.15rem;
  height: 1.15rem;
  margin-right: 0.25rem;
  border-radius: 9999px;
  background: var(--sf-ink);
  color: var(--sf-surface);
  font-size: 0.625rem;
  font-weight: 700;
}

.sf--dark .sf-hero__steps span {
  color: #0c0b0e;
}

.sf-hero__cta {
  margin-top: 1.15rem;
  min-height: 2.75rem;
  padding-inline: 1.25rem;
  font-size: 0.875rem;
}

.sf-section {
  margin-top: 2rem;
}

.sf-section__head {
  margin-bottom: 0.85rem;
}

.sf-section__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.025em;
}

.sf-section__hint {
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  color: var(--sf-muted);
}

.sf-recent__row {
  list-style: none;
  margin: 0;
  padding: 0 0 0.25rem;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(8.5rem, 42%);
  gap: 0.65rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}

.sf-recent__card {
  display: block;
  scroll-snap-align: start;
  text-decoration: none;
  color: inherit;
  background: var(--sf-surface);
  border: 1px solid var(--sf-line);
  border-radius: 1rem;
  overflow: hidden;
  padding-bottom: 0.7rem;
}

.sf-recent__name,
.sf-recent__price {
  margin: 0.45rem 0.65rem 0;
  font-size: 0.75rem;
}

.sf-recent__name {
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sf-recent__price {
  font-weight: 700;
}

.sf-search input {
  width: 100%;
  min-height: 2.85rem;
  padding: 0.7rem 1rem;
  border: 1px solid var(--sf-line);
  border-radius: 0.9rem;
  background: var(--sf-surface);
  font-size: 1rem;
  font-family: inherit;
  color: var(--sf-ink);
}

.sf-crumbs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  margin: 0 0 0.85rem;
  font-size: 0.75rem;
  font-weight: 650;
}

.sf-crumbs__link {
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--sf-muted);
  font: inherit;
  font-weight: 650;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 0.15em;
}

.sf-crumbs__sep {
  color: var(--sf-faint);
}

.sf-crumbs__here {
  color: var(--sf-ink);
}

.sf-folders {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
}

@media (min-width: 640px) {
  .sf-folders {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.65rem;
  }
}

@media (min-width: 900px) {
  .sf-folders {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.sf-folder {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0;
  border: 1px solid var(--sf-line);
  border-radius: 0.85rem;
  overflow: hidden;
  background: var(--sf-surface);
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.sf-folder:focus-visible {
  outline: 2px solid var(--sf-ink);
  outline-offset: 2px;
}

.sf-folder__body {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.5rem 0.6rem 0.6rem;
}

.sf-folder__name {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: -0.015em;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sf-folder__meta {
  font-size: 0.625rem;
  font-weight: 650;
  color: var(--sf-faint);
  line-height: 1.3;
}

.sf-filter-block {
  margin-top: 1rem;
}

.sf-filter-label {
  margin: 0 0 0.4rem;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sf-faint);
}

.sf-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.sf-chip {
  border: 1px solid var(--sf-line);
  border-radius: 9999px;
  padding: 0.4rem 0.8rem;
  background: var(--sf-chip-bg);
  color: var(--sf-muted);
  font-size: 0.75rem;
  font-weight: 650;
  cursor: pointer;
  font-family: inherit;
}

.sf-chip.is-on {
  background: var(--sf-ink);
  border-color: transparent;
  color: var(--sf-surface);
}

.sf--dark .sf-chip.is-on {
  color: #0c0b0e;
}

.sf-count {
  margin: 1.1rem 0 0.75rem;
  font-size: 0.75rem;
  font-weight: 650;
  color: var(--sf-faint);
}

.sf-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .sf-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.sf-grid__item {
  position: relative;
  display: flex;
  flex-direction: column;
}

.sf-card {
  display: flex;
  flex-direction: column;
  flex: 1;
  text-decoration: none;
  color: inherit;
  background: var(--sf-surface);
  border: 1px solid var(--sf-line);
  border-radius: 1.05rem;
  overflow: hidden;
  min-height: 100%;
}

.sf-card__media-wrap {
  position: relative;
}

.sf-card__badge {
  position: absolute;
  left: 0.5rem;
  top: 0.5rem;
  z-index: 2;
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
  background: rgb(255 255 255 / 0.92);
  font-size: 0.625rem;
  font-weight: 700;
  color: rgb(26 21 35 / 0.55);
}

.sf--dark .sf-card__badge {
  background: rgb(12 11 14 / 0.88);
  color: rgb(244 241 234 / 0.7);
}

.sf-card__badge.is-yes {
  color: var(--sf-ok);
}

.sf-card__badge.is-hold {
  color: var(--sf-hold);
}

.sf-card__body {
  padding: 0.7rem 0.75rem 0.85rem;
}

.sf-card__title {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: -0.015em;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sf-card__price {
  margin: 0.35rem 0 0;
  font-size: 0.875rem;
  font-weight: 700;
}

.sf-card__cat {
  margin: 0.25rem 0 0;
  font-size: 0.6875rem;
  color: var(--sf-faint);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sf-card__compare {
  margin-top: 0.35rem;
  border: 0;
  background: transparent;
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--sf-faint);
  cursor: pointer;
  font-family: inherit;
  align-self: flex-start;
  padding: 0.15rem 0.15rem;
}

.sf-card__compare.is-on {
  color: var(--sf-ink);
}

.sf-card__compare:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.sf-empty {
  margin-top: 1rem;
  padding: 2rem 1rem;
  text-align: center;
  border-radius: 1rem;
  border: 1px dashed var(--sf-line);
  background: var(--sf-empty-bg);
}

.sf-empty__title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
}

.sf-empty__hint {
  margin: 0.35rem 0 0.85rem;
  font-size: 0.8125rem;
  color: var(--sf-muted);
}

.sf-footer {
  margin-top: 2.5rem;
  padding-bottom: 1.5rem;
}

.sf-about {
  border-radius: 1rem;
  border: 1px solid var(--sf-line);
  background: var(--sf-surface);
  padding: 0.85rem 1rem;
}

.sf-about summary {
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: 700;
}

.sf-about p {
  margin: 0.65rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--sf-muted);
}

.sf-footer__contacts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem 1.1rem;
  margin-top: 1rem;
}

.sf-footer__contacts a {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--sf-ink);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.sf-footer__powered {
  margin: 1.25rem 0 0;
  font-size: 0.6875rem;
  color: var(--sf-faint);
}

.sf-compare-bar {
  position: fixed;
  left: 50%;
  bottom: 1.15rem;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 0.7rem 0.55rem 1rem;
  border-radius: 9999px;
  background: #1a1523;
  color: #fff;
  box-shadow: 0 12px 32px rgb(26 21 35 / 0.28);
  z-index: 40;
}

.sf--dark .sf-compare-bar {
  background: #f4f1ea;
  color: #1a1523;
  box-shadow: 0 12px 32px rgb(0 0 0 / 0.45);
}

.sf-compare-bar p {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 700;
  white-space: nowrap;
}

.sf-compare-bar__clear {
  border: 0;
  background: transparent;
  color: rgb(255 255 255 / 0.75);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}

.sf--dark .sf-compare-bar__clear {
  color: rgb(26 21 35 / 0.65);
}

.sf-compare-modal {
  position: fixed;
  inset: 0;
  background: rgb(26 21 35 / 0.48);
  z-index: 50;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 1rem;
}

.sf-compare-panel {
  width: min(44rem, 100%);
  max-height: 85dvh;
  overflow: auto;
  background: var(--sf-surface);
  border-radius: 1.25rem;
  padding: 1rem 1rem 1.5rem;
}

.sf-compare-panel__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.sf-compare-panel__head h2 {
  margin: 0;
  font-size: 1.0625rem;
}

.sf-compare-grid {
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  gap: 0.75rem;
}

.sf-compare-col__title {
  margin: 0.55rem 0 0;
  font-size: 0.875rem;
  font-weight: 700;
}

.sf-compare-col__price {
  margin: 0.25rem 0 0;
  font-weight: 700;
  font-size: 0.875rem;
}

.sf-compare-col__avail,
.sf-compare-col__cat {
  margin: 0.2rem 0 0;
  font-size: 0.75rem;
  color: var(--sf-muted);
  text-transform: capitalize;
}

.sf-compare-col dl {
  margin: 0.75rem 0 0;
  padding: 0;
}

.sf-compare-col dt {
  margin: 0.45rem 0 0;
  font-size: 0.6875rem;
  color: var(--sf-faint);
}

.sf-compare-col dd {
  margin: 0.1rem 0 0;
  font-size: 0.8125rem;
  font-weight: 650;
}

@media (max-width: 640px) {
  .sf-hero__steps {
    grid-template-columns: 1fr;
  }

  .sf-compare-grid {
    grid-template-columns: 1fr;
  }
}
</style>

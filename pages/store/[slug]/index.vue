<template>
  <div class="ds-root s-c s-sf">
    <header class="s-sf-bar">
      <div class="s-sf-bar__inner">
        <div class="s-sf-bar__brand">
          <img
            v-if="store?.logoUrl"
            :src="store.logoUrl"
            alt=""
            class="s-sf-bar__logo"
            width="32"
            height="32"
          />
          <span v-else class="s-sf-bar__logo s-sf-bar__logo--mark" aria-hidden="true">
            {{ storeInitial }}
          </span>
          <span class="s-sf-bar__name">{{ store?.displayName || 'Showroom' }}</span>
        </div>
        <div class="s-sf-bar__actions">
          <StorefrontThemeButton />
          <SIconButton :label="shareLabel" tooltip @click="shareStore">
            <Check v-if="shareLabel !== 'Share'" :size="18" aria-hidden="true" />
            <Share2 v-else :size="18" aria-hidden="true" />
          </SIconButton>
          <SButton
            v-if="primaryContactHref"
            variant="primary"
            size="sm"
            class="s-sf-bar__cta"
            @click="openContact"
          >
            <template #leading>
              <MessageCircle v-if="store?.whatsappE164" :size="16" aria-hidden="true" />
              <Phone v-else :size="16" aria-hidden="true" />
            </template>
            {{ primaryContactLabel }}
          </SButton>
        </div>
      </div>
    </header>

    <main class="s-sf-main">
      <template v-if="pending">
        <div class="s-sf-hero" aria-hidden="true">
          <SSkeleton height="64px" width="64px" />
          <SSkeleton height="40px" width="60%" />
          <SSkeleton height="18px" width="80%" />
        </div>
        <ul class="s-sf-grid" aria-label="Loading catalogue">
          <li v-for="n in 6" :key="n" class="s-sf-card s-sf-card--skeleton">
            <SSkeleton height="auto" class="s-sf-card__skeleton-media" />
            <div class="s-sf-card__body">
              <SSkeleton height="14px" width="80%" />
              <SSkeleton height="14px" width="40%" />
            </div>
          </li>
        </ul>
      </template>

      <SEmptyState
        v-else-if="error"
        class="s-sf-state"
        title="This showroom isn’t available"
        :description="error"
      >
        <template #icon><Store :size="24" /></template>
      </SEmptyState>

      <template v-else-if="store">
        <section class="s-sf-hero">
          <img
            v-if="store.logoUrl"
            :src="store.logoUrl"
            alt=""
            class="s-sf-hero__logo"
            width="72"
            height="72"
          />
          <span v-else class="s-sf-hero__logo s-sf-hero__logo--mark" aria-hidden="true">
            {{ storeInitial }}
          </span>
          <h1 class="s-sf-hero__title">{{ store.displayName }}</h1>
          <p class="s-sf-hero__tagline">
            {{ store.tagline || 'Browse what’s available, then message the shop.' }}
          </p>
          <ul class="s-sf-hero__meta">
            <li v-if="store.city"><MapPin :size="14" aria-hidden="true" />{{ store.city }}</li>
            <li v-if="items.length">
              <LayoutGrid :size="14" aria-hidden="true" />
              {{ items.length }} product{{ items.length === 1 ? '' : 's' }}
            </li>
            <li><ShieldCheck :size="14" aria-hidden="true" />No account needed</li>
          </ul>
        </section>

        <section
          v-if="recent.length && !search && !folderPath"
          class="s-sf-section"
          aria-labelledby="s-sf-recent-title"
        >
          <div class="s-sf-section__head">
            <h2 id="s-sf-recent-title" class="s-sf-section__title">
              <Sparkles :size="18" aria-hidden="true" />
              Just in
            </h2>
            <p class="s-sf-section__hint">The newest arrivals</p>
          </div>
          <ul class="s-sf-rail">
            <li v-for="item in recent" :key="`r-${item.id}`">
              <NuxtLink :to="productHref(item.id)" class="s-sf-rail__card">
                <StorefrontMedia
                  :src="item.imageUrl"
                  :title="item.title"
                  :seed="item.id"
                  :category-name="item.categoryName"
                  :category-path="item.categoryPath"
                  size="recent"
                />
                <span class="s-sf-rail__name">{{ item.title }}</span>
                <span class="s-sf-rail__price">{{ formatMoney(item.price, item.currency) }}</span>
              </NuxtLink>
            </li>
          </ul>
        </section>

        <section
          id="catalogue"
          class="s-sf-section s-sf-catalogue"
          aria-labelledby="s-sf-cat-title"
        >
          <div class="s-sf-toolbar">
            <SSearch
              v-model="search"
              class="s-sf-toolbar__search"
              placeholder="Search products"
              autocomplete="off"
              @update:model-value="debouncedReload"
            />
            <div
              v-if="isSearchMode || showingProducts"
              class="s-sf-chips"
              role="group"
              aria-label="Sort products"
            >
              <button
                v-for="option in sortOptions"
                :key="option.value"
                type="button"
                class="s-sf-chip"
                :aria-pressed="sort === option.value"
                @click="setSort(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <nav
            v-if="!isSearchMode && folderPath"
            class="s-sf-crumbs"
            aria-label="Catalogue location"
          >
            <button type="button" class="s-sf-crumbs__link" @click="openFolder('')">
              All categories
            </button>
            <template v-if="folderParentPath">
              <ChevronRight :size="14" class="s-sf-crumbs__sep" aria-hidden="true" />
              <button type="button" class="s-sf-crumbs__link" @click="openFolder(folderParentPath)">
                {{ folderParentName }}
              </button>
            </template>
            <ChevronRight :size="14" class="s-sf-crumbs__sep" aria-hidden="true" />
            <span class="s-sf-crumbs__here" aria-current="page">{{ currentFolderName }}</span>
          </nav>

          <div class="s-sf-section__head s-sf-section__head--row">
            <h2 id="s-sf-cat-title" class="s-sf-section__title">{{ catalogueTitle }}</h2>
            <p class="s-sf-count" aria-live="polite">
              <template v-if="isSearchMode || showingProducts">
                {{ visibleProducts.length }} product{{ visibleProducts.length === 1 ? '' : 's' }}
              </template>
              <template v-else>
                {{ visibleFolders.length }} categor{{ visibleFolders.length === 1 ? 'y' : 'ies' }}
              </template>
            </p>
          </div>

          <ul
            v-if="!isSearchMode && !showingProducts && visibleFolders.length"
            class="s-sf-folders"
            :class="{ 'is-refreshing': refreshing }"
          >
            <li v-for="folder in visibleFolders" :key="folder.path">
              <button type="button" class="s-sf-folder" @click="openFolder(folder.path)">
                <StorefrontMedia
                  :title="folder.name"
                  :seed="folder.path"
                  :category-name="folder.name"
                  :category-path="folder.path"
                  size="folder"
                />
                <span class="s-sf-folder__body">
                  <span class="s-sf-folder__name">{{ folder.name }}</span>
                  <span class="s-sf-folder__meta">
                    <template v-if="folder.childCount > 0">
                      {{ folder.childCount }} subcategor{{ folder.childCount === 1 ? 'y' : 'ies' }}
                      ·
                    </template>
                    {{ folder.itemCount }} product{{ folder.itemCount === 1 ? '' : 's' }}
                  </span>
                </span>
                <ChevronRight :size="16" class="s-sf-folder__chev" aria-hidden="true" />
              </button>
            </li>
          </ul>

          <ul
            v-else-if="(isSearchMode || showingProducts) && visibleProducts.length"
            class="s-sf-grid"
            :class="{ 'is-refreshing': refreshing }"
          >
            <li v-for="item in visibleProducts" :key="item.id" class="s-sf-card">
              <NuxtLink :to="productHref(item.id)" class="s-sf-card__link">
                <StorefrontMedia
                  :src="item.imageUrl"
                  :title="item.title"
                  :seed="item.id"
                  :category-name="item.categoryName"
                  :category-path="item.categoryPath"
                  size="card"
                >
                  <SBadge class="s-sf-card__badge" :tone="availabilityTone(item.availability)" dot>
                    {{ availabilityShort(item.availability) }}
                  </SBadge>
                </StorefrontMedia>
                <span class="s-sf-card__body">
                  <span class="s-sf-card__title">{{ item.title }}</span>
                  <span class="s-sf-card__price">{{ formatMoney(item.price, item.currency) }}</span>
                  <span v-if="isSearchMode && item.categoryPath" class="s-sf-card__cat">{{
                    item.categoryPath
                  }}</span>
                </span>
              </NuxtLink>
              <button
                type="button"
                class="s-sf-card__compare"
                :aria-pressed="compareIds.includes(item.id)"
                :aria-label="`Compare ${item.title}`"
                :title="compareIds.includes(item.id) ? 'Remove from compare' : 'Add to compare'"
                :disabled="!compareIds.includes(item.id) && compareIds.length >= 3"
                @click="toggleCompare(item.id)"
              >
                <Check v-if="compareIds.includes(item.id)" :size="16" aria-hidden="true" />
                <GitCompareArrows v-else :size="16" aria-hidden="true" />
              </button>
            </li>
          </ul>

          <SEmptyState
            v-else
            class="s-sf-empty"
            :title="isSearchMode || showingProducts ? 'No products match' : 'No categories yet'"
            :description="emptyHint"
          >
            <template #icon><PackageSearch :size="24" /></template>
            <template v-if="search || folderPath || primaryContactHref" #actions>
              <SButton v-if="search || folderPath" @click="clearFilters">
                {{ search ? 'Clear search' : 'Back to categories' }}
              </SButton>
              <SButton v-else variant="primary" @click="openContact">
                {{ primaryContactLabel }}
              </SButton>
            </template>
          </SEmptyState>
        </section>

        <footer class="s-sf-footer">
          <div
            v-if="store.description || store.collectionInfo || store.warrantyInfo"
            class="s-sf-about"
          >
            <h2 class="s-sf-about__title">About {{ store.displayName }}</h2>
            <p v-if="store.description">{{ store.description }}</p>
            <dl v-if="store.collectionInfo || store.warrantyInfo" class="s-sf-about__facts">
              <div v-if="store.collectionInfo">
                <dt>Collection &amp; delivery</dt>
                <dd>{{ store.collectionInfo }}</dd>
              </div>
              <div v-if="store.warrantyInfo">
                <dt>Warranty &amp; returns</dt>
                <dd>{{ store.warrantyInfo }}</dd>
              </div>
            </dl>
          </div>
          <nav v-if="hasSecondaryContacts" class="s-sf-contacts" aria-label="Contact the shop">
            <a
              v-if="store.whatsappE164"
              :href="whatsappHref"
              target="_blank"
              rel="noopener"
              class="s-sf-contact"
            >
              <MessageCircle :size="16" aria-hidden="true" />WhatsApp
            </a>
            <a v-if="store.phonePublic" :href="`tel:${store.phonePublic}`" class="s-sf-contact">
              <Phone :size="16" aria-hidden="true" />Call
            </a>
            <a v-if="store.emailPublic" :href="`mailto:${store.emailPublic}`" class="s-sf-contact">
              <Mail :size="16" aria-hidden="true" />Email
            </a>
            <a
              v-if="store.social?.instagram"
              :href="store.social.instagram"
              target="_blank"
              rel="noopener"
              class="s-sf-contact"
            >
              <ArrowUpRight :size="16" aria-hidden="true" />Instagram
            </a>
          </nav>
          <p class="s-sf-powered">Powered by <strong>Storvv</strong></p>
        </footer>
      </template>
    </main>

    <Transition name="s-sf-float">
      <div v-if="compareIds.length >= 2" class="s-sf-float" role="region" aria-label="Compare">
        <span class="s-sf-float__label">{{ compareIds.length }} selected</span>
        <SButton variant="primary" size="sm" @click="showCompare = true">Compare</SButton>
        <SIconButton label="Clear compare" size="sm" @click="compareIds = []">
          <X :size="16" aria-hidden="true" />
        </SIconButton>
      </div>
    </Transition>

    <SDialog v-model:open="showCompare" title="Compare" size="lg">
      <div class="s-sf-compare" :style="{ '--cols': compareItems.length }">
        <div v-for="item in compareItems" :key="item.id" class="s-sf-compare__col">
          <StorefrontMedia
            :src="item.imageUrl"
            :title="item.title"
            :seed="item.id"
            :category-name="item.categoryName"
            :category-path="item.categoryPath"
            size="compare"
          />
          <p class="s-sf-compare__title">{{ item.title }}</p>
          <p class="s-sf-compare__price">{{ formatMoney(item.price, item.currency) }}</p>
          <SBadge :tone="availabilityTone(item.availability)" dot>
            {{ availabilityShort(item.availability) }}
          </SBadge>
          <dl v-if="item.attributes?.length" class="s-sf-compare__attrs">
            <div v-for="attr in item.attributes" :key="attr.key">
              <dt>{{ attr.label }}</dt>
              <dd>{{ attr.value }}</dd>
            </div>
          </dl>
          <SButton :to="productHref(item.id)" block>View product</SButton>
        </div>
      </div>
    </SDialog>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  GitCompareArrows,
  LayoutGrid,
  Mail,
  MapPin,
  MessageCircle,
  PackageSearch,
  Phone,
  Share2,
  ShieldCheck,
  Sparkles,
  Store,
  X,
} from '@lucide/vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SDialog from '~/components/s/SDialog.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SIconButton from '~/components/s/SIconButton.vue'
import SSearch from '~/components/s/SSearch.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import StorefrontMedia from '~/components/storefront/StorefrontMedia.vue'
import StorefrontThemeButton from '~/components/storefront/StorefrontThemeButton.vue'
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
import type {
  StorefrontPublicAvailability,
  StorefrontPublicItemView,
  StorefrontPublicStoreView,
} from '~/types/storefront'
import { fetchErrorMessage } from '~/utils/storefront-share'

definePageMeta({
  layout: false,
})

const route = useRoute()
const slug = computed(() => String(route.params.slug || '').toLowerCase())
const { ping } = useStorefrontViewPing()

const pending = ref(true)
const refreshing = ref(false)
const error = ref('')
const store = ref<StorefrontPublicStoreView | null>(null)
const items = ref<StorefrontPublicItemView[]>([])
const recent = ref<StorefrontPublicItemView[]>([])
const search = ref('')
const folderPath = ref('')
const sort = ref('')
const compareIds = ref<string[]>([])
const showCompare = ref(false)
const shareLabel = ref('Share')

const sortOptions = [
  { value: '', label: 'Featured' },
  { value: 'recent', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
]

const isSearchMode = computed(() => Boolean(search.value.trim()))

const storeInitial = computed(() =>
  String(store.value?.displayName || 'S')
    .trim()
    .charAt(0)
    .toUpperCase()
)

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
  if (!folderPath.value) return 'Shop by category'
  if (showingProducts.value) return currentFolderName.value || 'Products'
  return currentFolderName.value || 'Subcategories'
})

const emptyHint = computed(() => {
  if (isSearchMode.value) return 'Try a different search, or browse categories instead.'
  if (showingProducts.value) return 'Nothing is listed in this category right now.'
  return 'This shop hasn’t published categories yet. Message them to ask what’s available.'
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

const hasSecondaryContacts = computed(() =>
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
    .filter((item): item is StorefrontPublicItemView => Boolean(item))
)

watch(
  () => compareIds.value.length,
  (count) => {
    if (count < 2) showCompare.value = false
  }
)

function availabilityTone(a: StorefrontPublicAvailability) {
  if (a === 'available') return 'success'
  if (a === 'reserved') return 'warning'
  return 'neutral'
}

function availabilityShort(a: StorefrontPublicAvailability) {
  if (a === 'available') return 'Available'
  if (a === 'reserved') return 'On hold'
  return 'Sold'
}

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

function openContact() {
  if (!primaryContactHref.value) return
  if (store.value?.whatsappE164) window.open(primaryContactHref.value, '_blank', 'noopener')
  else window.location.href = primaryContactHref.value
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
    shareLabel.value = 'Shared'
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
  if (sort.value === s) return
  sort.value = s
  void load()
}

async function load() {
  if (!slug.value) {
    error.value = 'Store not found'
    pending.value = false
    return
  }
  const firstLoad = !store.value
  if (firstLoad) pending.value = true
  else refreshing.value = true
  error.value = ''
  try {
    const data = await $fetch<{
      store: StorefrontPublicStoreView
      items: StorefrontPublicItemView[]
      recent?: StorefrontPublicItemView[]
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
    if (firstLoad) ping(slug.value)

    const origin = import.meta.client ? window.location.origin : ''
    const pageUrl = storefrontAbsoluteUrl(origin, storefrontPublicPath(slug.value))
    const description =
      data.store.tagline ||
      data.store.description ||
      `Browse available products from ${data.store.displayName}`
    useHead({
      title: `${data.store.displayName} · Storvv`,
      meta: [
        { name: 'description', content: description },
        { property: 'og:title', content: `${data.store.displayName} · Storvv` },
        { property: 'og:description', content: description },
        { property: 'og:url', content: pageUrl },
        ...(data.store.logoUrl ? [{ property: 'og:image', content: data.store.logoUrl }] : []),
      ],
      link: [{ rel: 'canonical', href: pageUrl }],
    })
  } catch (e) {
    error.value = fetchErrorMessage(e, 'Store not found')
    store.value = null
    items.value = []
    recent.value = []
  } finally {
    pending.value = false
    refreshing.value = false
  }
}

watch(
  slug,
  () => {
    store.value = null
    void load()
  },
  { immediate: true }
)
</script>

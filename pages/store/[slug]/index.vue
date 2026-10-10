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
          <span class="s-sf-bar__name">{{ store?.displayName || 'Shop' }}</span>
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
        <div class="s-sf-intro" aria-hidden="true">
          <SSkeleton height="32px" width="50%" />
          <SSkeleton height="16px" width="70%" />
        </div>
        <ul class="s-sf-grid" aria-label="Loading products">
          <li v-for="n in 8" :key="n" class="s-sf-card s-sf-card--skeleton">
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
        title="This shop isn’t available"
        :description="error"
      >
        <template #icon><Store :size="24" /></template>
      </SEmptyState>

      <template v-else-if="store">
        <section class="s-sf-intro">
          <h1 class="s-sf-intro__title">{{ store.displayName }}</h1>
          <p v-if="store.tagline" class="s-sf-intro__tagline">{{ store.tagline }}</p>
          <p v-if="store.city" class="s-sf-intro__meta">
            <MapPin :size="14" aria-hidden="true" />{{ store.city }}
          </p>
        </section>

        <div id="catalogue" class="s-sf-toolbar">
          <SSearch
            v-model="search"
            class="s-sf-toolbar__search"
            placeholder="Search this shop"
            autocomplete="off"
            @update:model-value="debouncedReload"
          />
          <nav v-if="categories.length > 1" class="s-sf-chips" aria-label="Categories">
            <button
              type="button"
              class="s-sf-chip"
              :aria-pressed="!category"
              @click="selectCategory('')"
            >
              All
            </button>
            <button
              v-for="cat in categories"
              :key="cat.path"
              type="button"
              class="s-sf-chip"
              :aria-pressed="activeRoot === cat.path"
              @click="selectCategory(cat.path)"
            >
              {{ cat.name }}
            </button>
          </nav>
          <nav
            v-if="subcategories.length > 1"
            class="s-sf-chips s-sf-chips--sub"
            :aria-label="`${activeRootName} types`"
          >
            <button
              type="button"
              class="s-sf-chip s-sf-chip--sub"
              :aria-pressed="category === activeRoot"
              @click="selectCategory(activeRoot)"
            >
              All {{ activeRootName }}
            </button>
            <button
              v-for="sub in subcategories"
              :key="sub.path"
              type="button"
              class="s-sf-chip s-sf-chip--sub"
              :aria-pressed="category === sub.path"
              @click="selectCategory(sub.path)"
            >
              {{ sub.name }}
            </button>
          </nav>
        </div>

        <div class="s-sf-results-head">
          <p class="s-sf-count" aria-live="polite">
            {{ visibleProducts.length }} product{{ visibleProducts.length === 1 ? '' : 's' }}
          </p>
          <label class="s-sf-sort">
            <ArrowUpDown :size="14" aria-hidden="true" />
            <span class="ds-sr-only">Sort by</span>
            <select :value="sort" @change="setSort(($event.target as HTMLSelectElement).value)">
              <option v-for="option in sortOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
        </div>

        <ul
          v-if="visibleProducts.length"
          class="s-sf-grid"
          :class="{ 'is-refreshing': refreshing }"
        >
          <li v-for="item in visibleProducts" :key="item.id" class="s-sf-card">
            <NuxtLink :to="productHref(item.id)" class="s-sf-card__link">
              <StorefrontMedia
                :src="item.imageUrl"
                :title="item.title"
                :category-name="item.categoryName"
                :category-path="item.categoryPath"
              >
                <SBadge
                  v-if="item.availability !== 'available'"
                  class="s-sf-card__badge"
                  :tone="item.availability === 'reserved' ? 'warning' : 'neutral'"
                >
                  {{ item.availability === 'reserved' ? 'On hold' : 'Sold out' }}
                </SBadge>
              </StorefrontMedia>
              <span class="s-sf-card__body">
                <span class="s-sf-card__title">{{ item.title }}</span>
                <span class="s-sf-card__price">{{ formatMoney(item.price, item.currency) }}</span>
              </span>
            </NuxtLink>
          </li>
        </ul>

        <SEmptyState
          v-else
          class="s-sf-empty"
          :title="search || category ? 'Nothing matches' : 'No products yet'"
          :description="
            search || category
              ? 'Try another search or category.'
              : 'This shop hasn’t listed anything yet. Message them to ask what’s available.'
          "
        >
          <template #icon><PackageSearch :size="24" /></template>
          <template v-if="search || category || primaryContactHref" #actions>
            <SButton v-if="search || category" @click="clearFilters">Show everything</SButton>
            <SButton v-else variant="primary" @click="openContact">
              {{ primaryContactLabel }}
            </SButton>
          </template>
        </SEmptyState>

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
          <nav v-if="hasContacts" class="s-sf-contacts" aria-label="Contact the shop">
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
  </div>
</template>

<script setup lang="ts">
import {
  ArrowUpDown,
  ArrowUpRight,
  Check,
  Mail,
  MapPin,
  MessageCircle,
  PackageSearch,
  Phone,
  Share2,
  Store,
} from '@lucide/vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SIconButton from '~/components/s/SIconButton.vue'
import SSearch from '~/components/s/SSearch.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import StorefrontMedia from '~/components/storefront/StorefrontMedia.vue'
import StorefrontThemeButton from '~/components/storefront/StorefrontThemeButton.vue'
import {
  buildStorefrontFolderTree,
  filterStorefrontItemsUnderPath,
  parseStorefrontCategoryPath,
} from '~/utils/storefront-catalogue'
import {
  buildStorefrontShareMessage,
  buildStorefrontWhatsAppShareHref,
  fetchErrorMessage,
  formatStorefrontMoney,
  storefrontAbsoluteUrl,
  withStorefrontUtm,
} from '~/utils/storefront-share'
import { storefrontProductPath, storefrontPublicPath } from '~/utils/storefront-slug'
import type { StorefrontPublicItemView, StorefrontPublicStoreView } from '~/types/storefront'

definePageMeta({
  layout: false,
})

const route = useRoute()
const router = useRouter()
const slug = computed(() => String(route.params.slug || '').toLowerCase())
const { ping } = useStorefrontViewPing()

const pending = ref(true)
const refreshing = ref(false)
const error = ref('')
const store = ref<StorefrontPublicStoreView | null>(null)
const items = ref<StorefrontPublicItemView[]>([])
const search = ref('')
const sort = ref('')
const shareLabel = ref('Share')

const category = computed(() => String(route.query.category || ''))

const sortOptions = [
  { value: '', label: 'Featured' },
  { value: 'recent', label: 'Newest' },
  { value: 'price_asc', label: 'Lowest price' },
  { value: 'price_desc', label: 'Highest price' },
]

const storeInitial = computed(() =>
  String(store.value?.displayName || 'S')
    .trim()
    .charAt(0)
    .toUpperCase()
)

/** Top-level categories become chips; their subcategories show as a second row once picked. */
const categories = computed(() => buildStorefrontFolderTree(items.value))

const activeRoot = computed(() => parseStorefrontCategoryPath(category.value)[0] || '')

const activeRootNode = computed(
  () =>
    categories.value.find((c) => c.path.toLowerCase() === activeRoot.value.toLowerCase()) ?? null
)

const activeRootName = computed(() => activeRootNode.value?.name || activeRoot.value)

const subcategories = computed(() => activeRootNode.value?.children ?? [])

const visibleProducts = computed(() => filterStorefrontItemsUnderPath(items.value, category.value))

const whatsappHref = computed(() => {
  const n = String(store.value?.whatsappE164 || '').replace(/\D/g, '')
  if (!n) return '#'
  const text = encodeURIComponent(`Hi, I am browsing your shop (${store.value?.displayName}).`)
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

const hasContacts = computed(() =>
  Boolean(
    store.value?.phonePublic ||
      store.value?.whatsappE164 ||
      store.value?.emailPublic ||
      store.value?.social?.instagram
  )
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

function selectCategory(path: string) {
  const query = { ...route.query }
  if (path) query.category = path
  else delete query.category
  void router.replace({ query })
}

function openContact() {
  if (!primaryContactHref.value) return
  if (store.value?.whatsappE164) window.open(primaryContactHref.value, '_blank', 'noopener')
  else window.location.href = primaryContactHref.value
}

async function shareStore() {
  if (!store.value) return
  const url = storefrontAbsoluteUrl(window.location.origin, storefrontPublicPath(slug.value), {
    source: 'share',
    medium: 'social',
    campaign: slug.value,
  })
  const message = buildStorefrontShareMessage({ storeName: store.value.displayName, url })
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

function clearFilters() {
  search.value = ''
  selectCategory('')
  void load()
}

let timer: ReturnType<typeof setTimeout> | null = null
function debouncedReload() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    void load()
  }, 220)
}

function setSort(value: string) {
  if (sort.value === value) return
  sort.value = value
  void load()
}

async function load() {
  if (!slug.value) {
    error.value = 'Shop not found'
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
    }>(`/api/storefront/${slug.value}`, {
      query: {
        q: search.value || undefined,
        sort: sort.value || undefined,
      },
    })
    store.value = data.store
    items.value = data.items || []
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
    error.value = fetchErrorMessage(e, 'Shop not found')
    store.value = null
    items.value = []
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

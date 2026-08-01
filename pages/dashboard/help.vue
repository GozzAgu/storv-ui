<template>
  <div :class="pageClass">
    <DashboardPageHeader>
      <template #eyebrow>
        <p :class="eyebrowClass">Help</p>
      </template>
      <template #title>
        <h1 :class="pageTitleClass">Help center</h1>
      </template>
      <template #description>
        <p :class="descriptionClass">
          How Storvv works: permissions, screens, and plan limits. Filter topics by keyword or open
          a common screen below.
        </p>
      </template>
      <template #toolbar>
        <div class="flex w-full min-w-0 flex-col gap-3">
          <div class="flex w-full min-w-0 flex-wrap items-end gap-3">
            <DashboardToolbarSearch
              input-id="help-search"
              v-model="searchQuery"
              placeholder="Search help topics…"
              :wide="false"
              wrapper-class="max-w-md"
            />
            <button
              type="button"
              class="dash-help-assistant-cta"
              @click="openAssistant()"
            >
              <SparklesIcon class="h-4 w-4 shrink-0" stroke-width="1.75" />
              Ask assistant
            </button>
          </div>
          <div>
            <p :class="toolbarLabelClass">
              Popular topics
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="topic in popularTopics"
                :key="topic.query"
                type="button"
                :class="chipClass"
                @click="searchQuery = topic.query"
              >
                {{ topic.label }}
              </button>
            </div>
          </div>
          <div>
            <p :class="toolbarLabelClass">
              Common screens
            </p>
            <div class="flex flex-wrap gap-2">
              <NuxtLink
                v-for="link in quickScreenLinks"
                :key="link.to"
                :to="link.to"
                :class="chipLinkClass"
              >
                {{ link.label }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </template>
    </DashboardPageHeader>

    <div :class="layoutClass">
      <nav aria-label="Topics" :class="tocClass">
        <p :class="tocLabelClass">
          On this page
        </p>
        <ul class="space-y-0.5">
          <li v-for="cat in filteredCategories" :key="cat.id">
            <a
              :href="`#${cat.id}`"
              :class="tocLinkClass"
              @click.prevent="scrollToSection(cat.id)"
              v-html="highlightText(cat.title, trimmedSearch)"
            ></a>
          </li>
        </ul>
        <p
          v-if="filteredCategories.length === 0"
          class="py-2 text-xs text-gray-500 dark:text-gray-400"
        >
          No topics match "{{ searchQuery }}". Try another word or clear the filter.
        </p>
      </nav>

      <div :class="contentClass">
        <section
          v-for="cat in filteredCategories"
          :id="cat.id"
          :key="cat.id"
          :class="sectionClass"
        >
          <div :class="sectionHeadClass">
            <div :class="sectionIconClass">
              <component
                :is="cat.icon"
                class="h-4 w-4 text-gray-500 dark:text-gray-400"
                stroke-width="1.5"
              />
            </div>
            <div class="min-w-0 flex-1">
              <h2
                :class="sectionTitleClass"
                v-html="highlightText(cat.title, trimmedSearch)"
              ></h2>
              <p
                :class="sectionBlurbClass"
                v-html="highlightText(cat.blurb, trimmedSearch)"
              ></p>
            </div>
            <button
              type="button"
              class="dash-help-assistant-link shrink-0"
              @click="askAboutCategory(cat.title)"
            >
              Ask assistant
            </button>
          </div>

          <div class="space-y-3">
            <article
              v-for="(article, idx) in cat.articles"
              :key="idx"
              :class="articleClass"
            >
              <h3
                :class="articleTitleClass"
                v-html="highlightText(article.title, trimmedSearch)"
              ></h3>
              <div :class="articleBodyClass">
                <p
                  v-for="(para, pIdx) in article.body"
                  :key="pIdx"
                  v-html="highlightText(para, trimmedSearch)"
                ></p>
                <ul
                  v-if="article.bullets?.length"
                  class="list-disc space-y-1 pl-4 marker:text-gray-400 dark:marker:text-gray-500"
                >
                  <li
                    v-for="(b, bIdx) in article.bullets"
                    :key="bIdx"
                    v-html="highlightText(b, trimmedSearch)"
                  ></li>
                </ul>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>

    <button
      v-show="showBackToTop"
      type="button"
      :class="backTopClass"
      aria-label="Back to top"
      @click="scrollToTop"
    >
      <ArrowUpIcon class="h-4 w-4" stroke-width="2" />
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import {
  ArrowUpIcon,
  SparklesIcon,
  Squares2X2Icon,
  CubeIcon,
  ReceiptPercentIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  ArrowsRightLeftIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  RocketLaunchIcon,
} from '~/utils/app-icons'
import {
  buildAssistantTopicPrompt,
  useDashboardAssistant,
} from '~/composables/useDashboardAssistant'
import {
  dashboardHelpCategories,
  type DashboardHelpCategory,
  type DashboardHelpCategoryId,
} from '~/utils/dashboard-help-content'
definePageMeta({
  layout: 'dashboard',
})

useHead({
  title: 'Help center - Storvv',
})

const {
  eyebrowClass,
  pageTitleClass,
  descriptionClass,
} = useDashboardPageChrome()

const {
  pageClass,
  layoutClass,
  tocClass,
  tocLabelClass,
  tocLinkClass,
  contentClass,
  sectionClass,
  sectionHeadClass,
  sectionIconClass,
  sectionTitleClass,
  sectionBlurbClass,
  articleClass,
  articleTitleClass,
  articleBodyClass,
  chipClass,
  chipLinkClass,
  toolbarLabelClass,
  backTopClass,
} = useDashboardHelpChrome()

const { openAssistant } = useDashboardAssistant()

type Category = DashboardHelpCategory & { icon: Component }

const categoryIcons: Record<DashboardHelpCategoryId, Component> = {
  'recent-updates': RocketLaunchIcon,
  'getting-started': SparklesIcon,
  'navigation-search': Squares2X2Icon,
  inventory: CubeIcon,
  'sales-receipts-customers': ReceiptPercentIcon,
  analytics: ChartBarIcon,
  'activity-logs': ShieldCheckIcon,
  'departments-staff': BuildingOfficeIcon,
  'multi-store': ArrowsRightLeftIcon,
  'settings-subscription': Cog6ToothIcon,
  'profile-notifications': UserCircleIcon,
}

const categories: Category[] = dashboardHelpCategories.map((category) => ({
  ...category,
  icon: categoryIcons[category.id],
}))

const router = useRouter()

const searchQuery = ref('')
const showBackToTop = ref(false)

const popularTopics = [
  { label: "What's new", query: 'recent updates' },
  { label: 'Subcategories', query: 'organize with subcategories' },
  { label: 'Copy from branch', query: 'copy from branch' },
  { label: 'Create branch', query: 'branch names region' },
  { label: 'Stock loans', query: 'stock loan' },
  { label: 'Staff & roles', query: 'staff' },
  { label: 'Sales & refunds', query: 'receipt' },
  { label: 'Inventory & categories', query: 'inventory' },
  { label: 'Sell screen note', query: 'sell' },
  { label: 'Plans & billing', query: 'plan' },
  { label: 'Departments', query: 'department' },
] as const

const quickScreenLinks = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Inventory', to: '/dashboard/inventory' },
  { label: 'Stock loans', to: '/dashboard/seller-loans' },
  { label: 'Sales', to: '/dashboard/receipts' },
  { label: 'Settings', to: '/dashboard/settings' },
  { label: 'Profile', to: '/dashboard/profile' },
] as const

const trimmedSearch = computed(() => searchQuery.value.trim())

function askAboutCategory(title: string) {
  openAssistant(buildAssistantTopicPrompt(title))
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Safe for v-html: escapes source text, wraps case-insensitive query matches in <mark>. */
function highlightText(text: string, needle: string): string {
  const escaped = escapeHtml(text)
  const q = needle.trim()
  if (!q) {
    return escaped
  }
  const qEscaped = escapeHtml(q)
  const re = new RegExp(escapeRegExp(qEscaped), 'gi')
  return escaped.replace(
    re,
    (m) =>
      `<mark class="rounded px-0.5 bg-amber-200/95 text-gray-900 dark:bg-amber-400/30 dark:text-gray-100">${m}</mark>`
  )
}

function textMatches(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase())
}

const filteredCategories = computed(() => {
  const n = searchQuery.value.trim()
  if (!n) {
    return categories
  }

  return categories
    .map((cat) => {
      const catText = `${cat.title} ${cat.blurb}`
      const articles = cat.articles.filter((a) => {
        const inTitle = textMatches(a.title, n)
        const inBody = a.body.some((p) => textMatches(p, n))
        const inBullets = a.bullets?.some((b) => textMatches(b, n)) ?? false
        return inTitle || inBody || inBullets
      })
      const catMatch = textMatches(catText, n)
      if (articles.length > 0) {
        return { ...cat, articles }
      }
      if (catMatch) {
        return cat
      }
      return null
    })
    .filter((c): c is Category => c !== null)
})

function scrollToSection(id: string) {
  if (!import.meta.client) return
  router.replace({ hash: `#${id}` })
  nextTick(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function scrollToTop() {
  if (!import.meta.client) return
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function onHelpScroll() {
  if (!import.meta.client) return
  showBackToTop.value = window.scrollY > 320
}

onMounted(() => {
  if (!import.meta.client) return
  const h = window.location.hash
  if (h.length > 1) {
    const id = h.slice(1)
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
  onHelpScroll()
  window.addEventListener('scroll', onHelpScroll, { passive: true })
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('scroll', onHelpScroll)
  }
})
</script>

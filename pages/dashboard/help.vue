<template>
  <div class="ds-root s-c s-page">
    <SPageHeader title="Help">
      <template #description>
        How Storvv works: inventory, sales, staff access, branches and plans.
      </template>
      <template #actions>
        <SButton variant="secondary" :loading="isReplayingTour" @click="replayDashboardTour">
          Replay tour
        </SButton>
        <SButton v-if="assistantEnabled" @click="openAssistant()">
          <template #leading><Sparkles :size="16" :stroke-width="2" aria-hidden="true" /></template>
          Ask assistant
        </SButton>
      </template>
    </SPageHeader>

    <div class="s-help__search">
      <SSearch v-model="searchQuery" placeholder="Search help" label="Search help topics" />
      <div class="s-help__topics" role="group" aria-label="Popular topics">
        <button
          v-for="topic in popularTopics"
          :key="topic.query"
          type="button"
          class="s-help__topic"
          :aria-pressed="trimmedSearch === topic.query"
          @click="searchQuery = trimmedSearch === topic.query ? '' : topic.query"
        >
          {{ topic.label }}
        </button>
      </div>
    </div>

    <SCard v-if="filteredCategories.length === 0">
      <SEmptyState
        title="No help topics found"
        :description="
          assistantEnabled
            ? `Nothing matches “${trimmedSearch}”. Try another word, or ask the assistant.`
            : `Nothing matches “${trimmedSearch}”. Try another word.`
        "
      >
        <template #icon><SearchX :size="24" :stroke-width="1.75" aria-hidden="true" /></template>
        <template #actions>
          <SButton variant="secondary" @click="searchQuery = ''">Clear search</SButton>
          <SButton v-if="assistantEnabled" @click="openAssistant(buildAssistantTopicPrompt(trimmedSearch))">
            Ask assistant
          </SButton>
        </template>
      </SEmptyState>
    </SCard>

    <div v-else class="s-help__layout">
      <nav class="s-help__toc s-hide-md" aria-label="Help topics">
        <p class="s-help__toc-label">Topics</p>
        <ul>
          <li v-for="cat in filteredCategories" :key="cat.id">
            <a :href="`#${cat.id}`" class="s-help__toc-link" @click.prevent="scrollToSection(cat.id)">
              {{ cat.title }}
            </a>
          </li>
        </ul>
      </nav>

      <div class="s-help__sections">
        <SCard v-for="cat in filteredCategories" :id="cat.id" :key="cat.id" class="s-help__section">
          <header class="s-help__section-head">
            <span class="s-help__section-icon" aria-hidden="true">
              <component :is="cat.webIcon" :size="20" :stroke-width="1.75" />
            </span>
            <div class="s-help__section-text">
              <h2 class="s-help__section-title" v-html="highlightText(cat.title, trimmedSearch, WEB_MARK_CLASS)" />
              <p class="s-help__section-blurb" v-html="highlightText(cat.blurb, trimmedSearch, WEB_MARK_CLASS)" />
            </div>
            <SButton v-if="assistantEnabled" variant="ghost" size="sm" @click="askAboutCategory(cat.title)">
              Ask assistant
            </SButton>
          </header>

          <article v-for="(article, idx) in cat.articles" :key="idx" class="s-help__article">
            <h3 class="s-help__article-title" v-html="highlightText(article.title, trimmedSearch, WEB_MARK_CLASS)" />
            <p
              v-for="(para, pIdx) in article.body"
              :key="pIdx"
              v-html="highlightText(para, trimmedSearch, WEB_MARK_CLASS)"
            />
            <ul v-if="article.bullets?.length">
              <li
                v-for="(b, bIdx) in article.bullets"
                :key="bIdx"
                v-html="highlightText(b, trimmedSearch, WEB_MARK_CLASS)"
              />
            </ul>
          </article>
        </SCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import {
  ArrowLeftRight,
  BarChart3,
  Building2,
  LayoutGrid,
  Megaphone,
  Package,
  Receipt,
  SearchX,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserRound,
} from '@lucide/vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SPageHeader from '~/components/s/SPageHeader.vue'
import SSearch from '~/components/s/SSearch.vue'
import {
  buildAssistantTopicPrompt,
  useDashboardAssistant,
} from '~/composables/useDashboardAssistant'
import { useUser } from '~/composables/useUser'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useAppToast } from '~/composables/useAppToast'
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

const { openAssistant, enabled: assistantEnabled } = useDashboardAssistant()
const { resetTutorial } = useUser()
const authStore = useAuthStore()
const userStore = useUserStore()
const toast = useAppToast()
const isReplayingTour = ref(false)

async function replayDashboardTour() {
  const uid = authStore.currentUser?.uid
  if (!uid) return

  isReplayingTour.value = true
  try {
    await resetTutorial(uid)
    if (userStore.userData) {
      userStore.userData = {
        ...userStore.userData,
        hasCompletedTutorial: false,
      }
    }
    toast.success('Opening your dashboard tour')
    await router.push('/dashboard?tutorial=replay')
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not restart the tour'
    toast.error(message)
  } finally {
    isReplayingTour.value = false
  }
}

type Category = DashboardHelpCategory & { webIcon: Component }

const webCategoryIcons: Record<DashboardHelpCategoryId, Component> = {
  'recent-updates': Megaphone,
  'mobile-app': Smartphone,
  'getting-started': Sparkles,
  'navigation-search': LayoutGrid,
  inventory: Package,
  'sales-receipts-customers': Receipt,
  analytics: BarChart3,
  'activity-logs': ShieldCheck,
  'departments-staff': Building2,
  'multi-store': ArrowLeftRight,
  'settings-subscription': Settings,
  'profile-notifications': UserRound,
}

const categories: Category[] = dashboardHelpCategories.map((category) => ({
  ...category,
  webIcon: webCategoryIcons[category.id],
}))

const router = useRouter()

const searchQuery = ref('')

const popularTopics = [
  { label: "What's new", query: 'recent updates' },
  { label: 'Mobile app', query: 'ios android native' },
  { label: 'Getting started', query: 'getting started' },
  { label: 'Staff & roles', query: 'staff' },
  { label: 'Sales & refunds', query: 'receipt' },
  { label: 'Inventory', query: 'inventory' },
  { label: 'Stock loans', query: 'stock loan' },
  { label: 'Plans & billing', query: 'plan' },
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

const WEB_MARK_CLASS = 's-help__mark'

/** Safe for v-html: escapes source text, wraps case-insensitive query matches in <mark>. */
function highlightText(text: string, needle: string, markClass = WEB_MARK_CLASS): string {
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
      `<mark class="${markClass}">${m}</mark>`
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

onMounted(() => {
  if (!import.meta.client) return
  const h = window.location.hash
  if (h.length > 1) {
    const id = h.slice(1)
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
})
</script>

<template>
  <section id="product" aria-label="Product capabilities">
    <article
      v-for="(story, index) in stories"
      :key="story.id"
      :id="story.id"
      :ref="(el) => setStoryRef(story.id, el)"
      :data-section-id="`landing-story-${story.id}`"
      class="landing-story scroll-animate scroll-animate-up"
      :class="{ 'landing-story--reverse': index % 2 === 1 }"
    >
      <div class="landing-story__inner">
        <div class="landing-story__copy">
          <p class="landing-story__eyebrow">{{ story.eyebrow }}</p>
          <h2 class="landing-story__title">{{ story.title }}</h2>
          <p class="landing-story__lede">{{ story.lede }}</p>
          <ul v-if="story.bullets?.length" class="landing-story__bullets">
            <li v-for="bullet in story.bullets" :key="bullet">{{ bullet }}</li>
          </ul>
        </div>

        <div class="landing-story__visual">
          <div
            class="landing-story__stage landing-glass"
            :class="{ 'landing-story__stage--active': activeStoryId === story.id }"
          >
            <div class="landing-story__mock-bar" aria-hidden="true">
              <span class="landing-story__mock-dot" />
              <span class="landing-story__mock-dot" />
              <span class="landing-story__mock-dot" />
              <span class="landing-story__stage-label">{{ story.eyebrow }}</span>
            </div>

            <div class="landing-story__crossfade">
              <img
                v-for="(shot, shotIndex) in story.shots"
                :key="shot"
                :src="shot"
                :alt="`${story.eyebrow} product screenshot`"
                class="landing-story__shot"
                :class="{
                  'landing-story__shot--active':
                    activeStoryId === story.id
                      ? shotIndex === activeShotIndex
                      : shotIndex === 0,
                }"
                loading="lazy"
                width="960"
                height="640"
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useLandingReducedMotion } from '~/composables/useLandingHeroMotion'

const stories = [
  {
    id: 'inventory',
    eyebrow: 'Inventory',
    title: 'Categories, serials, and stock you can trust.',
    lede:
      'Organize products in folders with optional subcategories, custom fields, and serial or quantity tracking per branch.',
    bullets: [
      'One-level subcategories (for example Toyota → Corolla)',
      'Serial lines or bulk counts with low-stock alerts',
      'Customer buybacks add trade-in stock at cost',
      'Department-scoped folder access for staff',
    ],
    shots: ['/marketing/screenshots/inventory.png', '/marketing/screenshots/buybacks.png'],
  },
  {
    id: 'sales',
    eyebrow: 'Sales & customers',
    title: 'From enquiry to receipt in one workspace.',
    lede:
      'Ring up sales with the full wizard or Quick Sale, track customers and balances, and collect remotely with Paystack links.',
    bullets: [
      'Create New Sale and Quick Sale with barcode support',
      'Sales leads pipeline (Medium+) before the receipt exists',
      'Customer balance ledger, refunds, and WhatsApp receipts',
      'Payment links on every plan for remote checkout',
    ],
    shots: [
      '/marketing/screenshots/receipts.png',
      '/marketing/screenshots/sales-leads.png',
      '/marketing/screenshots/payment-links.png',
    ],
  },
  {
    id: 'storefront',
    eyebrow: 'Storefront',
    title: 'A public showroom backed by your real stock.',
    lede:
      'Publish selected inventory to a guest catalogue. Shoppers browse, enquire, or reserve - you confirm in the dashboard and complete sales that update private stock.',
    bullets: [
      'Share a storefront URL or QR from Settings',
      'Guest contact and reservation requests in one inbox',
      'Complete & sell creates a receipt and decrements inventory',
      'Optional online checkout via Paystack when enabled',
    ],
    shots: [
      '/marketing/screenshots/dashboard.png',
      '/marketing/screenshots/receipts-customers.png',
    ],
  },
  {
    id: 'solutions',
    eyebrow: 'Multi-store',
    title: 'One business. Every branch. One login.',
    lede:
      'Switch stores instantly, transfer stock on Enterprise, and copy category templates across branches without copying live quantities.',
    bullets: [
      'Region-aware branch names from your onboarding country',
      'Stock transfers with approval and transfer history',
      'Copy from branch for Enterprise template rollout',
      'Stock loans for serial inventory lent to borrowers',
    ],
    shots: [
      '/marketing/screenshots/multi-store-sync.png',
      '/marketing/screenshots/seller-loans.png',
      '/marketing/screenshots/analytics.png',
    ],
  },
]

const prefersReducedMotion = useLandingReducedMotion()
const activeStoryId = ref(stories[0]?.id ?? 'inventory')
const activeShotIndex = ref(0)
const storyEls = new Map<string, Element>()

function setStoryRef(id: string, el: unknown) {
  if (el && el instanceof Element) storyEls.set(id, el)
  else storyEls.delete(id)
}

let shotTimer: ReturnType<typeof setInterval> | null = null
let observer: IntersectionObserver | null = null

function bumpShot() {
  const story = stories.find((s) => s.id === activeStoryId.value)
  if (!story || story.shots.length < 2) return
  activeShotIndex.value = (activeShotIndex.value + 1) % story.shots.length
}

onMounted(() => {
  if (!import.meta.client) return

  void nextTick(() => {
    observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (!visible?.target) return
        const id = (visible.target as HTMLElement).id
        if (id && id !== activeStoryId.value) {
          activeStoryId.value = id
          activeShotIndex.value = 0
        }
      },
      { threshold: [0.35, 0.55] }
    )

    storyEls.forEach((el) => observer?.observe(el))
  })

  if (!prefersReducedMotion.value) {
    shotTimer = setInterval(bumpShot, 3200)
  }
})

onBeforeUnmount(() => {
  if (shotTimer) clearInterval(shotTimer)
  observer?.disconnect()
})
</script>

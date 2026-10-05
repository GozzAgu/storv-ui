<template>
  <section id="tour" class="mk-section" aria-labelledby="mk-tour-title">
    <div class="mk-container">
      <MkSectionHead
        title-id="mk-tour-title"
        eyebrow="Product tour"
        title="A closer look"
        accent="inside Storvv."
        lede="The three jobs you do every day, each a few taps away."
      />

      <div class="mk-tour mk-reveal">
        <div
          class="mk-tour__tabs"
          role="tablist"
          aria-label="Product areas"
          aria-orientation="vertical"
          @keydown="onKeydown"
        >
          <button
            v-for="(tab, i) in tabs"
            :id="`mk-tour-tab-${tab.id}`"
            :key="tab.id"
            ref="tabEls"
            type="button"
            role="tab"
            class="mk-tour__tab"
            :aria-selected="active === i"
            aria-controls="mk-tour-panel"
            :tabindex="active === i ? 0 : -1"
            @click="active = i"
          >
            <span class="mk-tour__icon"
              ><component :is="tab.icon" :size="18" aria-hidden="true"
            /></span>
            <span class="mk-tour__tab-body">
              <span class="mk-tour__tab-title">{{ tab.title }}</span>
              <span class="mk-tour__tab-text">{{ tab.lede }}</span>
            </span>
          </button>
        </div>

        <div
          id="mk-tour-panel"
          class="mk-tour__panel"
          role="tabpanel"
          :aria-labelledby="`mk-tour-tab-${current.id}`"
        >
          <div class="mk-tour__stage">
            <Transition name="mk-swap" mode="out-in">
              <img
                :key="current.photo"
                class="mk-tour__photo"
                :src="current.photo"
                alt=""
                width="1152"
                height="864"
                loading="lazy"
                decoding="async"
              />
            </Transition>
            <Transition name="mk-swap" mode="out-in">
              <MkFrame
                :key="current.id"
                class="mk-tour__shot"
                :src="current.shot"
                :alt="current.alt"
                :url="`app.storvv.com/${current.path}`"
              />
            </Transition>
          </div>

          <div class="mk-tour__footer">
            <ul class="mk-tour__points">
              <li v-for="point in current.points" :key="point">
                <Check :size="16" aria-hidden="true" />{{ point }}
              </li>
            </ul>
            <NuxtLink to="/features#explore" class="mk-link">
              Explore {{ current.title.toLowerCase() }}
              <ArrowRight :size="16" aria-hidden="true" />
            </NuxtLink>
          </div>
        </div>

        <div class="mk-tour__cta">
          <p class="mk-tour__cta-text">
            <strong>See it with real data.</strong> Click around a sample shop, no sign-up needed.
          </p>
          <SButton variant="secondary" class="mk-btn mk-btn--compact" to="/demo/dashboard">
            Try the live demo
            <template #trailing><ArrowRight :size="16" aria-hidden="true" /></template>
          </SButton>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowLeftRight, ArrowRight, Boxes, Check, ReceiptText } from '@lucide/vue'
import SButton from '~/components/s/SButton.vue'
import MkFrame from '~/components/marketing/MkFrame.vue'
import MkSectionHead from '~/components/marketing/MkSectionHead.vue'

const tabs = [
  {
    id: 'inventory',
    icon: Boxes,
    title: 'Inventory',
    lede: "Know exactly what's on your shelves.",
    points: ['Low-stock alerts', 'Serial or quantity tracking', 'Stock value at a glance'],
    photo: '/marketing/tour-stockroom.webp',
    path: 'inventory',
    shot: '/marketing/app/inventory.webp',
    alt: 'Storvv inventory: categories with stock value, item counts and a low-stock flag',
  },
  {
    id: 'sales',
    icon: ReceiptText,
    title: 'Sales',
    lede: 'Ring up a sale in seconds.',
    points: ['Cash, card, transfer or split', 'WhatsApp receipts', 'Stock updates instantly'],
    photo: '/marketing/tour-counter.webp',
    path: 'receipts',
    shot: '/marketing/app/sales.webp',
    alt: 'Storvv sales: receipts with customers, items, totals, profit and payment status',
  },
  {
    id: 'branches',
    icon: ArrowLeftRight,
    title: 'Branches',
    lede: 'Every branch, one login.',
    points: ['Switch stores in one tap', 'Approved stock transfers', 'One login for the team'],
    photo: '/marketing/tour-stockroom.webp',
    path: 'multi-store-sync',
    shot: '/marketing/app/branches.webp',
    alt: 'Storvv transfers: stock moving between branches with approval status',
  },
]

const active = ref(0)
const current = computed(() => tabs[active.value]!)
const tabEls = ref<HTMLButtonElement[]>([])

function onKeydown(event: KeyboardEvent) {
  const last = tabs.length - 1
  const next: Record<string, number> = {
    ArrowDown: active.value === last ? 0 : active.value + 1,
    ArrowRight: active.value === last ? 0 : active.value + 1,
    ArrowUp: active.value === 0 ? last : active.value - 1,
    ArrowLeft: active.value === 0 ? last : active.value - 1,
    Home: 0,
    End: last,
  }
  const target = next[event.key]
  if (target === undefined) return
  event.preventDefault()
  active.value = target
  tabEls.value[target]?.focus()
}
</script>

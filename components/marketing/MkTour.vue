<template>
  <section id="tour" class="mk-section" aria-labelledby="mk-tour-title">
    <div class="mk-container">
      <MkSectionHead
        title-id="mk-tour-title"
        eyebrow="Product tour"
        title="See it"
        accent="in the product."
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
            <NuxtLink to="/demo/dashboard" class="mk-link">
              Open the live demo
              <ArrowRight :size="16" aria-hidden="true" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowLeftRight, ArrowRight, Boxes, ReceiptText, Users, UsersRound } from '@lucide/vue'
import MkFrame from '~/components/marketing/MkFrame.vue'
import MkSectionHead from '~/components/marketing/MkSectionHead.vue'

const tabs = [
  {
    id: 'inventory',
    icon: Boxes,
    title: 'Inventory',
    lede: "What's on the shelf.",
    photo: '/marketing/tour-stockroom.webp',
    path: 'inventory',
    shot: '/marketing/app/inventory.webp',
    alt: 'Storvv inventory: categories with stock value, item counts and a low-stock flag',
  },
  {
    id: 'sales',
    icon: ReceiptText,
    title: 'Sales',
    lede: 'Ring up in seconds.',
    photo: '/marketing/tour-counter.webp',
    path: 'receipts',
    shot: '/marketing/app/sales.webp',
    alt: 'Storvv sales: receipts with customers, items, totals, profit and payment status',
  },
  {
    id: 'customers',
    icon: Users,
    title: 'Customers',
    lede: 'Who owes what.',
    photo: '/marketing/tour-counter.webp',
    path: 'customers',
    shot: '/marketing/app/customers.webp',
    alt: 'Storvv customers with open balances and recent purchases',
  },
  {
    id: 'team',
    icon: UsersRound,
    title: 'Team',
    lede: 'Roles that fit.',
    photo: '/marketing/tour-stockroom.webp',
    path: 'team',
    shot: '/marketing/app/team.webp',
    alt: 'Storvv team screen with staff roles and permissions',
  },
  {
    id: 'branches',
    icon: ArrowLeftRight,
    title: 'Branches',
    lede: 'One login, every store.',
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

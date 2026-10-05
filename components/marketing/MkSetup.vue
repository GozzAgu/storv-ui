<template>
  <section class="mk-section mk-section--alt" aria-labelledby="mk-setup-title">
    <div class="mk-container">
      <MkSectionHead
        title-id="mk-setup-title"
        eyebrow="Get started"
        title="Up and running"
        accent="before your next customer."
      />

      <div class="mk-setup mk-reveal" @mouseenter="paused = true" @mouseleave="paused = false">
        <ol class="mk-setup__steps" aria-label="Setup steps">
          <li
            v-for="(step, i) in steps"
            :key="step.id"
            class="mk-setup__step"
            :class="{
              'mk-setup__step--active': active === i,
              'mk-setup__step--done': i < active,
            }"
            :aria-current="active === i ? 'step' : undefined"
          >
            <span class="mk-setup__num">
              <Check v-if="i < active" :size="14" aria-hidden="true" />
              <template v-else>{{ i + 1 }}</template>
            </span>
            <span class="mk-setup__step-body">
              <span class="mk-setup__step-title">{{ step.title }}</span>
              <span class="mk-setup__time">
                <Clock :size="12" aria-hidden="true" />{{ step.time }}
              </span>
            </span>
            <span class="mk-setup__track" aria-hidden="true">
              <span
                class="mk-setup__fill"
                :class="{ 'mk-setup__fill--paused': paused }"
                @animationend="advance"
              />
            </span>
          </li>
        </ol>

        <div class="mk-setup__stage">
          <Transition name="mk-swap" mode="out-in">
            <div :key="current.id" class="mk-setup__card" aria-hidden="true">
              <span class="mk-setup__result">
                <span class="mk-setup__result-icon"
                  ><component :is="current.result.icon" :size="16"
                /></span>
                <span class="mk-setup__result-body">
                  <span class="mk-setup__result-title">{{ current.result.title }}</span>
                  <span class="mk-mini__sub">{{ current.result.text }}</span>
                </span>
              </span>
              <!-- 1. Create your store -->
              <template v-if="current.id === 'store'">
                <p class="mk-setup__card-head">
                  New store
                  <span class="mk-mini__pill mk-mini__pill--success">Free</span>
                </p>
                <div class="mk-setup__field mk-setup__in">
                  <span class="mk-setup__label">Store name</span>
                  <span class="mk-setup__input">Ada's Gadgets<span class="mk-caret" /></span>
                </div>
                <div class="mk-setup__field mk-setup__in">
                  <span class="mk-setup__label">What do you sell?</span>
                  <span class="mk-setup__chips">
                    <span class="mk-setup__chip mk-setup__chip--on">
                      <Check :size="12" />Gadgets
                    </span>
                    <span class="mk-setup__chip">Fashion</span>
                    <span class="mk-setup__chip">Groceries</span>
                  </span>
                </div>
                <span class="mk-setup__button mk-setup__in">
                  Create store<ArrowRight :size="16" />
                </span>
              </template>

              <!-- 2. Add your stock -->
              <template v-else-if="current.id === 'stock'">
                <p class="mk-setup__card-head">
                  <span class="mk-setup__crumb"><FolderOpen :size="16" />Phones</span>
                  <span class="mk-mini__pill">3 items</span>
                </p>
                <div
                  v-for="item in stock"
                  :key="item.name"
                  class="mk-mini__row mk-setup__in"
                  :class="{ 'mk-mini__row--alert': item.low }"
                >
                  <span class="mk-mini__thumb" :class="{ 'mk-mini__thumb--warning': item.low }"
                    ><component :is="item.icon" :size="16"
                  /></span>
                  <span class="mk-mini__main">
                    <span class="mk-mini__strong">{{ item.name }}</span>
                    <span class="mk-mini__sub">{{ item.price }}</span>
                  </span>
                  <span
                    class="mk-mini__pill"
                    :class="item.low ? 'mk-mini__pill--warning' : 'mk-mini__pill--success'"
                    >{{ item.qty }}</span
                  >
                </div>
              </template>

              <!-- 3. Start selling -->
              <template v-else>
                <p class="mk-setup__card-head">
                  Sale complete
                  <span class="mk-mini__pill mk-mini__pill--success">Paid</span>
                </p>
                <p class="mk-setup__amount mk-setup__in">₦485,000</p>
                <p class="mk-mini__sub mk-setup__in">iPhone 13 128GB · Bank transfer</p>
                <div class="mk-mini__row mk-setup__in">
                  <span class="mk-mini__thumb mk-setup__thumb--success"><Send :size="16" /></span>
                  <span class="mk-mini__main">
                    <span class="mk-mini__strong">Receipt sent</span>
                    <span class="mk-mini__sub">On WhatsApp</span>
                  </span>
                  <Check :size="16" class="mk-setup__ok" />
                </div>
                <div class="mk-mini__row mk-setup__in">
                  <SAvatar name="Chioma Eze" size="sm" />
                  <span class="mk-mini__main">
                    <span class="mk-mini__strong">Chioma Eze</span>
                    <span class="mk-mini__sub">Joined your team</span>
                  </span>
                  <span class="mk-mini__pill mk-mini__pill--accent">Manager</span>
                </div>
              </template>
            </div>
          </Transition>
        </div>

        <div class="mk-setup__footer">
          <p class="mk-setup__total">
            <Timer :size="16" aria-hidden="true" />Ready in about 10 minutes
          </p>
          <div class="mk-setup__actions">
            <SButton variant="ghost" class="mk-btn mk-btn--compact" to="/demo/dashboard">
              Try the demo
            </SButton>
            <SButton variant="primary" class="mk-btn mk-btn--compact" :to="appUrl">
              Start free
              <template #trailing><ArrowRight :size="16" aria-hidden="true" /></template>
            </SButton>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ArrowRight,
  Boxes,
  Check,
  Clock,
  FolderOpen,
  Headphones,
  Send,
  Smartphone,
  Store,
  Timer,
  TrendingUp,
  Watch,
} from '@lucide/vue'
import SAvatar from '~/components/s/SAvatar.vue'
import SButton from '~/components/s/SButton.vue'
import MkSectionHead from '~/components/marketing/MkSectionHead.vue'
import { useMarketingAppUrl } from '~/composables/useMarketingSite'

const appUrl = useMarketingAppUrl()

const steps = [
  {
    id: 'store',
    title: 'Create your store',
    time: '1 min',
    result: { icon: Store, title: 'Your store is live', text: 'Micro plan · Free' },
  },
  {
    id: 'stock',
    title: 'Add your stock',
    time: '5 min',
    result: { icon: Boxes, title: '₦5.95m in stock', text: '20 units tracked' },
  },
  {
    id: 'sell',
    title: 'Start selling',
    time: 'Instant',
    result: { icon: TrendingUp, title: '+₦485,000 today', text: 'Stock updated' },
  },
]

const stock = [
  { icon: Smartphone, name: 'iPhone 13 128GB', price: '₦485,000', qty: '6 in stock', low: false },
  { icon: Headphones, name: 'AirPods Pro', price: '₦210,000', qty: '12 in stock', low: false },
  { icon: Watch, name: 'Apple Watch SE', price: '₦260,000', qty: '2 left', low: true },
]

const active = ref(0)
const current = computed(() => steps[active.value]!)
const paused = ref(false)

function advance() {
  active.value = (active.value + 1) % steps.length
}
</script>

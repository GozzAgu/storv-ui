<template>
  <section id="product" class="mk-section mk-section--alt" aria-labelledby="mk-platform-title">
    <div class="mk-container">
      <div class="mk-platform-head">
        <MkSectionHead
          title-id="mk-platform-title"
          align="start"
          eyebrow="The platform"
          title="Everything the counter needs."
          accent="Nothing it doesn't."
          lede="Stock, sales, customers and reports in one place. Every answer is a tap away."
        >
          <NuxtLink to="/features" class="mk-link">
            See every feature
            <ArrowRight :size="16" aria-hidden="true" />
          </NuxtLink>
        </MkSectionHead>

        <figure class="mk-platform-head__visual mk-reveal">
          <img
            class="mk-platform-head__photo"
            src="/marketing/platform-surprise.webp"
            alt="A shop owner with her hands raised to her cheeks in surprise, surrounded by blue question marks"
            width="1024"
            height="1024"
            loading="lazy"
            decoding="async"
          />
          <ul class="mk-floats" aria-hidden="true">
            <li class="mk-float mk-float--ask-stock">
              <span class="mk-float__title">Where did that stock go?</span>
            </li>
            <li class="mk-float mk-float--ask-owed">
              <span class="mk-float__title">Who still owes me?</span>
            </li>
            <li class="mk-float mk-float--inverse mk-float--answer">
              <span class="mk-float__icon mk-float__icon--success"><Check :size="18" /></span>
              <span class="mk-float__body">
                <span class="mk-float__title">Answered in Storvv</span>
                <span class="mk-float__text">Stock, sales and balances, live</span>
              </span>
            </li>
          </ul>
        </figure>
      </div>

      <ul class="mk-bento">
        <!-- Inventory -->
        <li class="mk-tile mk-reveal">
          <p class="mk-tile__label">
            <span class="mk-tile__icon"><Boxes :size="16" aria-hidden="true" /></span>Inventory
          </p>
          <h3 class="mk-tile__title">Know what's on every shelf.</h3>
          <div class="mk-mini" aria-hidden="true">
            <div class="mk-mini__row mk-mini__row--alert">
              <span class="mk-mini__thumb mk-mini__thumb--warning"
                ><TriangleAlert :size="16"
              /></span>
              <span class="mk-mini__main">
                <span class="mk-mini__strong">iPhone 13 128GB</span>
              </span>
              <span class="mk-mini__pill mk-mini__pill--warning">2 left</span>
            </div>
          </div>
        </li>

        <!-- Sales -->
        <li class="mk-tile mk-reveal">
          <p class="mk-tile__label">
            <span class="mk-tile__icon"><ReceiptText :size="16" aria-hidden="true" /></span>Sales
          </p>
          <h3 class="mk-tile__title">Sell in seconds.</h3>
          <div class="mk-mini" aria-hidden="true">
            <div class="mk-mini__row">
              <span class="mk-mini__thumb"><Send :size="16" /></span>
              <span class="mk-mini__main">
                <span class="mk-mini__strong">₦500,000</span>
              </span>
              <span class="mk-mini__pill mk-mini__pill--success">Receipt sent</span>
            </div>
          </div>
        </li>

        <!-- Customers -->
        <li class="mk-tile mk-reveal">
          <p class="mk-tile__label">
            <span class="mk-tile__icon"><UsersRound :size="16" aria-hidden="true" /></span>Customers
          </p>
          <h3 class="mk-tile__title">See who owes you.</h3>
          <div class="mk-mini" aria-hidden="true">
            <div class="mk-mini__row">
              <SAvatar name="Ada Okonkwo" size="sm" />
              <span class="mk-mini__main">
                <span class="mk-mini__strong">Ada Okonkwo</span>
              </span>
              <span class="mk-mini__pill mk-mini__pill--warning">Owes ₦120,000</span>
            </div>
          </div>
        </li>

        <!-- Reports -->
        <li class="mk-tile mk-reveal">
          <p class="mk-tile__label">
            <span class="mk-tile__icon"><BarChart3 :size="16" aria-hidden="true" /></span>Reports
          </p>
          <h3 class="mk-tile__title">Know what you made.</h3>
          <div class="mk-mini" aria-hidden="true">
            <div class="mk-mini__row">
              <span class="mk-mini__thumb"><BarChart3 :size="16" /></span>
              <span class="mk-mini__main">
                <span class="mk-mini__strong">₦1.24m this week</span>
              </span>
              <span class="mk-mini__pill mk-mini__pill--success">+18%</span>
            </div>
          </div>
        </li>

        <!-- Team -->
        <li class="mk-tile mk-reveal">
          <p class="mk-tile__label">
            <span class="mk-tile__icon"><UserCog :size="16" aria-hidden="true" /></span>Team
          </p>
          <h3 class="mk-tile__title">Control who sees what.</h3>
          <div class="mk-mini" aria-hidden="true">
            <div class="mk-mini__row">
              <SAvatar name="Chioma Eze" size="sm" />
              <span class="mk-mini__main">
                <span class="mk-mini__strong">Chioma Eze</span>
              </span>
              <span class="mk-mini__pill mk-mini__pill--accent">Manager</span>
            </div>
          </div>
        </li>

        <!-- Branches -->
        <li class="mk-tile mk-reveal">
          <p class="mk-tile__label">
            <span class="mk-tile__icon"><ArrowLeftRight :size="16" aria-hidden="true" /></span
            >Branches
          </p>
          <h3 class="mk-tile__title">Every branch, one login.</h3>
          <div class="mk-mini" aria-hidden="true">
            <div class="mk-mini__row">
              <span class="mk-mini__thumb"><ArrowLeftRight :size="16" /></span>
              <span class="mk-mini__main">
                <span class="mk-mini__strong">Lagos → Abuja</span>
              </span>
              <span class="mk-mini__pill mk-mini__pill--success">Approved</span>
            </div>
          </div>
        </li>
      </ul>

      <!-- How it connects -->
      <div class="mk-flow mk-reveal">
        <h3 class="mk-flow__title">One sale. Everything updates.</h3>
        <ol class="mk-flow__steps">
          <li v-for="step in flow" :key="step.label" class="mk-flow__step">
            <component :is="step.icon" :size="16" aria-hidden="true" />
            <span>
              <span class="mk-flow__label">{{ step.label }}</span>
              <span class="mk-flow__value">{{ step.value }}</span>
            </span>
          </li>
        </ol>
        <SButton variant="secondary" class="mk-btn mk-btn--compact" to="/demo/dashboard">
          Try the live demo
          <template #trailing><ArrowRight :size="16" aria-hidden="true" /></template>
        </SButton>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  ArrowLeftRight,
  ArrowRight,
  BarChart3,
  Boxes,
  Check,
  ReceiptText,
  Send,
  TriangleAlert,
  UserCog,
  UsersRound,
} from '@lucide/vue'
import SAvatar from '~/components/s/SAvatar.vue'
import SButton from '~/components/s/SButton.vue'
import MkSectionHead from '~/components/marketing/MkSectionHead.vue'

const flow = [
  { icon: ReceiptText, label: 'Sale', value: '₦25,000' },
  { icon: Boxes, label: 'Stock', value: '−1 unit' },
  { icon: UsersRound, label: 'Customer', value: '+1 visit' },
  { icon: BarChart3, label: 'Report', value: '+₦25,000' },
]
</script>

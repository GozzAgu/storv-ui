<template>
  <section class="mk-section mki" aria-labelledby="mk-impact-title">
    <div class="mk-container">
      <div class="mki__panel">
        <MkSectionHead
          title-id="mk-impact-title"
          eyebrow="In the product"
          title="The screens"
          accent="you'll live in."
        />

        <ul class="mki__shots">
          <li
            v-for="(shot, i) in shots"
            :key="shot.id"
            class="mki__shot mk-reveal"
            :style="{ '--i': i }"
          >
            <MkFrame :src="shot.src" :alt="shot.alt" :url="shot.url" />
            <p class="mki__shot-label">{{ shot.label }}</p>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import MkFrame from '~/components/marketing/MkFrame.vue'
import MkSectionHead from '~/components/marketing/MkSectionHead.vue'

const shots = [
  {
    id: 'overview',
    label: 'Overview',
    src: '/marketing/app/overview.webp',
    url: 'app.storvv.com/dashboard',
    alt: 'Storvv overview with revenue, sales and low-stock alerts',
  },
  {
    id: 'sales',
    label: 'Sales',
    src: '/marketing/app/sales.webp',
    url: 'app.storvv.com/sales',
    alt: 'Storvv sales list with receipts and payment status',
  },
  {
    id: 'customers',
    label: 'Customers',
    src: '/marketing/app/customers.webp',
    url: 'app.storvv.com/customers',
    alt: 'Storvv customers with balances owed',
  },
  {
    id: 'team',
    label: 'Team',
    src: '/marketing/app/team.webp',
    url: 'app.storvv.com/team',
    alt: 'Storvv team permissions and roles',
  },
]
</script>

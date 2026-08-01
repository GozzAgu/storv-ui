<template>
  <section id="product" aria-label="Product capabilities">
    <article
      v-for="(story, index) in stories"
      :key="story.id"
      :id="story.id"
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
          <div class="landing-story__mock landing-glass">
            <div class="landing-story__mock-bar" aria-hidden="true">
              <span class="landing-story__mock-dot" />
              <span class="landing-story__mock-dot" />
              <span class="landing-story__mock-dot" />
            </div>

            <template v-if="story.visual === 'inventory'">
              <div
                v-for="row in inventoryRows"
                :key="row.name"
                class="landing-story__mock-row"
              >
                <div>
                  <p class="landing-story__mock-label">{{ row.name }}</p>
                  <p class="landing-story__mock-meta">{{ row.count }} products</p>
                </div>
                <span
                  class="landing-story__mock-pill"
                  :class="row.warn ? 'landing-story__mock-pill--warn' : ''"
                >
                  {{ row.status }}
                </span>
              </div>
            </template>

            <template v-else-if="story.visual === 'sales'">
              <div class="landing-story__mock-row">
                <div>
                  <p class="landing-story__mock-label">Checkout</p>
                  <p class="landing-story__mock-meta">iPhone 15 Pro · 1 unit</p>
                </div>
                <span class="landing-story__mock-meta">₦890,000</span>
              </div>
              <div class="landing-story__mock-row">
                <div>
                  <p class="landing-story__mock-label">Customer</p>
                  <p class="landing-story__mock-meta">Ada Okonkwo</p>
                </div>
                <span class="landing-story__mock-pill">Paid</span>
              </div>
              <div class="landing-story__mock-row">
                <div>
                  <p class="landing-story__mock-label">Receipt</p>
                  <p class="landing-story__mock-meta">RCP-1042 · WhatsApp sent</p>
                </div>
              </div>
            </template>

            <template v-else-if="story.visual === 'branches'">
              <div
                v-for="branch in branchRows"
                :key="branch.name"
                class="landing-story__mock-row"
              >
                <div>
                  <p class="landing-story__mock-label">{{ branch.name }}</p>
                  <p class="landing-story__mock-meta">{{ branch.meta }}</p>
                </div>
                <span class="landing-story__mock-pill">{{ branch.status }}</span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
const stories = [
  {
    id: 'inventory',
    eyebrow: 'Inventory',
    title: 'Know exactly what you have.',
    lede: 'Track products, categories, stock levels, and movement across every branch.',
    bullets: ['Categories and subcategories', 'Serial and quantity tracking', 'Low stock alerts'],
    visual: 'inventory' as const,
  },
  {
    id: 'sales',
    eyebrow: 'Smart sales',
    title: 'Turn every sale into a seamless experience.',
    lede: 'Fast checkout, customer details, receipts, and payment tracking in one flow.',
    bullets: ['Create sales in seconds', 'Customer balances', 'WhatsApp and PDF receipts'],
    visual: 'sales' as const,
  },
  {
    id: 'solutions',
    eyebrow: 'Multi-store',
    title: 'One business. Multiple locations. Complete control.',
    lede: 'Branch management, stock transfers, and reporting from a single login.',
    bullets: ['Switch branches instantly', 'Stock transfers', 'Copy categories across branches'],
    visual: 'branches' as const,
  },
]

const inventoryRows = [
  { name: 'Smartphones', count: '320', status: 'Healthy', warn: false },
  { name: 'Accessories', count: '148', status: 'Low stock', warn: true },
  { name: 'Laptops', count: '64', status: 'Healthy', warn: false },
]

const branchRows = [
  { name: 'Lagos, Lekki', meta: '142 products · ₦18.2M stock value', status: 'Active' },
  { name: 'Abuja, Wuse', meta: '98 products · ₦11.4M stock value', status: 'Active' },
  { name: 'Transfer pending', meta: '12 units · Lagos → Abuja', status: 'In transit' },
]
</script>

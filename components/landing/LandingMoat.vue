<template>
  <section id="why-storvv" class="landing-section landing-section--muted">
    <div class="landing-container">
      <p class="landing-eyebrow">Why Storvv wins on the shop floor</p>
      <h2 class="landing-section__title">Built for how African retailers actually sell</h2>
      <p class="landing-section__lead">
        Spreadsheets and generic POS tools do not connect WhatsApp, remote Paystack checkout, and multi-branch stock.
        Storvv does all three in one workspace.
      </p>
      <div class="landing-moat-grid">
        <article v-for="item in items" :key="item.title" class="landing-moat-card">
          <h3 class="landing-moat-card__title">{{ item.title }}</h3>
          <p class="landing-moat-card__body">{{ item.body }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const items = [
  {
    title: 'WhatsApp-native sales',
    body: 'Share receipts and payment nudges on WhatsApp. Follow up on customer balance without leaving the thread your buyers already use.',
  },
  {
    title: 'Payment links tied to stock',
    body: 'Send a Paystack link with the amount locked to your inventory. When they pay, you get notified and can close the sale with less back-and-forth.',
  },
  {
    title: 'Multi-branch that syncs',
    body: 'Move stock between Lagos and Abuja with approval and history. Enterprise operators run one account, not three separate notebooks.',
  },
]
</script>

<style scoped>
.landing-moat-grid {
  display: grid;
  gap: 1rem;
  margin-top: 2rem;
}
@media (min-width: 768px) {
  .landing-moat-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
.landing-moat-card {
  border-radius: 1.5rem;
  border: 0;
  background: #ffffff;
  padding: 1.25rem;
}
.landing-moat-card__title {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1523;
}
.landing-moat-card__body {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.55;
  color: rgb(26 21 35 / 0.58);
}
html.dark .landing-moat-card {
  background: #1e1e1e;
}
html.dark .landing-moat-card__title {
  color: #ffffff;
}
html.dark .landing-moat-card__body {
  color: rgb(255 255 255 / 0.62);
}
</style>

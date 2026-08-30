<template>
  <section id="stories" class="landing-section">
    <div class="landing-container">
      <p class="landing-eyebrow">Shop stories</p>
      <h2 class="landing-section__title">Retailers getting their first win fast</h2>
      <div class="landing-stories-grid">
        <article v-for="story in stories" :key="story.shop" class="landing-story-card">
          <p class="landing-story-card__shop">{{ story.shop }}</p>
          <p class="landing-story-card__location">{{ story.location }}</p>
          <p class="landing-story-card__quote">"{{ story.quote }}"</p>
          <p class="landing-story-card__result">{{ story.result }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const stories = [
  {
    shop: 'Copenhagen Electronics',
    location: 'Lagos, NG',
    quote: 'We added our first 20 SKUs and recorded a sale the same afternoon. WhatsApp receipts cut payment follow-ups in half.',
    result: 'First sale in session · Micro plan',
  },
  {
    shop: 'GRA Fashion Hub',
    location: 'Port Harcourt, NG',
    quote: 'Payment links let us take remote deposits without sending account numbers in chat. Stock stays tied to the link amount.',
    result: 'Remote checkout · Medium plan',
  },
  {
    shop: 'Abuja Tech Wholesale',
    location: 'Abuja, NG',
    quote: 'Two branches, one dashboard. Transfers with approval replaced our WhatsApp “please send 5 iPhones” chaos.',
    result: 'Multi-branch sync · Enterprise',
  },
]
</script>

<style scoped>
.landing-stories-grid {
  display: grid;
  gap: 1rem;
  margin-top: 2rem;
}
@media (min-width: 768px) {
  .landing-stories-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
.landing-story-card {
  border-radius: 1rem;
  border: 1px solid rgb(15 23 42 / 0.08);
  padding: 1.25rem;
  background: #fff;
}
.landing-story-card__shop {
  font-weight: 600;
  color: #0f172a;
}
.landing-story-card__location {
  font-size: 0.75rem;
  color: #64748b;
}
.landing-story-card__quote {
  margin-top: 0.75rem;
  font-size: 0.875rem;
  line-height: 1.55;
  color: #334155;
}
.landing-story-card__result {
  margin-top: 0.75rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #143f8d;
}
</style>

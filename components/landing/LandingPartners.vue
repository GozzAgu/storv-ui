<template>
  <section id="partners" class="landing-section landing-section--muted">
    <div class="landing-container">
      <p class="landing-eyebrow">Partners</p>
      <h2 class="landing-section__title">Work with Storvv</h2>
      <p class="landing-section__lead">
        Phone shops, accountants, and POS resellers help merchants get set up. Partner programs include co-branded onboarding and referral tracking.
      </p>
      <ul class="landing-partners-list">
        <li v-for="channel in channels" :key="channel.title">
          <strong>{{ channel.title }}</strong>
          <span>{{ channel.detail }}</span>
        </li>
      </ul>
      <p class="mt-4 text-sm" style="color: var(--portfolio-muted, rgb(26 21 35 / 0.58))">
        Partner enquiries:
        <a href="mailto:partners@storvv.com" class="font-medium underline-offset-2 hover:underline" style="color: var(--portfolio-ink, #1a1523)">partners@storvv.com</a>
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
const channels = [
  { title: 'Phone & gadget retailers', detail: 'Bundle Storvv with device sales and warranty tracking.' },
  { title: 'Accountants & bookkeepers', detail: 'Excel exports and price-change audit trails merchants can hand over at month end.' },
  { title: 'POS resellers', detail: 'Migrate shops from spreadsheets with a guided first product + first sale setup.' },
]
</script>

<style scoped>
.landing-partners-list {
  margin-top: 1.5rem;
  display: grid;
  gap: 0.75rem;
}
.landing-partners-list li {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem;
  border-radius: 1.5rem;
  background: #ffffff;
  border: 0;
  font-size: 0.875rem;
  color: rgb(26 21 35 / 0.58);
}
.landing-partners-list strong {
  color: #1a1523;
}
html.dark .landing-partners-list li {
  background: #1e1e1e;
  color: rgb(255 255 255 / 0.62);
}
html.dark .landing-partners-list strong {
  color: #ffffff;
}
</style>

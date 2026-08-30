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
      <p class="mt-4 text-sm text-gray-600">
        Partner enquiries:
        <a href="mailto:partners@storvv.com" class="font-medium text-primary-700 hover:underline">partners@storvv.com</a>
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
  border-radius: 0.75rem;
  background: rgb(255 255 255 / 0.7);
  border: 1px solid rgb(15 23 42 / 0.06);
  font-size: 0.875rem;
  color: #475569;
}
.landing-partners-list strong {
  color: #0f172a;
}
</style>

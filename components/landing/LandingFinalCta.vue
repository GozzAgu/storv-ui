<template>
  <section
    id="get-started"
    data-section-id="landing-final-cta"
    class="landing-final-cta scroll-animate scroll-animate-up"
    aria-labelledby="landing-final-cta-title"
  >
    <h2 id="landing-final-cta-title" class="landing-final-cta__title">
      Ready to simplify your retail business?
    </h2>
    <div class="landing-final-cta__actions">
      <a :href="appUrl" class="landing-pill-cta">Start free</a>
      <NuxtLink to="/demo/dashboard" class="landing-pill-cta landing-pill-cta--secondary">
        Try demo
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  appUrl: string
}>()
</script>

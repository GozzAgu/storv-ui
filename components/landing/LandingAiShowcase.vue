<template>
  <section
    id="assistant"
    data-section-id="landing-ai"
    class="landing-ai scroll-animate scroll-animate-up"
    aria-labelledby="landing-ai-title"
  >
    <div class="landing-ai__inner">
      <p class="landing-story__eyebrow">Storvv Assistant</p>
      <h2 id="landing-ai-title" class="landing-ai__title">Your intelligent retail assistant.</h2>
      <p class="landing-ai__lede">
        Ask how screens work, what your plan includes, and how to run workflows like copy-from-branch,
        sales leads, or stock loans - powered by the same Help center knowledge base (no access to
        your live stock or sales numbers).
      </p>

      <div class="landing-ai__chat landing-glass" role="presentation">
        <div class="landing-ai__msg landing-ai__msg--user">
          How do sales leads work on Medium?
        </div>
        <div class="landing-ai__msg landing-ai__msg--ai">
          Open Sales leads to log enquiries, update status, and use Create sale to open the receipt
          wizard with the customer prefilled. When the receipt completes, the lead is marked Won.
        </div>
      </div>

      <div class="landing-ai__chips" aria-label="Suggested prompts">
        <span v-for="chip in chips" :key="chip" class="landing-ai__chip">{{ chip }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const chips = [
  'What is Solo workspace?',
  'What is on the free Micro plan?',
  'How do I upgrade my subscription?',
  'How do payment links work?',
  'Copy categories from another branch',
]
</script>

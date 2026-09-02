<template>
  <section
    id="assistant"
    data-section-id="landing-ai"
    class="landing-ai scroll-animate scroll-animate-up"
    aria-labelledby="landing-ai-title"
  >
    <div class="landing-ai__inner landing-ai__inner--split">
      <div class="landing-ai__copy">
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

      <div class="landing-ai__visual" aria-hidden="true">
        <img
          src="/marketing/illustrations/ai-workflow-icon.png"
          alt=""
          class="landing-ai__visual-img"
          loading="lazy"
          width="320"
          height="320"
        />
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

<style scoped>
.landing-ai__inner--split {
  max-width: 68rem;
  text-align: left;
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  gap: 2.5rem;
}

@media (min-width: 900px) {
  .landing-ai__inner--split {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 3rem;
  }
}

.landing-ai__copy {
  flex: 1 1 auto;
  min-width: 0;
}

.landing-ai__visual {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 11rem;
  height: 11rem;
  border-radius: 1.5rem;
  background: #ffffff;
}

@media (min-width: 900px) {
  .landing-ai__visual {
    width: 14rem;
    height: 14rem;
  }
}

.landing-ai__visual-img {
  width: 62%;
  height: 62%;
  object-fit: contain;
}

html.dark .landing-ai__visual {
  background: #1e1e1e;
}
</style>

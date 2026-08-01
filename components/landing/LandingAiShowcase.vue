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
        Ask questions, learn workflows, and get help navigating reports, inventory, and settings -
        without leaving your dashboard.
      </p>

      <div class="landing-ai__chat landing-glass" role="presentation">
        <div class="landing-ai__msg landing-ai__msg--user">
          How do I copy categories from another branch?
        </div>
        <div class="landing-ai__msg landing-ai__msg--ai">
          Open Inventory, tap Copy from branch, pick the source branch, and choose whether to include
          subcategories. Enterprise plans support this across stores.
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
  'Show today\'s revenue',
  'What is low stock?',
  'Create a sale',
  'Set up a new branch',
]
</script>

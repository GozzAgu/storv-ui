<template>
  <section
    id="contact"
    data-section-id="contact"
    class="landing-contact scroll-animate scroll-animate-up"
    aria-labelledby="landing-contact-title"
  >
    <div class="landing-contact__inner">
      <header class="landing-contact__header">
        <p class="landing-label landing-label--blue">Contact</p>
        <h2 id="landing-contact-title" class="landing-contact__title">Get in touch</h2>
        <p class="landing-contact__lede">
          Questions, founding-store applications (multi-branch retail, sales, or procurement teams),
          partnerships with accountants or POS resellers. We read every message.
        </p>
      </header>

      <div class="landing-contact__grid">
        <article class="landing-contact__card landing-contact-animate" style="--contact-i: 0">
          <div class="landing-contact__card-top">
            <span class="landing-contact__step">01</span>
            <EnvelopeIcon class="landing-contact__icon" stroke-width="1.5" aria-hidden="true" />
          </div>
          <h3 class="landing-contact__card-title">Say hello</h3>
          <p class="landing-contact__card-desc">
            Applying for founding onboarding? Include branch count, city, and whether you sell phones,
            accessories, or general retail.
          </p>
        </article>

        <article class="landing-contact__card landing-contact-animate" style="--contact-i: 1">
          <div class="landing-contact__card-top">
            <span class="landing-contact__step">02</span>
            <GlobeAltIcon class="landing-contact__icon" stroke-width="1.5" aria-hidden="true" />
          </div>
          <h3 class="landing-contact__card-title">Email us directly</h3>
          <p class="landing-contact__card-desc">Quick questions? Skip the form and write us anytime.</p>
          <a href="mailto:hello@storvv.com" class="landing-contact__email">
            hello@storvv.com
          </a>
        </article>

        <article
          class="landing-contact__card landing-contact__card--primary landing-contact-animate"
          style="--contact-i: 2"
        >
          <div class="landing-contact__card-top">
            <span class="landing-contact__step landing-contact__step--on-dark">03</span>
            <DocumentTextIcon class="landing-contact__icon landing-contact__icon--on-dark" stroke-width="1.5" aria-hidden="true" />
          </div>
          <h3 class="landing-contact__card-title landing-contact__card-title--on-dark">
            Send a detailed message
          </h3>
          <p class="landing-contact__card-desc landing-contact__card-desc--on-dark">
            Best for demos, partnerships, or longer questions. One form, all the context we need.
          </p>
          <button type="button" class="landing-contact__cta" @click="emit('open-form')">
            Open contact form
            <ArrowRightIcon class="h-5 w-5 shrink-0" aria-hidden="true" />
          </button>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  ArrowRightIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  GlobeAltIcon,
} from '@heroicons/vue/24/outline'

const emit = defineEmits<{
  'open-form': []
}>()
</script>

<template>
  <div>
    <!-- Slim home: hero → problem → proof → product stories → teasers → FAQ → CTA -->
    <LandingShowcase
      :logo-src="marketingLogoSrc"
      :dark-logo-src="landingLogoSrc"
      :app-url="appOriginUrl"
    />

    <LandingProblemSolution />

    <LandingProof class="landing-proof--premium" />

    <LandingScrollTimeline />

    <LandingProductStories />

    <LandingAiShowcase />

    <LandingFeaturesTeaser />

    <LandingSecurityTeaser />

    <!-- Pricing teaser: full plan breakdown and live prices live on /pricing -->
    <LandingPlansTeaser />

    <LandingFaq />

    <LandingContact @open-form="showContactFormModal = true" />

    <LandingFinalCta :app-url="appOriginUrl" />

    <!-- Contact Form Modal -->
    <Modal
      :model-value="showContactFormModal"
      @update:model-value="showContactFormModal = $event"
      size="xl"
      :show-close="true"
      :blur-backdrop="false"
    >
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Contact Us</h3>
      </template>
      <div class="min-h-[500px]">
        <iframe
          v-if="showContactFormModal"
          src="https://forms.fillout.com/t/89G44ZqC6Zus"
          title="Contact form"
          class="w-full h-[600px] min-h-[500px] border-0 rounded-sm"
        />
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import '~/assets/css/landing.css'
import { computed, onMounted, ref } from 'vue'
import Modal from '~/components/ui/Modal.vue'
import { useThemeStore } from '~/stores/theme'
import { useLandingScrollAnimations } from '~/composables/useLandingScrollAnimations'

definePageMeta({ layout: 'marketing' })

const themeStore = useThemeStore()
const { setup: setupScrollAnimations } = useLandingScrollAnimations()

/** Light wordmark for light canvas. */
const marketingLogoSrc = '/storvv logo 2.png'
/** Wordmark that contrasts the current landing canvas. */
const landingLogoSrc = computed(() =>
  themeStore.actualTheme === 'dark' ? '/storvv logo.png' : '/storvv logo 2.png'
)

const showContactFormModal = ref(false)
const runtimeConfig = useRuntimeConfig()
const appOriginUrl = computed(() => {
  const o = runtimeConfig.public.appOrigin
  return typeof o === 'string' && o.length > 0 ? o : 'https://app.storvv.com'
})


onMounted(() => {
  if (import.meta.client) {
    setTimeout(() => setupScrollAnimations(), 100)
  }
})

useHead({
  title: 'Storvv - The retail operating system for modern businesses',
  meta: [
    {
      name: 'description',
      content:
        'Storvv: inventory, sales, analytics, and multi-store tools for retailers. Web dashboard today, iOS and Android apps coming soon.',
    },
  ],
})
</script>

<style scoped>
/* Hero: unified glass surfaces (mobile sync strip + desktop floats) */
.landing-hero-float-card {
  border-radius: 1.5rem;
  border: 0;
  background: #ffffff;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  transition: background-color 300ms ease-out;
}

@media (hover: hover) and (pointer: fine) {
  .landing-hero-float-card:hover {
    transform: none;
    border-color: transparent;
    background: #eeeeef;
    box-shadow: none;
  }
}

html.dark .landing-hero-float-card {
  background: #1e1e1e;
}

html.dark .landing-hero-float-card:hover {
  background: #282828;
}

@media (prefers-reduced-motion: reduce) {
  .landing-hero-float-card,
  .landing-hero-float-card:hover {
    transition: none;
    transform: none;
  }
}

/* Hero: faint blueprint mesh (readable center, fades at edges) */
.landing-hero-grid {
  background-image: linear-gradient(rgb(15 23 42 / 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgb(15 23 42 / 0.05) 1px, transparent 1px);
  background-size: 52px 52px;
  mask-image: radial-gradient(ellipse 110% 85% at 50% 32%, rgb(0 0 0) 22%, transparent 72%);
  -webkit-mask-image: radial-gradient(ellipse 110% 85% at 50% 32%, rgb(0 0 0) 22%, transparent 72%);
}

/* Hero headline: bg-clip-text + tight leading can shear descenders (y, g); give glyphs room */
.landing-hero-headline {
  overflow: visible;
}
.landing-hero-gradient-heading {
  overflow: visible;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  background-clip: text;
  -webkit-background-clip: text;
}
</style>

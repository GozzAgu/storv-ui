<template>
  <div data-auth-shell class="ds-root s-c s-auth">
    <div class="s-auth__frame">
      <aside class="s-auth__brand">
        <img
          class="s-auth__brand-photo"
          src="/marketing/people/gadget-store.webp"
          alt=""
          width="864"
          height="1152"
          decoding="async"
          fetchpriority="high"
        />
        <a href="https://www.storvv.com" class="s-auth__brand-logo" aria-label="Storvv home">
          <img src="/brand/storvv-logo-reversed.png" alt="" width="140" height="32" />
        </a>

        <div class="s-auth__brand-body">
          <p v-if="panelEyebrow" class="s-auth__pill">{{ panelEyebrow }}</p>
          <h2 class="s-auth__brand-title">{{ panelTitle }}</h2>
          <p class="s-auth__brand-copy">{{ panelDescription }}</p>

          <ol class="s-auth__steps" :aria-label="stepsLabel">
            <li
              v-for="(step, i) in stepItems"
              :key="step.label"
              class="s-auth__step"
              :class="{ 's-auth__step--active': i === activeStep }"
              :aria-current="i === activeStep ? 'step' : undefined"
            >
              <span class="s-auth__step-index">{{ i + 1 }}</span>
              <span class="s-auth__step-label">{{ step.label }}</span>
            </li>
          </ol>
        </div>
      </aside>

      <main class="s-auth__main" @click="dismissKeyboardFromBackgroundTap">
        <div class="s-auth__content" :class="{ 's-auth__content--wide': wide }">
          <a href="https://www.storvv.com" class="s-auth__mobile-logo" aria-label="Storvv home">
            <img
              class="s-auth__mobile-logo-light"
              src="/brand/storvv-logo.png"
              alt=""
              width="122"
              height="28"
            />
            <img
              class="s-auth__mobile-logo-dark"
              src="/brand/storvv-logo-reversed.png"
              alt=""
              width="122"
              height="28"
            />
          </a>
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { markCapacitorDocument } from '~/utils/capacitor-env'
import { dismissKeyboardFromBackgroundTap } from '~/utils/native-focus'

interface AuthShellStep {
  label: string
}

const defaultSteps: AuthShellStep[] = [
  { label: 'Create your account' },
  { label: 'Set up your store and branches' },
  { label: 'Invite your team and start selling' },
]

const props = withDefaults(
  defineProps<{
    panelEyebrow?: string
    panelTitle: string
    panelDescription: string
    steps?: AuthShellStep[]
    /** Index of the highlighted step; -1 highlights none. */
    activeStep?: number
    stepsLabel?: string
    /** Wider form column for longer forms. */
    wide?: boolean
  }>(),
  { activeStep: -1, stepsLabel: 'Getting started with Storvv', wide: false }
)

const stepItems = computed(() => (props.steps?.length ? props.steps : defaultSteps))

onMounted(() => {
  markCapacitorDocument()
})
</script>

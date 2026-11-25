<template>
  <main class="ds-root s-c err">
    <div class="err__card">
      <NuxtLink to="/" class="err__brand" aria-label="Storvv home">
        <img src="/brand/storvv-symbol.png" alt="" width="40" height="40" />
      </NuxtLink>

      <p class="err__code">{{ isNotFound ? '404' : 'Error' }}</p>
      <h1 class="err__title">
        {{ isNotFound ? 'This page doesn’t exist' : 'Something went wrong' }}
      </h1>
      <p class="err__text">
        {{
          isNotFound
            ? 'The link may be old or mistyped. Here are some places to go instead.'
            : 'Please try again. If it keeps happening, tell us and we’ll sort it out.'
        }}
      </p>

      <div class="err__actions">
        <button type="button" class="err__btn err__btn--primary" @click="goHome">
          Go to the home page
        </button>
        <NuxtLink to="/help" class="err__btn" @click="clear">Visit the help centre</NuxtLink>
      </div>

      <p class="err__contact">
        Need a hand?
        <a :href="whatsappUrl" target="_blank" rel="noopener">Chat on WhatsApp</a>
        or email <a :href="`mailto:${STORVV_CONTACT.email}`">{{ STORVV_CONTACT.email }}</a>
      </p>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { NuxtError } from '#app'
import { STORVV_CONTACT } from '~/utils/marketing-seo'
import { storvvWhatsappLink } from '~/utils/storvv-whatsapp'

const props = defineProps<{ error: NuxtError }>()

const isNotFound = computed(() => props.error?.statusCode === 404)
const whatsappUrl = storvvWhatsappLink('Hi Storvv, I need help with something on your website.')

useHead({
  title: computed(() =>
    isNotFound.value ? 'Page not found · Storvv' : 'Something went wrong · Storvv'
  ),
  meta: [{ name: 'robots', content: 'noindex' }],
})

function clear() {
  clearError()
}

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<style scoped>
.err {
  display: grid;
  place-items: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 24px 16px;
  background: var(--s-bg, #ffffff);
  color: var(--s-text, #0b0b0f);
  font-family: var(--s-font-sans, system-ui, sans-serif);
}

.err__card {
  display: grid;
  justify-items: center;
  gap: 12px;
  max-width: 480px;
  text-align: center;
}

.err__brand {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  margin-bottom: 8px;
  border-radius: 18px;
  background: var(--s-surface, #ffffff);
  box-shadow: 0 0 0 1px var(--s-line, #e4e4e7);
}

.err__code {
  font: 600 0.8125rem / 1.25rem var(--s-font-sans, system-ui, sans-serif);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--s-accent, #3d63f2);
}

.err__title {
  font: 800 clamp(1.75rem, 5vw, 2.25rem) / 1.15 var(--s-font-sans, system-ui, sans-serif);
  letter-spacing: -0.02em;
  text-wrap: balance;
}

.err__text {
  color: var(--s-text-2, #52525b);
  line-height: 1.6;
  text-wrap: pretty;
}

.err__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 12px;
}

.err__btn {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 20px;
  border: 0;
  border-radius: 10px;
  background: var(--s-surface-2, #f4f4f5);
  color: var(--s-text, #0b0b0f);
  font: 600 0.9375rem / 1 var(--s-font-sans, system-ui, sans-serif);
  text-decoration: none;
  cursor: pointer;
}

.err__btn--primary {
  background: var(--s-btn-primary, #3d63f2);
  color: var(--s-on-btn-primary, #ffffff);
}

.err__btn:focus-visible {
  outline: 2px solid var(--s-accent, #3d63f2);
  outline-offset: 2px;
}

.err__contact {
  margin-top: 16px;
  font-size: 0.875rem;
  color: var(--s-text-muted, #71717a);
}

.err__contact a {
  color: var(--s-accent, #3d63f2);
  font-weight: 600;
  text-decoration: none;
}

.err__contact a:hover {
  text-decoration: underline;
}
</style>

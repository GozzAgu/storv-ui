<template>
  <div class="mk-trust" :class="{ 'mk-trust--compact': compact }">
    <ul class="mk-trust__list" aria-label="How Storvv keeps your store safe">
      <li v-for="item in items" :key="item.label" class="mk-trust__item">
        <component
          :is="item.icon"
          class="mk-trust__icon"
          :size="14"
          :stroke-width="2"
          aria-hidden="true"
        />
        {{ item.label }}
      </li>
    </ul>
    <NuxtLink to="/security" class="mk-trust__link">
      How we protect your store
      <ArrowRight :size="13" :stroke-width="2" aria-hidden="true" />
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { ArrowRight, Lock, ShieldCheck, UserRoundCheck } from '@lucide/vue'

/** A quiet line of what keeps a store safe, linking to the full security page. */
defineProps<{ compact?: boolean }>()

// Only claims the product already delivers (see pages/security.vue)
const items = [
  { icon: Lock, label: 'Encrypted sign-in' },
  { icon: ShieldCheck, label: 'Two-factor for owners' },
  { icon: UserRoundCheck, label: 'Your data, never sold' },
]
</script>

<style scoped>
.mk-trust {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.mk-trust__list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.mk-trust__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 11px 0 9px;
  border-radius: var(--s-radius-full);
  background: color-mix(in srgb, var(--s-text) 5%, transparent);
  color: var(--s-text-2);
  font: 500 0.8125rem / 1 var(--s-font-sans);
  white-space: nowrap;
}

.mk-trust__icon {
  flex: none;
  color: var(--s-success);
}

.mk-trust__link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--s-text-muted);
  font: 500 0.8125rem / 1.4 var(--s-font-sans);
  text-decoration: none;
  transition: color 160ms ease;
}

.mk-trust__link:hover,
.mk-trust__link:focus-visible {
  color: var(--s-accent);
}

.mk-trust__link svg {
  transition: translate 160ms ease;
}

.mk-trust__link:hover svg {
  translate: 2px 0;
}

/* Inside a form: smaller, no pills, one quiet row */
.mk-trust--compact {
  gap: 6px;
}

.mk-trust--compact .mk-trust__list {
  gap: 4px 14px;
}

.mk-trust--compact .mk-trust__item {
  height: auto;
  padding: 0;
  background: none;
  color: var(--s-text-muted);
  font-size: 0.75rem;
}

.mk-trust--compact .mk-trust__icon {
  width: 13px;
  height: 13px;
}

.mk-trust--compact .mk-trust__link {
  font-size: 0.75rem;
}
</style>

<template>
  <div v-if="visible" class="mk-topbar" role="region" aria-label="Storvv announcements">
    <div class="mk-container mk-topbar__inner">
      <p class="mk-topbar__tagline">
        Point of sale and inventory for gadget stores, supermarkets and dealers
      </p>

      <div class="mk-topbar__links">
        <button type="button" class="mk-topbar__link" @click="walkthrough.open('landing_topbar')">
          <CalendarDays :size="15" :stroke-width="1.75" aria-hidden="true" />
          Book a walkthrough
        </button>
        <NuxtLink to="/help" class="mk-topbar__link">
          <LifeBuoy :size="15" :stroke-width="1.75" aria-hidden="true" />
          Help centre
        </NuxtLink>
        <NuxtLink v-if="offer" :to="signupUrl" class="mk-topbar__offer">
          <Gift :size="14" :stroke-width="2" aria-hidden="true" />
          {{ offer.headline }}
          <ArrowRight class="mk-topbar__arrow" :size="14" :stroke-width="2" aria-hidden="true" />
        </NuxtLink>
      </div>

      <button type="button" class="mk-topbar__close" aria-label="Hide this bar" @click="dismiss">
        <X :size="16" :stroke-width="2" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ArrowRight, CalendarDays, Gift, LifeBuoy, X } from '@lucide/vue'
import { useWalkthrough } from '~/composables/useWalkthrough'
import { useMarketingSignupUrl } from '~/composables/useMarketingSite'
import { getTrialOffer } from '~/utils/trial-offer'

/** Bump when the bar's message changes, so visitors who closed the old one see the new one. */
const DISMISS_KEY = 'storvv:mk-topbar-dismissed:v1'

const walkthrough = useWalkthrough()
const signupUrl = useMarketingSignupUrl()
const offer = getTrialOffer()
const visible = ref(true)

onMounted(() => {
  try {
    if (localStorage.getItem(DISMISS_KEY)) visible.value = false
  } catch {
    // Storage blocked: keep showing the bar.
  }
})

function dismiss() {
  visible.value = false
  try {
    localStorage.setItem(DISMISS_KEY, '1')
  } catch {
    // Storage blocked: the bar stays hidden for this visit only.
  }
}
</script>

<style scoped>
.mk-topbar {
  --mk-topbar-h: 40px;
  --mk-topbar-ink: rgb(255 255 255 / 0.92);
  --mk-topbar-soft: rgb(255 255 255 / 0.72);
  --mk-topbar-hover: rgb(255 255 255 / 0.1);
  --mk-topbar-pill: #ffffff;
  --mk-topbar-pill-ink: #15276a;

  position: relative;
  z-index: calc(var(--s-z-nav) + 1);
  background: var(--mk-navy);
  color: var(--mk-topbar-ink);
  font: 500 0.8125rem / 1.2 var(--s-font-sans);
}

.mk-topbar__inner {
  display: flex;
  align-items: center;
  gap: var(--s-space-3);
  min-height: var(--mk-topbar-h);
}

.mk-topbar__tagline {
  margin: 0;
  color: var(--mk-topbar-soft);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.mk-topbar__links {
  display: flex;
  align-items: center;
  gap: var(--s-space-1);
  margin-left: auto;
}

.mk-topbar__link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 0;
  border-radius: 999px;
  background: none;
  color: var(--mk-topbar-ink);
  font: inherit;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 150ms var(--s-ease);
}

.mk-topbar__link:hover {
  background: var(--mk-topbar-hover);
}

.mk-topbar__offer {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: var(--s-space-1);
  padding: 5px 12px;
  border-radius: 999px;
  background: var(--mk-topbar-pill);
  color: var(--mk-topbar-pill-ink);
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition: transform 150ms var(--s-ease);
}

.mk-topbar__offer:hover .mk-topbar__arrow {
  transform: translateX(2px);
}

.mk-topbar__arrow {
  transition: transform 150ms var(--s-ease);
}

.mk-topbar__close {
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  margin-right: -6px;
  border: 0;
  border-radius: 999px;
  background: none;
  color: var(--mk-topbar-soft);
  cursor: pointer;
  flex-shrink: 0;
}

.mk-topbar__close:hover {
  background: var(--mk-topbar-hover);
  color: var(--mk-topbar-ink);
}

.mk-topbar__link:focus-visible,
.mk-topbar__offer:focus-visible,
.mk-topbar__close:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}

/* Tablet: drop the tagline, keep the links */
@media (max-width: 1151px) {
  .mk-topbar__tagline {
    display: none;
  }

  .mk-topbar__links {
    margin-left: 0;
    flex: 1;
    justify-content: center;
  }
}

/* Phone: one line, the offer only */
@media (max-width: 639px) {
  .mk-topbar__link {
    display: none;
  }

  .mk-topbar__offer {
    margin-left: 0;
    padding: 0;
    background: none;
    color: var(--mk-topbar-ink);
  }

  .mk-topbar__inner {
    gap: var(--s-space-1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mk-topbar__link,
  .mk-topbar__offer,
  .mk-topbar__arrow {
    transition: none;
  }
}
</style>

<template>
  <section
    id="user-guide"
    data-section-id="landing-user-guide"
    class="landing-user-guide scroll-animate scroll-animate-up scroll-mt-[4.75rem] lg:scroll-mt-28"
    aria-labelledby="landing-user-guide-title"
  >
    <div class="landing-user-guide__glow" aria-hidden="true" />

    <div class="landing-user-guide__inner">
      <div class="landing-user-guide__copy">
        <p class="landing-label landing-label--blue">Documentation</p>
        <h2 id="landing-user-guide-title" class="landing-user-guide__title">
          The complete <span class="landing-user-guide__accent">Storvv user guide</span>
        </h2>
        <p class="landing-user-guide__lede">
          Every workflow in one PDF: inventory, receipts, staff, and multi-store ops.
        </p>

        <ul class="landing-user-guide__points">
          <li v-for="point in highlights" :key="point">{{ point }}</li>
        </ul>

        <div class="landing-user-guide__actions">
          <button
            type="button"
            class="landing-pill-cta landing-user-guide__btn"
            @click="previewOpen = true"
          >
            <EyeIcon class="landing-user-guide__btn-icon" aria-hidden="true" />
            Preview guide
          </button>
          <a
            :href="pdfUrl"
            download="Storvv-User-Guide.pdf"
            class="landing-pill-cta landing-pill-cta--outline landing-user-guide__btn"
          >
            <ArrowDownTrayIcon class="landing-user-guide__btn-icon" aria-hidden="true" />
            Download PDF
          </a>
        </div>

        <p class="landing-user-guide__meta">Free · No signup · {{ fileSizeLabel }}</p>
      </div>

      <div class="landing-user-guide__preview-wrap">
        <button
          type="button"
          class="landing-user-guide__preview-card"
          aria-label="Open full preview of Storvv User Guide"
          @click="previewOpen = true"
        >
          <div class="landing-user-guide__preview-chrome">
            <span class="landing-user-guide__preview-dot" />
            <span class="landing-user-guide__preview-dot" />
            <span class="landing-user-guide__preview-dot" />
            <span class="landing-user-guide__preview-label">Storvv User Guide</span>
            <span class="landing-user-guide__preview-badge">PDF</span>
          </div>
          <div class="landing-user-guide__preview-frame">
            <iframe
              :src="`${pdfUrl}#view=FitH&toolbar=0&navpanes=0`"
              title="Storvv User Guide preview"
              class="landing-user-guide__iframe"
              tabindex="-1"
            />
            <div class="landing-user-guide__preview-fade" aria-hidden="true" />
            <div class="landing-user-guide__preview-hover">
              <span class="landing-user-guide__preview-hover-pill">
                <ArrowsPointingOutIcon class="h-4 w-4" aria-hidden="true" />
                Open preview
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="landing-guide-modal">
        <div
          v-if="previewOpen"
          class="landing-user-guide-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="landing-user-guide-modal-title"
          @keydown.esc="previewOpen = false"
        >
          <button
            type="button"
            class="landing-user-guide-modal__backdrop"
            aria-label="Close preview"
            @click="previewOpen = false"
          />

          <div class="landing-user-guide-modal__panel">
            <header class="landing-user-guide-modal__header">
              <div class="landing-user-guide-modal__header-copy">
                <p class="landing-user-guide-modal__eyebrow">Preview</p>
                <h3 id="landing-user-guide-modal-title" class="landing-user-guide-modal__title">
                  Storvv User Guide
                </h3>
              </div>
              <div class="landing-user-guide-modal__header-actions">
                <a
                  :href="pdfUrl"
                  download="Storvv-User-Guide.pdf"
                  class="landing-pill-cta landing-pill-cta--outline landing-user-guide-modal__download"
                >
                  <ArrowDownTrayIcon class="h-4 w-4" aria-hidden="true" />
                  Download
                </a>
                <button
                  type="button"
                  class="landing-user-guide-modal__close"
                  aria-label="Close preview"
                  @click="previewOpen = false"
                >
                  <XMarkIcon class="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </header>
            <div class="landing-user-guide-modal__body">
              <iframe
                :src="pdfUrl"
                title="Storvv User Guide full preview"
                class="landing-user-guide-modal__iframe"
              />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import {
  ArrowDownTrayIcon,
  ArrowsPointingOutIcon,
  EyeIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'

const pdfUrl = '/docs/Storvv-User-Guide.pdf'
const fileSizeLabel = '~230 KB'

const highlights = [
  'Inventory, sales, returns, and receipts, step by step',
  'Roles, plans, and multi-branch setup for your whole team',
] as const

const previewOpen = ref(false)

watch(previewOpen, (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
})

onUnmounted(() => {
  if (!import.meta.client) return
  document.body.style.overflow = ''
})
</script>

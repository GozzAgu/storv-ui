<template>
  <div
    class="inv-folder-uisverse group relative flex h-full min-h-[78px] w-full cursor-pointer flex-col overflow-hidden rounded-sm bg-white shadow-[0_1px_2px_rgb(0_0_0_/_0.06)] transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-[0.98] dark:!bg-dashboard-card dark:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.04)] sm:min-h-[82px]"
    @click="$emit('click')"
  >
    <slot name="checkbox" />
    <slot name="menu" />

    <div
      class="inv-folder-uisverse__inner flex min-h-0 flex-1 flex-col justify-between gap-0.5 px-2 pb-1 text-left"
      :class="hasOverlays ? 'pt-4 sm:pt-5' : 'pt-2'"
    >
      <div class="flex min-h-0 flex-1 items-center gap-1.5">
        <span class="folder-container">
          <svg
            class="file-back"
            width="146"
            height="113"
            viewBox="0 0 146 113"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M0 4C0 1.79086 1.79086 0 4 0H50.3802C51.8285 0 53.2056 0.627965 54.1553 1.72142L64.3303 13.4371C65.2799 14.5306 66.657 15.1585 68.1053 15.1585H141.509C143.718 15.1585 145.509 16.9494 145.509 19.1585V109C145.509 111.209 143.718 113 141.509 113H3.99999C1.79085 113 0 111.209 0 109V4Z"
              :fill="`url(#${gid}-back)`"
            />
            <defs>
              <linearGradient
                :id="`${gid}-back`"
                x1="0"
                y1="0"
                x2="72.93"
                y2="95.4804"
                gradientUnits="userSpaceOnUse"
              >
                <stop stop-color="var(--inv-folder-back-a)" />
                <stop offset="1" stop-color="var(--inv-folder-back-b)" />
              </linearGradient>
            </defs>
          </svg>
          <svg
            class="file-page"
            width="88"
            height="99"
            viewBox="0 0 88 99"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect width="88" height="99" :fill="`url(#${gid}-page)`" />
            <defs>
              <linearGradient
                :id="`${gid}-page`"
                x1="0"
                y1="0"
                x2="81"
                y2="160.5"
                gradientUnits="userSpaceOnUse"
              >
                <stop stop-color="var(--inv-folder-page-a)" />
                <stop offset="1" stop-color="var(--inv-folder-page-b)" />
              </linearGradient>
            </defs>
          </svg>
          <svg
            class="file-front"
            width="160"
            height="79"
            viewBox="0 0 160 79"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M0.29306 12.2478C0.133905 9.38186 2.41499 6.97059 5.28537 6.97059H30.419H58.1902C59.5751 6.97059 60.9288 6.55982 62.0802 5.79025L68.977 1.18034C70.1283 0.410771 71.482 0 72.8669 0H77H155.462C157.87 0 159.733 2.1129 159.43 4.50232L150.443 75.5023C150.19 77.5013 148.489 79 146.474 79H7.78403C5.66106 79 3.9079 77.3415 3.79019 75.2218L0.29306 12.2478Z"
              :fill="`url(#${gid}-front)`"
            />
            <defs>
              <linearGradient
                :id="`${gid}-front`"
                x1="38.7619"
                y1="8.71323"
                x2="66.9106"
                y2="82.8317"
                gradientUnits="userSpaceOnUse"
              >
                <stop stop-color="var(--inv-folder-front-a)" />
                <stop offset="1" stop-color="var(--inv-folder-front-b)" />
              </linearGradient>
            </defs>
          </svg>
        </span>
        <div class="min-w-0 flex-1">
          <p
            class="truncate text-xs font-semibold leading-tight tracking-tight text-gray-900 dark:text-gray-50"
          >
            {{ name }}
          </p>
          <p class="mt-0.5 text-[10px] font-semibold tabular-nums tracking-tight text-gray-500 dark:text-gray-400">
            {{ itemCount }} {{ itemCount === 1 ? 'product' : 'products' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    name: string
    itemCount: number
    /** Stable id for SVG defs (e.g. folder id) */
    tileKey: string
    /** When false, less top padding (no checkbox / menu) */
    hasOverlays?: boolean
  }>(),
  { hasOverlays: true }
)

defineEmits<{
  click: []
}>()

const gid = computed(() => {
  const safe = props.tileKey.replace(/[^a-zA-Z0-9_-]/g, '-')
  return `inv-f-${safe}`.slice(0, 80)
})
</script>

<style scoped>
/**
 * SVG gradient stops — primary scale + neutrals from tailwind.config.js
 * (Plus Jakarta / Storvv blue: primary-100 → primary-600)
 */
.inv-folder-uisverse {
  --inv-folder-back-a: #c7d5f0;
  --inv-folder-back-b: #4876c7;
  --inv-folder-page-a: #ffffff;
  --inv-folder-page-b: #9ca3af;
  --inv-folder-front-a: #9ab5e3;
  --inv-folder-front-b: #0f357a;
}

.dark .inv-folder-uisverse {
  --inv-folder-back-a: #1e2d44;
  --inv-folder-back-b: #4876c7;
  --inv-folder-page-a: #e5e7eb;
  --inv-folder-page-b: #6b7280;
  --inv-folder-front-a: #6e94d6;
  --inv-folder-front-b: #143f8d;
}

.inv-folder-uisverse__inner {
  transition: background-color 0.3s ease;
}

/* Folder stack (from Uiverse / vinodjangid07) */
.folder-container {
  width: 28px;
  height: fit-content;
  min-height: 26px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  position: relative;
  flex-shrink: 0;
  perspective: 120px;
}

.file-back {
  z-index: 1;
  width: 80%;
  height: auto;
  display: block;
}

.file-page {
  width: 50%;
  height: auto;
  position: absolute;
  z-index: 2;
  transition: transform 0.3s ease-out;
  display: block;
  bottom: 12%;
}

.file-front {
  width: 85%;
  height: auto;
  position: absolute;
  z-index: 3;
  opacity: 0.95;
  transform-origin: bottom center;
  transition: transform 0.3s ease-out;
  display: block;
  bottom: 0;
}

.inv-folder-uisverse:hover .file-page {
  transform: translateY(-4px);
}

.inv-folder-uisverse:hover .file-front {
  transform: rotateX(28deg);
}
</style>

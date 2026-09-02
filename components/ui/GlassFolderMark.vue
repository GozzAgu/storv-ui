<template>
  <svg
    class="dash-folder-mark"
    viewBox="0 0 128 108"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient
        :id="glassId"
        x1="18"
        y1="40"
        x2="110"
        y2="96"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" class="dash-folder-mark__glass-stop-a" />
        <stop offset="48%" class="dash-folder-mark__glass-stop-b" />
        <stop offset="100%" class="dash-folder-mark__glass-stop-c" />
      </linearGradient>
    </defs>
    <path
      class="dash-folder-mark__tab"
      d="M18 32c0-7.18 5.82-13 13-13h24.4c3.72 0 7.16 2.06 8.88 5.36L69.6 32H99c8.28 0 15 6.72 15 15v6H18V32Z"
    />
    <rect class="dash-folder-mark__back" x="12" y="36" width="104" height="60" rx="16" />
    <rect
      class="dash-folder-mark__glass"
      :fill="`url(#${glassId})`"
      x="18"
      y="42"
      width="92"
      height="48"
      rx="13"
    />
    <rect class="dash-folder-mark__glass-edge" x="18" y="42" width="92" height="48" rx="13" />
    <path
      class="dash-folder-mark__lip"
      d="M28 50h72"
      stroke-linecap="round"
    />
    <path
      class="dash-folder-mark__shine"
      d="M32 54c12-8 26-11 40-8 14 3 28 12 38 22"
      stroke-linecap="round"
    />
  </svg>
</template>

<script setup lang="ts">
import { useId } from 'vue'

const glassId = `dfm-glass-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
</script>

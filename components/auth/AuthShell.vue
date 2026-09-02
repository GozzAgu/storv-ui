<template>
  <div
    data-auth-shell
    class="auth-shell auth-shell--modern"
    :class="{ 'auth-shell--compact': compact }"
  >
    <div class="auth-shell__atmosphere" aria-hidden="true">
      <span class="auth-shell__ray auth-shell__ray--1" />
      <span class="auth-shell__ray auth-shell__ray--2" />
      <span class="auth-shell__ray auth-shell__ray--3" />
    </div>

    <aside class="auth-shell__brand">
      <div class="auth-shell__brand-grid" aria-hidden="true" />

      <div class="auth-shell__brand-body">
        <a
          href="https://www.storvv.com"
          :class="authEntranceClass() + ' auth-shell__logo-link'"
        >
          <img
            src="/storvv logo.png"
            alt="Storvv"
            class="auth-shell__logo"
            width="140"
            height="40"
          />
        </a>

        <h2 :class="authEntranceClass(60) + ' auth-shell__brand-title'">
          {{ panelTitle }}
        </h2>
        <p :class="authEntranceClass(120) + ' auth-shell__brand-copy'">
          {{ panelDescription }}
        </p>

        <ul class="auth-shell__features">
          <li
            v-for="(item, i) in featureItems"
            :key="i"
            :class="authEntranceClass(180 + i * 70) + ' auth-shell__feature'"
          >
            <span class="auth-shell__feature-icon">
              <component :is="item.icon" aria-hidden="true" />
            </span>
            <p class="auth-shell__feature-text">{{ item.text }}</p>
          </li>
        </ul>
      </div>

      <p :class="authEntranceClass(420) + ' auth-shell__brand-foot'">
        <ShieldCheckIcon aria-hidden="true" />
        Secure sign-in · Encrypted connection
      </p>
    </aside>

    <main class="auth-shell__main">
      <div
        class="auth-shell__main-scroll"
        @click="dismissKeyboardFromBackgroundTap"
      >
        <div class="auth-shell__content" :class="contentWidthClass">
          <slot />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, type Component } from 'vue'
import { authEntranceClass } from '~/utils/auth-entrance'
import { markCapacitorDocument } from '~/utils/capacitor-env'
import { dismissKeyboardFromBackgroundTap } from '~/utils/native-focus'
import {
  ChartBarSquareIcon,
  CubeIcon,
  ShieldCheckIcon,
} from '~/utils/app-icons'
interface AuthShellFeature {
  icon: Component
  text: string
}

const defaultFeatures: AuthShellFeature[] = [
  {
    icon: CubeIcon,
    text: 'Track inventory and departments without spreadsheet chaos.',
  },
  {
    icon: ChartBarSquareIcon,
    text: 'See receipts, stock levels, and branch activity in one workspace.',
  },
  {
    icon: ShieldCheckIcon,
    text: 'Roles and permissions built for store managers and staff.',
  },
]

const props = withDefaults(
  defineProps<{
    mobileLine: string
    panelTitle: string
    panelDescription: string
    features?: AuthShellFeature[]
    contentWidthClass?: string
    compact?: boolean
  }>(),
  {
    contentWidthClass: 'max-w-[420px]',
    compact: false,
  }
)

const featureItems = computed(() =>
  props.features && props.features.length > 0 ? props.features : defaultFeatures
)

onMounted(() => {
  markCapacitorDocument()
})
</script>

<template>
  <header class="ios-global-top-bar">
    <NuxtLink :to="homeHref" class="ios-global-top-bar__logo-link" aria-label="Storvv home">
      <img
        src="/storvv logo mobile.png"
        alt=""
        class="ios-global-top-bar__logo"
        width="28"
        height="28"
        decoding="async"
      />
    </NuxtLink>

    <div class="ios-global-top-bar__actions">
      <button
        type="button"
        class="ios-global-top-bar__icon-btn"
        aria-label="Open Storvv Assistant"
        @click="$emit('open-assistant')"
      >
        <SparklesIcon class="ios-global-top-bar__icon" aria-hidden="true" />
      </button>

      <IosTabBarThemeButton class="ios-global-top-bar__theme" variant="topnav" />

      <DashboardProfileMenu
        class="ios-global-top-bar__profile-menu ios-global-top-bar__profile-menu--extreme"
        :user-name="userName"
        :user-email="userEmail"
        :user-initials="userInitials"
        compact
        @sign-out="$emit('sign-out')"
      />
    </div>
  </header>
</template>

<script setup lang="ts">
import { SparklesIcon } from '~/utils/app-icons'
import DashboardProfileMenu from '~/components/dashboard/DashboardProfileMenu.vue'
import IosTabBarThemeButton from '~/components/ios/IosTabBarThemeButton.vue'

withDefaults(
  defineProps<{
    userName?: string
    userEmail?: string
    userInitials?: string
    homeHref?: string
  }>(),
  {
    userName: 'User',
    userEmail: '',
    userInitials: 'U',
    homeHref: '/dashboard',
  }
)

defineEmits<{
  'open-assistant': []
  'sign-out': []
}>()
</script>

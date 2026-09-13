<template>
  <header class="ios-global-top-bar">
    <div class="ios-global-top-bar__leading">
      <slot name="leading">
        <DashboardBackButton
          v-if="showBack"
          :to="backTo"
          :label="backLabel"
          variant="icon"
          :fallback-to="fallbackTo"
        />
        <NuxtLink
          v-else
          :to="homeHref"
          class="ios-global-top-bar__logo-link"
          aria-label="Storvv home"
        >
          <img
            src="/storvv logo mobile.png"
            alt=""
            class="ios-global-top-bar__logo"
            width="36"
            height="36"
            decoding="async"
          />
        </NuxtLink>
      </slot>
    </div>

    <h1 v-if="title" class="ios-global-top-bar__title">{{ title }}</h1>
    <span v-else class="ios-global-top-bar__title ios-global-top-bar__title--empty" aria-hidden="true" />

    <div class="ios-global-top-bar__actions">
      <div id="ios-global-top-bar-trailing" class="ios-global-top-bar__trailing">
        <slot name="trailing" />
      </div>

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
import type { RouteLocationRaw } from 'vue-router'
import DashboardBackButton from '~/components/dashboard/DashboardBackButton.vue'
import DashboardProfileMenu from '~/components/dashboard/DashboardProfileMenu.vue'
import IosTabBarThemeButton from '~/components/ios/IosTabBarThemeButton.vue'

withDefaults(
  defineProps<{
    title?: string
    showBack?: boolean
    backTo?: RouteLocationRaw | null
    backLabel?: string
    fallbackTo?: RouteLocationRaw
    userName?: string
    userEmail?: string
    userInitials?: string
    homeHref?: string
  }>(),
  {
    title: '',
    showBack: false,
    backTo: null,
    backLabel: 'Back',
    fallbackTo: '/dashboard',
    userName: 'User',
    userEmail: '',
    userInitials: 'U',
    homeHref: '/dashboard',
  }
)

defineEmits<{
  'sign-out': []
}>()
</script>

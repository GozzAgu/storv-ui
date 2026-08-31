<template>
  <div class="auth-segment" role="tablist" aria-label="Authentication mode">
    <NuxtLink
      to="/signin"
      class="auth-segment__item"
      :class="{ 'auth-segment__item--active': mode === 'signin' }"
      role="tab"
      :aria-selected="mode === 'signin'"
    >
      Sign in
    </NuxtLink>
    <NuxtLink
      to="/signup"
      class="auth-segment__item"
      :class="{ 'auth-segment__item--active': mode === 'signup' }"
      role="tab"
      :aria-selected="mode === 'signup'"
    >
      Create account
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  mode: 'signin' | 'signup'
}>()
</script>

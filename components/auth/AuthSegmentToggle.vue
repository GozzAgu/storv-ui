<template>
  <nav class="s-tabs s-tabs--block s-auth-segment" aria-label="Sign in or create an account">
    <NuxtLink
      to="/signin"
      class="s-tabs__tab"
      :aria-current="mode === 'signin' ? 'page' : undefined"
    >
      Sign in
    </NuxtLink>
    <NuxtLink
      to="/signup"
      class="s-tabs__tab"
      :aria-current="mode === 'signup' ? 'page' : undefined"
    >
      Create account
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
defineProps<{
  mode: 'signin' | 'signup'
}>()
</script>

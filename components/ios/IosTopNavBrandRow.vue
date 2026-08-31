<template>
  <div class="ios-topnav-brand-row">
    <img
      src="/storvv logo mobile.png"
      alt="Storvv"
      class="ios-topnav-brand-row__logo"
      width="28"
      height="28"
      decoding="async"
    />
    <IosTabBarThemeButton class="ios-topnav-brand-row__theme" variant="topnav" />
  </div>
</template>

<script setup lang="ts">
import IosTabBarThemeButton from '~/components/ios/IosTabBarThemeButton.vue'
</script>

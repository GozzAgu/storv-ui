<template>
  <div class="s-auth-body">
    <slot />
    <div v-if="$slots.footer" class="s-auth-body__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

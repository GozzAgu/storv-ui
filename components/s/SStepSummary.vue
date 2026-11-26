<template>
  <p class="s-step-summary" aria-live="polite"><slot /></p>
</template>

<script setup lang="ts">
/**
 * The line above a guided form's buttons: what to do next while it's incomplete, then what will
 * happen when the button is pressed ("3 items · ₦45,000 → Lagos, Lekki"). Goes in the dialog's
 * `#footer` slot, before `SDialogActions`; it sits on its own row above the buttons.
 */
</script>

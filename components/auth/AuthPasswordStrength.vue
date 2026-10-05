<template>
  <div class="s-auth-strength" :class="`s-auth-strength--${strength.tier}`">
    <div v-if="password.length > 0" class="s-auth-strength__meter" aria-live="polite">
      <div class="s-auth-strength__head">
        <span>Password strength</span>
        <span class="s-auth-strength__label">{{ strength.label }}</span>
      </div>
      <div
        class="s-auth-strength__bars"
        role="meter"
        :aria-valuenow="strength.score"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuetext="strength.label"
        aria-label="Password strength"
      >
        <span
          v-for="segment in 4"
          :key="segment"
          class="s-auth-strength__bar"
          :class="{ 's-auth-strength__bar--on': segment <= strength.segments }"
        />
      </div>
      <p v-if="hint" class="s-auth-strength__hint">{{ hint }}</p>
    </div>
    <p class="s-auth-strength__hint">
      At least {{ PASSWORD_MIN_LENGTH }} characters, one number, and one uppercase letter.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  PASSWORD_MIN_LENGTH,
  getPasswordStrength,
  isPasswordPolicyValid,
} from '~/utils/passwordPolicy'

const props = defineProps<{ password: string }>()

const strength = computed(() => getPasswordStrength(props.password))

const hint = computed(() => {
  if (!props.password.length) return ''
  if (!isPasswordPolicyValid(props.password)) return 'Meet all the requirements below to continue.'
  if (strength.value.tier === 'strong') return 'This password looks strong.'
  if (strength.value.tier === 'good') return 'Good. Add variety or length to make it stronger.'
  return 'Add lowercase letters, symbols or more characters to make it stronger.'
})
</script>

<template>
  <slot v-if="parent" :id="controlId" :label-id="parent.labelId.value" :described-by="describedBy" :invalid="invalid" />
  <div v-else class="s-c s-field">
    <label v-if="label" :id="labelId" class="s-field__label" :for="controlId">
      {{ label }}<span v-if="required" class="s-field__required" aria-hidden="true">*</span
      ><span v-else-if="isOptionalHint" class="s-field__optional">Optional</span>
    </label>
    <slot :id="controlId" :label-id="label ? labelId : undefined" :described-by="describedBy" :invalid="invalid" />
    <p v-if="error" :id="errorId" class="s-field__error" role="alert">{{ error }}</p>
    <p v-else-if="hint && !isOptionalHint" :id="hintId" class="s-field__hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, provide, useId } from 'vue'
import { S_FIELD_KEY } from '~/components/s/field-context'

const props = defineProps<{
  label?: string
  /** `"Optional"` renders as a label tag instead of a hint line. */
  hint?: string
  error?: string
  required?: boolean
  id?: string
}>()

/** An unlabeled field inside another field (e.g. `SInput` in a custom `SField`) uses the outer label. */
const outer = inject(S_FIELD_KEY, null)
const nested = !!outer && !props.label && !props.hint && !props.error
const parent = nested ? outer : null
const claimedId = parent?.claimId()

const autoId = useId()
const controlId = computed(() => props.id || claimedId || `s-field-${autoId}`)
const labelId = computed(() => `${controlId.value}-label`)
const hintId = computed(() => `${controlId.value}-hint`)
const errorId = computed(() => `${controlId.value}-error`)
const isOptionalHint = computed(() => props.hint?.trim().toLowerCase() === 'optional')
const describedBy = computed(() => {
  if (parent) return claimedId ? parent.describedBy.value : undefined
  if (props.error) return errorId.value
  return props.hint && !isOptionalHint.value ? hintId.value : undefined
})
const invalid = computed(() => (parent ? !!claimedId && parent.invalid.value : !!props.error))

if (!parent) {
  let claimed = false
  provide(S_FIELD_KEY, {
    claimId: () => {
      if (claimed) return undefined
      claimed = true
      return controlId.value
    },
    labelId: computed(() => (props.label ? labelId.value : undefined)),
    describedBy,
    invalid,
  })
}
</script>

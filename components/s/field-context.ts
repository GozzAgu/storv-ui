import type { ComputedRef, InjectionKey } from 'vue'

export interface SFieldContext {
  /** Returns the field's control id to the first control that asks; later controls get none. */
  claimId: () => string | undefined
  /** Id of the visible label, for composite controls that need `aria-labelledby`. */
  labelId: ComputedRef<string | undefined>
  describedBy: ComputedRef<string | undefined>
  invalid: ComputedRef<boolean>
}

export const S_FIELD_KEY: InjectionKey<SFieldContext> = Symbol('s-field')

<template>
  <SField :id="id" :label="label" :hint="hint" :error="error" :required="required">
    <template #default="{ id: controlId, describedBy, invalid }">
      <SPopover
        ref="popoverRef"
        class="s-country-select"
        role="listbox"
        align="start"
        :label="label"
        panel-class="s-country-select__panel"
        @update:open="onOpen"
      >
        <template #trigger="{ open, toggle }">
          <button
            :id="controlId"
            type="button"
            class="s-control s-control--select s-country-select__trigger"
            :class="{ 's-control--invalid': invalid, 's-control--disabled': disabled }"
            aria-haspopup="listbox"
            :aria-expanded="open"
            :aria-invalid="invalid ? 'true' : undefined"
            :aria-describedby="describedBy"
            :disabled="disabled"
            @click="toggle"
            @keydown.down.prevent="!open && toggle()"
          >
            <SFlag v-if="selected" :code="selected.code" />
            <span
              class="s-country-select__value"
              :class="{ 's-country-select__value--empty': !selected }"
            >
              {{ selected?.name ?? placeholder }}
            </span>
            <ChevronDown
              class="s-control__chevron"
              :size="16"
              :stroke-width="1.75"
              aria-hidden="true"
            />
          </button>
        </template>

        <template #default="{ close }">
          <button
            v-for="country in countries"
            :key="country.code"
            type="button"
            role="option"
            class="s-pick__row"
            :class="{ 's-pick__row--selected': country.code === model }"
            :aria-selected="country.code === model"
            @click="choose(country.code, close)"
          >
            <SFlag :code="country.code" />
            <span class="s-pick__title">{{ country.name }}</span>
            <Check
              v-if="country.code === model"
              class="s-country-select__check"
              :size="16"
              :stroke-width="2.5"
              aria-hidden="true"
            />
          </button>
        </template>
      </SPopover>
    </template>
  </SField>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { Check, ChevronDown } from '@lucide/vue'
import SField from '~/components/s/SField.vue'
import SFlag from '~/components/s/SFlag.vue'
import SPopover from '~/components/s/SPopover.vue'

const props = defineProps<{
  countries: readonly { code: string; name: string }[]
  label?: string
  hint?: string
  error?: string
  id?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
}>()

const model = defineModel<string>()
const popoverRef = ref<{ $el: HTMLElement } | null>(null)

const selected = computed(() => props.countries.find((country) => country.code === model.value))

function choose(code: string, close: () => void) {
  model.value = code
  close()
  popoverRef.value?.$el.querySelector<HTMLElement>('[aria-haspopup]')?.focus()
}

async function onOpen(open: boolean) {
  if (!open) return
  // Two ticks: SPopover focuses the first option after one, and the selected one should win.
  await nextTick()
  await nextTick()
  const current = popoverRef.value?.$el.querySelector<HTMLElement>('[aria-selected="true"]')
  current?.focus()
  current?.scrollIntoView({ block: 'nearest' })
}
</script>

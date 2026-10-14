import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SerialUniqueRows from '~/components/inventory/SerialUniqueRows.vue'
import type { TemplateField } from '~/stores/inventory'

const SInput = {
  props: ['modelValue', 'placeholder'],
  emits: ['update:modelValue'],
  template:
    '<input :value="modelValue" :placeholder="placeholder" @input="$emit(\'update:modelValue\', $event.target.value)" />',
}

const engine: TemplateField = {
  id: 'f1',
  name: 'engine_number',
  label: 'Engine Number',
  type: 'text',
  required: true,
  unique: true,
}

function mountRows(props: {
  serials: string[]
  values: Record<string, string>[]
  uniqueFields: TemplateField[]
}) {
  return mount(SerialUniqueRows, {
    props,
    global: { stubs: { SInput, SIconButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' } } },
  })
}

describe('SerialUniqueRows', () => {
  it('shows only the serial input when there are no unique columns', () => {
    const w = mountRows({ serials: ['A1', ''], values: [{}, {}], uniqueFields: [] })
    expect(w.findAll('input').map((i) => i.attributes('placeholder'))).toEqual([
      'Serial 1',
      'Serial 2',
    ])
  })

  it('adds an input per unique column on every row', () => {
    const w = mountRows({
      serials: ['A1', 'A2'],
      values: [{ engine_number: 'E1' }, {}],
      uniqueFields: [engine],
    })
    const inputs = w.findAll('input')
    expect(inputs.map((i) => i.attributes('placeholder'))).toEqual([
      'Serial 1',
      'Engine Number',
      'Serial 2',
      'Engine Number',
    ])
    expect((inputs[1]!.element as HTMLInputElement).value).toBe('E1')
  })

  it('emits new arrays for serial and unique value edits, and the row to remove', async () => {
    const w = mountRows({ serials: ['A1', 'A2'], values: [{}, {}], uniqueFields: [engine] })
    const inputs = w.findAll('input')

    await inputs[2]!.setValue('B2')
    expect(w.emitted('update:serials')?.[0]).toEqual([['A1', 'B2']])

    await inputs[3]!.setValue('E2')
    expect(w.emitted('update:values')?.[0]).toEqual([[{}, { engine_number: 'E2' }]])

    await w.findAll('button')[0]!.trigger('click')
    expect(w.emitted('remove')?.[0]).toEqual([0])
  })
})

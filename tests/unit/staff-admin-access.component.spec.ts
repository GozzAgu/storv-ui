import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import StaffAdminAccess from '~/components/departments/StaffAdminAccess.vue'

const setStaffAdminAccess = vi.fn()
const isStoreOwner = ref(true)

vi.mock('~/stores/staff', () => ({ useStaffStore: () => ({ setStaffAdminAccess }) }))
vi.mock('~/utils/security-api-errors', () => ({
  resolveTotpForSensitiveAction: vi.fn(async () => '123456'),
}))
vi.mock('~/composables/useTotpConfirmModal', () => ({
  useTotpConfirmModal: () => ({
    open: ref(false),
    prompt: vi.fn(),
    confirm: vi.fn(),
    cancel: vi.fn(),
  }),
}))
vi.stubGlobal('usePermissions', () => ({ isStoreOwner }))
vi.stubGlobal('useAppToast', () => ({ success: vi.fn(), error: vi.fn() }))

const SCheckbox = {
  props: ['modelValue', 'label', 'disabled'],
  emits: ['update:modelValue'],
  template:
    '<label><input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />{{ label }}</label>',
}

function mountSection(staff: Record<string, unknown>) {
  return mount(StaffAdminAccess, {
    props: { staff: { id: 's1', authUid: 'u1', status: 'active', ...staff } as never },
    global: {
      stubs: {
        SCheckbox,
        SButton: {
          props: ['disabled'],
          template: '<button :disabled="disabled"><slot /></button>',
        },
        TotpConfirmModal: true,
      },
    },
  })
}

const labels = (w: ReturnType<typeof mountSection>) => w.findAll('label').map((l) => l.text())

describe('StaffAdminAccess', () => {
  beforeEach(() => {
    isStoreOwner.value = true
    setStaffAdminAccess.mockReset()
  })

  it('is hidden from admins, and for staff without a login or who were removed', () => {
    isStoreOwner.value = false
    expect(mountSection({}).find('section').exists()).toBe(false)
    isStoreOwner.value = true
    expect(mountSection({ authUid: '' }).find('section').exists()).toBe(false)
    expect(mountSection({ status: 'inactive' }).find('section').exists()).toBe(false)
  })

  it('shows the extras only once admin is on', async () => {
    const wrapper = mountSection({})
    expect(labels(wrapper)).toEqual(['Make admin of this branch'])
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()

    await wrapper.find('input').setValue(true)
    expect(labels(wrapper)).toEqual([
      'Make admin of this branch',
      'Edit this branch’s details',
      'Change store settings',
      'Let staff confirm payments',
      'Delete sales and settle commissions',
      'Export store data',
      'Transfer stock to other branches',
    ])
    expect(wrapper.find('button').attributes('disabled')).toBeUndefined()
  })

  it('saves through the store with the two-factor code and reports the result', async () => {
    const adminGrants = {
      branches: false,
      paymentsConfirm: false,
      deleteSales: true,
      storeSettings: false,
      dataExport: false,
      stockTransfers: false,
    }
    setStaffAdminAccess.mockResolvedValue({ admin: true, adminGrants })
    const wrapper = mountSection({})
    const inputs = () => wrapper.findAll('input')
    await inputs()[0]!.setValue(true)
    await inputs()[4]!.setValue(true)
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(setStaffAdminAccess).toHaveBeenCalledWith(
      's1',
      { admin: true, grants: adminGrants },
      '123456'
    )
    expect(wrapper.emitted('saved')?.[0]).toEqual([{ admin: true, adminGrants }])
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('removing admin clears the extras', async () => {
    setStaffAdminAccess.mockResolvedValue({
      admin: false,
      adminGrants: {
        branches: false,
        paymentsConfirm: false,
        deleteSales: false,
        storeSettings: false,
        dataExport: false,
        stockTransfers: false,
      },
    })
    const wrapper = mountSection({ admin: true, adminGrants: { deleteSales: true } })
    expect(labels(wrapper)).toContain('Delete sales and settle commissions')
    expect(labels(wrapper)).toContain('Transfer stock to other branches')
    await wrapper.find('input').setValue(false)
    await wrapper.find('button').trigger('click')
    await flushPromises()
    expect(setStaffAdminAccess.mock.calls[0]![1]).toEqual({
      admin: false,
      grants: {
        branches: false,
        paymentsConfirm: false,
        deleteSales: false,
        storeSettings: false,
        dataExport: false,
        stockTransfers: false,
      },
    })
  })
})

import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import SButton from '~/components/s/SButton.vue'
import SDialog from '~/components/s/SDialog.vue'
import SIconButton from '~/components/s/SIconButton.vue'
import SInput from '~/components/s/SInput.vue'
import STabs from '~/components/s/STabs.vue'

const NuxtLinkStub = defineComponent({
  name: 'NuxtLink',
  props: { to: { type: [String, Object], required: true } },
  setup(props, { slots }) {
    return () => h('a', { href: String(props.to) }, slots.default?.())
  },
})

afterEach(() => {
  document.body.innerHTML = ''
  document.documentElement.style.overflow = ''
})

describe('SButton', () => {
  it('renders a button with variant classes and emits click', async () => {
    const wrapper = mount(SButton, { props: { variant: 'primary' }, slots: { default: 'Save' } })

    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['s-btn', 's-btn--primary']))
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('blocks clicks and marks itself busy while loading', async () => {
    const wrapper = mount(SButton, { props: { loading: true }, slots: { default: 'Save' } })

    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(wrapper.attributes('disabled')).toBeDefined()
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('renders a link only when enabled', () => {
    const global = { components: { NuxtLink: NuxtLinkStub } }
    const link = mount(SButton, { props: { to: '/dashboard' }, slots: { default: 'Go' }, global })
    const disabled = mount(SButton, {
      props: { to: '/dashboard', disabled: true },
      slots: { default: 'Go' },
      global,
    })

    expect(link.element.tagName).toBe('A')
    expect(link.attributes('href')).toBe('/dashboard')
    expect(disabled.element.tagName).toBe('BUTTON')
  })
})

describe('SIconButton', () => {
  it('includes the badge count in its accessible name', () => {
    const wrapper = mount(SIconButton, { props: { label: 'Notifications', badge: 3 } })

    expect(wrapper.attributes('aria-label')).toContain('Notifications')
    expect(wrapper.attributes('aria-label')).toContain('3')
  })
})

describe('SInput', () => {
  it('links the label, hint and error to the control', async () => {
    const wrapper = mount(SInput, {
      props: { label: 'Email', hint: 'Work email', modelValue: '' },
    })
    const input = wrapper.find('input')
    const label = wrapper.find('label')

    expect(label.attributes('for')).toBe(input.attributes('id'))
    expect(input.attributes('aria-describedby')).toBe(wrapper.find('.s-field__hint').attributes('id'))

    await wrapper.setProps({ error: 'Enter a valid email' })
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toBe(wrapper.find('[role="alert"]').attributes('id'))
  })

  it('updates v-model on input', async () => {
    const wrapper = mount(SInput, { props: { label: 'Name', modelValue: '' } })

    await wrapper.find('input').setValue('Ada')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Ada'])
  })
})

describe('STabs', () => {
  const tabs = [
    { value: 'all', label: 'All' },
    { value: 'paid', label: 'Paid' },
    { value: 'void', label: 'Void', disabled: true },
    { value: 'draft', label: 'Draft' },
  ]

  it('selects on click and uses a roving tabindex', async () => {
    const wrapper = mount(STabs, { props: { tabs, label: 'Status', modelValue: 'all' } })
    const buttons = wrapper.findAll('[role="tab"]')

    expect(buttons[0]!.attributes('aria-selected')).toBe('true')
    expect(buttons[0]!.attributes('tabindex')).toBe('0')
    expect(buttons[1]!.attributes('tabindex')).toBe('-1')

    await buttons[1]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['paid'])
  })

  it('moves with arrow keys, skipping disabled tabs', async () => {
    const wrapper = mount(STabs, { props: { tabs, label: 'Status', modelValue: 'paid' } })

    await wrapper.find('[role="tablist"]').trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['draft'])

    await wrapper.find('[role="tablist"]').trigger('keydown', { key: 'Home' })
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual(['all'])
  })
})

describe('SDialog', () => {
  function mountDialog(props: Record<string, unknown> = {}) {
    const open = ref(true)
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            SDialog,
            {
              open: open.value,
              'onUpdate:open': (value: boolean) => (open.value = value),
              title: 'Sign out?',
              description: 'You will need to sign in again.',
              ...props,
            },
            { footer: () => h('button', { type: 'button', 'data-autofocus': '' }, 'Cancel') }
          )
      },
    })
    const wrapper = mount(Host, { attachTo: document.body })
    return { wrapper, open }
  }

  it('renders an accessible modal in the body and focuses the autofocus target', async () => {
    const { wrapper, open } = mountDialog({ role: 'alertdialog' })
    open.value = false
    await nextTick()
    open.value = true
    await nextTick()
    await nextTick()

    const panel = document.body.querySelector<HTMLElement>('[role="alertdialog"]')!
    expect(panel).not.toBeNull()
    expect(panel.getAttribute('aria-modal')).toBe('true')
    expect(document.getElementById(panel.getAttribute('aria-labelledby')!)?.textContent).toBe(
      'Sign out?'
    )
    expect(document.activeElement?.textContent).toBe('Cancel')
    expect(document.documentElement.style.overflow).toBe('hidden')

    wrapper.unmount()
  })

  it('closes on Escape when dismissible', async () => {
    const { wrapper, open } = mountDialog()
    await nextTick()

    document.body
      .querySelector('[role="dialog"]')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(open.value).toBe(false)

    wrapper.unmount()
  })

  it('stays open on Escape while not dismissible', async () => {
    const { wrapper, open } = mountDialog({ dismissible: false })
    await nextTick()

    document.body
      .querySelector('[role="dialog"]')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(open.value).toBe(true)
    expect(document.body.querySelector('.s-dialog__close')).toBeNull()

    wrapper.unmount()
  })
})

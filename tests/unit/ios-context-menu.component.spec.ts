import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import IosContextMenu from '~/components/ios/IosContextMenu.vue'
import IosContextMenuItem from '~/components/ios/IosContextMenuItem.vue'
import { isInsideAnchoredMenu } from '~/utils/menuAnchor'

function mountMenu(onEdit: () => void) {
  const Host = defineComponent({
    setup() {
      return () =>
        h(
          IosContextMenu,
          { open: true, style: { top: '10px', left: '10px' }, menuId: 'row' },
          { default: () => [h(IosContextMenuItem, { label: 'Edit', onClick: onEdit })] }
        )
    },
  })

  return mount(Host, { attachTo: document.body })
}

describe('IosContextMenu row actions', () => {
  it('runs the item handler when a row is tapped', async () => {
    const onEdit = vi.fn()
    const wrapper = mountMenu(onEdit)

    const item = document.body.querySelector<HTMLButtonElement>('.ios-context-menu__item')
    expect(item).not.toBeNull()

    item!.click()
    expect(onEdit).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  /**
   * Outside-click handlers close their menu from the capture phase, so a menu row
   * they mistake for "outside" clears the row state before the item handler reads
   * it and the action silently does nothing. The card has to stay recognisable.
   */
  it('is recognised as inside the menu by outside-click guards', () => {
    const wrapper = mountMenu(() => {})

    const icon = document.body.querySelector('.ios-context-menu__item span')
    expect(isInsideAnchoredMenu(icon)).toBe(true)
    expect(isInsideAnchoredMenu(document.body)).toBe(false)

    wrapper.unmount()
  })
})

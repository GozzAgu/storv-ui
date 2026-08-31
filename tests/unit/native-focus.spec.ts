import { describe, expect, it, vi } from 'vitest'
import { dismissKeyboardFromBackgroundTap } from '~/utils/native-focus'

describe('native focus', () => {
  it('blurs focused inputs when tapping outside interactive controls', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    const blurSpy = vi.spyOn(input, 'blur')

    const background = document.createElement('div')
    document.body.appendChild(background)

    dismissKeyboardFromBackgroundTap({ target: background } as unknown as Event)

    expect(blurSpy).toHaveBeenCalled()

    blurSpy.mockRestore()
    input.remove()
    background.remove()
  })

  it('does not blur when tapping buttons or links', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    const blurSpy = vi.spyOn(input, 'blur')

    const button = document.createElement('button')
    button.type = 'button'
    document.body.appendChild(button)

    dismissKeyboardFromBackgroundTap({ target: button } as unknown as Event)

    expect(blurSpy).not.toHaveBeenCalled()

    blurSpy.mockRestore()
    input.remove()
    button.remove()
  })
})

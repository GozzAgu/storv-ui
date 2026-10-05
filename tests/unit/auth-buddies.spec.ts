import { describe, expect, it } from 'vitest'
import { getBuddyReaction, type BuddyState } from '~/utils/auth-buddies'

const signin = (patch: Partial<BuddyState> = {}): BuddyState => ({
  mode: 'signin',
  focused: '',
  email: '',
  password: '',
  ...patch,
})

const signup = (patch: Partial<BuddyState> = {}): BuddyState => ({
  mode: 'signup',
  focused: '',
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  ...patch,
})

const say = (state: BuddyState) => {
  const r = getBuddyReaction(state)
  return [r.left.text, r.right.text]
}

describe('getBuddyReaction', () => {
  it('greets differently on sign in and sign up, looking ahead', () => {
    expect(say(signin())).toEqual(["Oh hey, it's you!", 'Good to see you again'])
    expect(say(signup())).toEqual(['Welcome to Storvv!', "Let's set up your shop"])
    expect(getBuddyReaction(signin()).look).toBe('ahead')
  })

  it('coaches the email as it is typed and looks down at the field', () => {
    expect(say(signin({ focused: 'email' }))[0]).toBe("Type away, we're watching")
    expect(say(signin({ focused: 'email', email: 'ada' }))[0]).toBe("Hmm, where's the @?")
    expect(say(signin({ focused: 'email', email: 'ada@shop' }))[1]).toBe('Finish it off, like .com')
    expect(say(signin({ focused: 'email', email: 'ada@shop.com' }))).toEqual([
      "That's a real email!",
      'Password next',
    ])
    expect(getBuddyReaction(signin({ focused: 'email' })).look).toBe('down')
  })

  it('closes their eyes for the password', () => {
    const r = getBuddyReaction(signin({ focused: 'password' }))
    expect(r.left.mood).toBe('shy')
    expect(r.right.mood).toBe('shy')
  })

  it('walks through each sign-up password rule in order', () => {
    const at = (password: string) => say(signup({ focused: 'password', password }))
    expect(at('abc')[0]).toBe('9 more to go')
    expect(at('abcdefghijkl')[0]).toBe('Not a single number?')
    expect(at('abcdefghijk1')[0]).toBe('One capital letter, please')
    expect(at('Abcdefghijk1')[0]).toBe("That's a strong one")
  })

  it('checks the confirmation and cheers once everything is ready', () => {
    const base = { name: 'Ada Wears', email: 'ada@shop.com', password: 'Abcdefghijk1' }
    expect(say(signup({ ...base, focused: 'confirmPassword', confirmPassword: 'Abc' }))[0]).toBe(
      "Those don't match yet"
    )
    expect(
      say(signup({ ...base, focused: 'confirmPassword', confirmPassword: base.password }))[0]
    ).toBe('Perfect match!')
    expect(say(signup({ ...base, confirmPassword: base.password }))).toEqual([
      'All set!',
      'Hit that button',
    ])
  })

  it('reacts to errors only when the user is not typing, and to loading and success', () => {
    expect(say(signin({ error: 'Incorrect password' }))[0]).toBe("Hmm, that didn't work")
    expect(say(signin({ error: 'Incorrect password', focused: 'password' }))[0]).toBe(
      "We won't peek"
    )
    expect(say(signin({ loading: true }))[0]).toBe('Checking…')
    expect(say(signup({ done: true }))[0]).toBe('Check your inbox')
  })

  it('compliments the business name, shortening long ones', () => {
    expect(say(signup({ focused: 'business-name', name: 'Ada Wears' }))[0]).toBe(
      'Ada Wears, love it!'
    )
    expect(
      say(signup({ focused: 'business-name', name: 'A very long boutique name indeed' }))[0]
    ).toBe('A very long bouti…, love it!')
  })
})

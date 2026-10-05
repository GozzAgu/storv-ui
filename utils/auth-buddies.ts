import { PASSWORD_MIN_LENGTH, isPasswordPolicyValid } from '~/utils/passwordPolicy'

export type BuddyMood = 'happy' | 'curious' | 'shy' | 'surprised' | 'cheer'
export type BuddyLook = 'ahead' | 'down'

export type BuddyLine = { text: string; mood: BuddyMood }

export type BuddyState = {
  mode: 'signin' | 'signup'
  /** `id` of the focused input, or '' when nothing in the form has focus. */
  focused: string
  name?: string
  email: string
  password: string
  confirmPassword?: string
  error?: string
  loading?: boolean
  done?: boolean
  twoFactor?: boolean
}

export type BuddyReaction = { left: BuddyLine; right: BuddyLine; look: BuddyLook }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const line = (text: string, mood: BuddyMood = 'happy'): BuddyLine => ({ text, mood })

function emailReaction(email: string): [BuddyLine, BuddyLine] | null {
  const value = email.trim()
  if (!value) return null
  if (!value.includes('@'))
    return [line("Hmm, where's the @?", 'curious'), line('Emails need one, like name@shop.com')]
  if (!EMAIL_PATTERN.test(value))
    return [line('Almost there…', 'curious'), line('Finish it off, like .com')]
  return null
}

function passwordReaction(state: BuddyState): [BuddyLine, BuddyLine] {
  const { password, mode } = state
  if (!password) return [line("We won't peek", 'shy'), line('Promise.', 'shy')]
  if (mode === 'signin') return [line('Looking good', 'shy'), line('Hit that button when ready')]

  if (password.length < PASSWORD_MIN_LENGTH) {
    const left = PASSWORD_MIN_LENGTH - password.length
    return [
      line(`${left} more to go`, 'shy'),
      line(`${PASSWORD_MIN_LENGTH} characters minimum, keep going!`),
    ]
  }
  if (!/[0-9]/.test(password))
    return [line('Not a single number?', 'curious'), line('Add a 0 to 9 somewhere in it')]
  if (!/[A-Z]/.test(password))
    return [line('One capital letter, please', 'curious'), line('Like A, B or C')]
  return [line("That's a strong one", 'cheer'), line('Now type it once more')]
}

/** What each buddy says and how they look, given the current state of the auth form. */
export function getBuddyReaction(state: BuddyState): BuddyReaction {
  const { mode, focused } = state
  const look: BuddyLook = focused ? 'down' : 'ahead'
  const pick = (pair: [BuddyLine, BuddyLine], gaze: BuddyLook = look): BuddyReaction => ({
    left: pair[0],
    right: pair[1],
    look: gaze,
  })

  if (state.done)
    return pick([line('Check your inbox', 'cheer'), line('See you in a minute!', 'cheer')], 'ahead')
  if (state.loading) return pick([line('Checking…', 'curious'), line('One sec')], 'ahead')
  if (state.error && !focused)
    return pick([
      line("Hmm, that didn't work", 'surprised'),
      line('Check the message below', 'surprised'),
    ])
  if (state.twoFactor) return pick([line('Almost in!'), line('Enter the 6-digit code')])

  if (focused === 'business-name') {
    const name = state.name?.trim() ?? ''
    if (!name)
      return pick([line("What's your shop called?", 'curious'), line("It'll go on your receipts")])
    const short = name.length > 18 ? `${name.slice(0, 17)}…` : name
    return pick([line(`${short}, love it!`, 'cheer'), line('Email next')])
  }

  if (focused === 'email') {
    const problem = emailReaction(state.email)
    if (problem) return pick(problem)
    if (!state.email.trim())
      return pick([
        line("Type away, we're watching", 'curious'),
        line('Your work email works best'),
      ])
    return pick([line("That's a real email!", 'cheer'), line('Password next')])
  }

  if (focused === 'password') return pick(passwordReaction(state))

  if (focused === 'confirmPassword') {
    const confirm = state.confirmPassword ?? ''
    if (!confirm) return pick([line('One more time', 'shy'), line('Same as above, please', 'shy')])
    if (confirm !== state.password)
      return pick([line("Those don't match yet", 'curious'), line('Same as above, please')])
    return pick([line('Perfect match!', 'cheer'), line("Accept the terms and you're in")])
  }

  const ready =
    EMAIL_PATTERN.test(state.email.trim()) &&
    (mode === 'signin'
      ? state.password.length > 0
      : isPasswordPolicyValid(state.password) &&
        state.password === state.confirmPassword &&
        Boolean(state.name?.trim()))
  if (ready) return pick([line('All set!', 'cheer'), line('Hit that button', 'cheer')])

  return mode === 'signin'
    ? pick([line("Oh hey, it's you!"), line('Good to see you again')])
    : pick([line('Welcome to Storvv!'), line("Let's set up your shop")])
}

import { describe, expect, it } from 'vitest'
import {
  friendlyDisplayMessage,
  friendlyErrorMessage,
  GENERIC_ERROR_MESSAGE,
} from '~/utils/friendly-error'

describe('friendlyErrorMessage', () => {
  it('hides raw Firestore validation errors', () => {
    const raw = new Error(
      'Function setDoc() called with invalid data. Unsupported field value: undefined (found in field description in document users/7HJi5wPEHWVglRlVAlrzNvwug6E2/stores/abc/departments/xyz)'
    )
    expect(friendlyErrorMessage(raw, 'Could not create the department.')).toBe(
      'Could not create the department.'
    )
  })

  it('maps SDK error codes to plain copy', () => {
    const err = Object.assign(new Error('Missing or insufficient permissions.'), {
      name: 'FirebaseError',
      code: 'permission-denied',
    })
    expect(friendlyErrorMessage(err)).toMatch(/permission/i)
    expect(friendlyDisplayMessage('Firebase: Error (auth/network-request-failed).')).toMatch(
      /connection/i
    )
    expect(friendlyDisplayMessage('Failed to get document because the client is offline.')).toMatch(
      /offline/i
    )
  })

  it('keeps messages the app wrote itself', () => {
    expect(friendlyErrorMessage(new Error('Only the store owner can add departments'))).toBe(
      'Only the store owner can add departments'
    )
    expect(friendlyDisplayMessage('Department created')).toBe('Department created')
  })

  it('falls back when there is nothing to show', () => {
    expect(friendlyErrorMessage(undefined)).toBe(GENERIC_ERROR_MESSAGE)
    expect(friendlyErrorMessage({})).toBe(GENERIC_ERROR_MESSAGE)
  })
})

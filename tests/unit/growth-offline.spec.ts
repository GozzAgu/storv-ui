import { describe, expect, it } from 'vitest'
import {
  documentRefFromPath,
  serializeFirestorePayload,
} from '~/utils/offline-firestore'
import { resolveUserCreatedAtIso } from '~/utils/growth-dates'

describe('offline-firestore', () => {
  it('serializes Date fields for queued writes', () => {
    const payload = serializeFirestorePayload({
      name: 'Sale',
      createdAt: new Date('2026-01-15T10:00:00.000Z'),
      skipped: undefined,
    })
    expect(payload.createdAt).toBe('2026-01-15T10:00:00.000Z')
    expect(payload).not.toHaveProperty('skipped')
  })

  it('rejects invalid document paths', () => {
    const db = {} as Parameters<typeof documentRefFromPath>[0]
    expect(() => documentRefFromPath(db, 'users')).toThrow(/Invalid Firestore document path/)
  })
})

describe('growth-dates', () => {
  it('prefers activation funnel signup timestamp', () => {
    expect(
      resolveUserCreatedAtIso(new Date('2020-01-01'), '2026-02-01T00:00:00.000Z')
    ).toBe('2026-02-01T00:00:00.000Z')
  })

  it('normalizes Firestore-like timestamps', () => {
    const createdAt = {
      toDate: () => new Date('2026-03-01T12:00:00.000Z'),
    }
    expect(resolveUserCreatedAtIso(createdAt)).toBe('2026-03-01T12:00:00.000Z')
  })
})

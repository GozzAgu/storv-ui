import { createError } from 'h3'
import { FieldValue, type Firestore } from 'firebase-admin/firestore'
import { normalizeEntityName } from '~/utils/capitalize-text'
import { normalizePaymentTenderList } from '~/utils/payment-tenders'
import { storeRef } from '~/server/utils/staff-admin'
import type { SharedSettingsSection } from '~/types/staff-permissions'

/*
 * Settings a branch admin may change when the owner grants the extra. Each section is written
 * by field path so the rest of the owner's account (plan, features, other sections) is untouched.
 */

const INVENTORY_CATEGORIES = ['general', 'electronics', 'clothing', 'food', 'office'] as const

function bad(message: string): never {
  throw createError({ statusCode: 400, message })
}

function text(value: unknown, field: string, max: number, { required = false } = {}): string {
  if (value === undefined || value === null) {
    if (required) bad(`${field} is required`)
    return ''
  }
  if (typeof value !== 'string') bad(`${field} must be text`)
  const trimmed = value.trim()
  if (required && !trimmed) bad(`${field} is required`)
  if (trimmed.length > max) bad(`${field} is too long`)
  return trimmed
}

function wholeNumber(value: unknown, field: string, min: number, max: number): number {
  const n = typeof value === 'string' && value.trim() ? Number(value) : value
  if (typeof n !== 'number' || !Number.isInteger(n) || n < min || n > max) {
    bad(`${field} must be a whole number from ${min} to ${max}`)
  }
  return n
}

function flag(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') bad(`${field} must be true or false`)
  return value
}

function object(values: unknown): Record<string, unknown> {
  if (!values || typeof values !== 'object' || Array.isArray(values)) bad('values are required')
  return values as Record<string, unknown>
}

/** Validated Firestore field paths on `users/{owner}` for one settings section. */
export function sharedSettingsUpdate(
  section: unknown,
  rawValues: unknown
): Record<string, unknown> {
  const values = object(rawValues)
  switch (section as SharedSettingsSection) {
    case 'business':
      return {
        'storeDetails.storeName': normalizeEntityName(
          text(values.storeName, 'storeName', 120, { required: true })
        ),
        'storeDetails.storeEmail': text(values.storeEmail, 'storeEmail', 120),
        'storeDetails.storePhone': text(values.storePhone, 'storePhone', 40),
        'storeDetails.storeAddress': text(values.storeAddress, 'storeAddress', 300),
        'storeDetails.storeDescription': text(values.storeDescription, 'storeDescription', 120),
      }
    case 'inventory': {
      const category = values.defaultCategory
      if (!INVENTORY_CATEGORIES.includes(category as (typeof INVENTORY_CATEGORIES)[number])) {
        bad('defaultCategory is not a known category')
      }
      return {
        'storeDetails.settings.inventory': {
          lowStockThreshold: wholeNumber(values.lowStockThreshold, 'lowStockThreshold', 1, 1_000_000),
          autoReorder: flag(values.autoReorder, 'autoReorder'),
          defaultCategory: category,
        },
      }
    }
    case 'receipt':
      return {
        'storeDetails.settings.receipt': {
          prefix: text(values.prefix, 'prefix', 12),
          nextNumber: wholeNumber(values.nextNumber, 'nextNumber', 1, 999_999_999),
          autoPrint: flag(values.autoPrint, 'autoPrint'),
        },
      }
    case 'payment': {
      const list = values.paymentMethods
      if (!Array.isArray(list) || list.length > 30) bad('paymentMethods must be a list of up to 30')
      const methods = list.map((m, i) => text(m, `paymentMethods[${i}]`, 40))
      return {
        'storeDetails.settings.payment': { paymentMethods: normalizePaymentTenderList(methods) },
      }
    }
    default:
      bad('section must be business, inventory, receipt or payment')
  }
}

export async function applySharedSettings(
  db: Firestore,
  ownerUserId: string,
  update: Record<string, unknown>
): Promise<void> {
  await db
    .collection('users')
    .doc(ownerUserId)
    .update({ ...update, updatedAt: FieldValue.serverTimestamp() })
}

/**
 * A branch's own details from the Branches edit form. Whether the branch is active, and creating
 * or deleting branches, stay with the owner.
 */
export function branchDetailsUpdate(rawValues: unknown): {
  name: string
  description: string
  sellScreenNote: string
  address: string
  phone: string
  email: string
} {
  const values = object(rawValues)
  return {
    name: normalizeEntityName(text(values.name, 'name', 120, { required: true })),
    description: text(values.description, 'description', 300),
    sellScreenNote: text(values.sellScreenNote, 'sellScreenNote', 500),
    address: text(values.address, 'address', 300),
    phone: text(values.phone, 'phone', 40),
    email: text(values.email, 'email', 120),
  }
}

export async function applyBranchDetails(
  db: Firestore,
  ownerUserId: string,
  storeId: string,
  details: ReturnType<typeof branchDetailsUpdate>
): Promise<void> {
  const ref = storeRef(db, ownerUserId, storeId)
  const snap = await ref.get()
  if (!snap.exists || snap.data()?.ownerId !== ownerUserId) {
    throw createError({ statusCode: 404, message: 'Branch not found' })
  }
  await ref.update({ ...details, updatedAt: FieldValue.serverTimestamp() })
}

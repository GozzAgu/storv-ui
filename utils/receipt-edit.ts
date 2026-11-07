/**
 * Shared by the sale editor, the edit route (server/utils/sales/edit.ts) and the history view.
 * Only details that don't move money or stock are editable.
 */
export const RECEIPT_EDITABLE_FIELDS = [
  'customerName',
  'customerPhone',
  'customerEmail',
  'customerAddress',
  'notes',
] as const

export type ReceiptEditableField = (typeof RECEIPT_EDITABLE_FIELDS)[number]

export const RECEIPT_EDIT_LIMITS: Record<ReceiptEditableField | 'reason', number> = {
  customerName: 120,
  customerPhone: 40,
  customerEmail: 200,
  customerAddress: 300,
  notes: 1000,
  reason: 300,
}

export const RECEIPT_EDIT_FIELD_LABELS: Record<ReceiptEditableField, string> = {
  customerName: 'Customer name',
  customerPhone: 'Phone',
  customerEmail: 'Email',
  customerAddress: 'Address',
  notes: 'Notes',
}

export interface ReceiptEditChange {
  field: ReceiptEditableField
  from: string
  to: string
}

/** One entry in `receipts/{id}/edits`, as the app reads it. */
export interface ReceiptEditEntry {
  id: string
  changes: ReceiptEditChange[]
  reason: string
  editedBy: string
  editedByName: string
  editNumber: number
  editedAt: Date | null
}

/** Audit fields the server keeps on an edited receipt. The app can never write these. */
export const RECEIPT_EDIT_AUDIT_FIELDS = [
  'edited',
  'editCount',
  'lastEditedAt',
  'lastEditedBy',
  'lastEditedByName',
  'lastEditReason',
] as const

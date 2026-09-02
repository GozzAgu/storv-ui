/** Product funnel milestones persisted on the user document. */
export type ActivationFunnel = {
  signedUpAt?: string
  firstLoginAt?: string
  onboardingCompletedAt?: string
  firstCategoryAt?: string
  firstInventoryItemAt?: string
  firstSaleAt?: string
  firstUpgradeStartedAt?: string
  firstUpgradeSuccessAt?: string
  subscriptionCanceledAt?: string
}

export type BackupPreferences = {
  enabled: boolean
  /** weekly | monthly */
  frequency: 'weekly' | 'monthly'
  lastExportAt?: string
  lastReminderAt?: string
}

export type GrowthFeedback = {
  nps?: {
    score: number
    comment?: string
    submittedAt: string
  }
  churn?: {
    reason: string
    comment?: string
    submittedAt: string
    plan: string
  }
}

export type InventoryAuditField = 'price' | 'name' | 'cost' | 'quantity'

export type InventoryAuditLog = {
  id: string
  userId: string
  userDisplayName: string
  itemId: string
  itemName: string
  field: InventoryAuditField
  previousValue?: string | number | null
  newValue?: string | number | null
  storeId: string
  createdAt: Date
}

export const CHURN_SURVEY_REASONS = [
  { id: 'too_expensive', label: 'Too expensive for my shop size' },
  { id: 'missing_features', label: 'Missing a feature I need' },
  { id: 'hard_to_use', label: 'Hard to get started / use' },
  { id: 'switching_tool', label: 'Switching to another tool' },
  { id: 'closing_business', label: 'Closing or pausing the business' },
  { id: 'other', label: 'Other' },
] as const

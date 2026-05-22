/** Green tabular styling for currency / credit amounts in dashboard tables. */
export const TABLE_MONEY_CLASS =
  'dashboard-table__money tabular-nums font-medium text-emerald-700 dark:text-emerald-400'

/** Amounts still owed (balance due, charges) — not credits. */
export const TABLE_MONEY_OWED_CLASS =
  'dashboard-table__money-owed tabular-nums font-medium text-amber-800 dark:text-amber-300'

export function tableMoneyClass(): string {
  return TABLE_MONEY_CLASS
}

export function tableMoneyOwedClass(): string {
  return TABLE_MONEY_OWED_CLASS
}

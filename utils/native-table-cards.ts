export type NativeTableLayoutMode = 'table' | 'cards'

const STORAGE_PREFIX = 'storvv-ios-table-layout:'

export function isCapacitorIosDocument(): boolean {
  if (import.meta.server || typeof document === 'undefined') return false
  return document.documentElement.classList.contains('capacitor-ios')
}

export function getNativeTableLayoutMode(key: string): NativeTableLayoutMode {
  if (import.meta.server) return 'cards'
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + key)
    if (stored === 'table' || stored === 'cards') return stored
  } catch {
    /* ignore */
  }
  return 'cards'
}

export function setNativeTableLayoutMode(key: string, mode: NativeTableLayoutMode): void {
  if (import.meta.server) return
  try {
    localStorage.setItem(STORAGE_PREFIX + key, mode)
  } catch {
    /* ignore */
  }
}

function headerLabel(th: HTMLTableCellElement, index: number): string {
  const fromActions = th.classList.contains('dashboard-table__col-actions')
  if (fromActions) return 'Actions'
  const text = th.textContent?.replace(/\s+/g, ' ').trim() || ''
  if (text) return text
  if (index === 0 && th.querySelector('input[type="checkbox"]')) return ''
  return ''
}

export function annotateDashboardTableForCards(table: HTMLTableElement): void {
  const headers = Array.from(table.querySelectorAll('thead th'))
  const labels = headers.map((th, index) => headerLabel(th, index))

  table.querySelectorAll('tbody tr').forEach((tr) => {
    tr.classList.remove('dash-native-table__detail-row', 'dash-native-table__card-row')

    const cells = Array.from(tr.children).filter(
      (el): el is HTMLTableCellElement => el.tagName === 'TD'
    )
    const isDetailRow = cells.some((td) => td.colSpan > 1) || cells.length === 1

    if (isDetailRow) {
      tr.classList.add('dash-native-table__detail-row')
      cells.forEach((td) => {
        td.dataset.nativeLabel = ''
        td.classList.add('dash-native-table__cell--full')
      })
      return
    }

    tr.classList.add('dash-native-table__card-row')
    cells.forEach((td, index) => {
      td.classList.remove(
        'dash-native-table__cell--full',
        'dash-native-table__cell--checkbox',
        'dash-native-table__cell--actions',
        'dash-native-table__cell--primary',
        'dash-native-table__cell--secondary',
        'dash-native-table__cell--meta',
        'dash-native-table__cell--status',
        'dash-native-table__cell--when'
      )

      if (td.colSpan > 1) {
        td.dataset.nativeLabel = ''
        td.classList.add('dash-native-table__cell--full')
        return
      }

      const label = labels[index] ?? ''
      const labelLower = label.toLowerCase()
      td.dataset.nativeLabel = label

      if (index === 0) {
        td.dataset.nativeLabel = ''
        td.classList.add('dash-native-table__cell--primary')
      } else if (labelLower === 'when' || labelLower === 'date') {
        td.dataset.nativeLabel = ''
        td.classList.add('dash-native-table__cell--when')
      } else if (labelLower === 'item' || labelLower === 'details') {
        td.dataset.nativeLabel = ''
        td.classList.add('dash-native-table__cell--secondary')
      } else if (td.classList.contains('dashboard-table__col-status')) {
        td.dataset.nativeLabel = ''
        td.classList.add('dash-native-table__cell--status')
      } else if (!label && td.querySelector('input[type="checkbox"]')) {
        td.classList.add('dash-native-table__cell--checkbox')
      } else if (td.classList.contains('dashboard-table__col-actions')) {
        td.classList.add('dash-native-table__cell--actions')
        td.dataset.nativeLabel = 'Actions'
      } else {
        td.classList.add('dash-native-table__cell--meta')
      }
    })
  })
}

export function findNativeTableShell(table: HTMLTableElement): HTMLElement | null {
  return table.closest('.data-table-shell, .dash-table-shell, .activity-log-shell')
}

export function applyNativeTableLayout(
  shell: HTMLElement,
  mode: NativeTableLayoutMode
): void {
  shell.classList.toggle('dash-native-table--cards', mode === 'cards')
  shell.dataset.nativeTableLayout = mode

  const table = shell.querySelector('table.dashboard-table')
  if (table instanceof HTMLTableElement && mode === 'cards') {
    annotateDashboardTableForCards(table)
  }
}

export function findDashboardTableShells(root: ParentNode = document): HTMLElement[] {
  if (import.meta.server || typeof document === 'undefined') return []
  return Array.from(
    root.querySelectorAll(
      '.data-table-shell:has(table.dashboard-table), .dash-table-shell:has(table.dashboard-table), .activity-log-shell:has(table.dashboard-table)'
    )
  ) as HTMLElement[]
}

export function ensureNativeTableShellKey(
  shell: HTMLElement,
  routePath: string,
  index: number
): string {
  const existing = shell.getAttribute('data-native-table-key')
  if (existing) return existing
  const key = `${routePath}::${index}`
  shell.setAttribute('data-native-table-key', key)
  return key
}

export function syncNativeTableShellLayout(shell: HTMLElement, key: string): NativeTableLayoutMode {
  shell.setAttribute('data-native-table-key', key)
  const mode = getNativeTableLayoutMode(key)
  applyNativeTableLayout(shell, mode)
  return mode
}

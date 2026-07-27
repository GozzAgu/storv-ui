export type NativeTableLayoutMode = 'table' | 'cards'

const STORAGE_PREFIX = 'storvv-ios-table-layout:'

export function isCapacitorIosDocument(): boolean {
  if (import.meta.server || typeof document === 'undefined') return false
  return document.documentElement.classList.contains('capacitor-ios')
}

export function shouldUseMobileTableCards(): boolean {
  if (import.meta.server || typeof window === 'undefined') return false
  if (isCapacitorIosDocument()) return true
  return window.matchMedia('(max-width: 639px)').matches
}

const MOBILE_TABLE_CHEVRON =
  '<svg class="dash-mobile-table__chevron" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clip-rule="evenodd"/></svg>'

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
    const hasLeadingCheckbox =
      cells.length > 1 &&
      Boolean(cells[0]?.querySelector('input[type="checkbox"]')) &&
      !cells[0]?.classList.contains('dashboard-table__col-actions')
    const primaryIndex = hasLeadingCheckbox ? 1 : 0

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

      if (index === primaryIndex) {
        td.dataset.nativeLabel = ''
        td.dataset.nativeSummaryLabel = label
        td.classList.add('dash-native-table__cell--primary')
      } else if (labelLower === 'when' || labelLower === 'date' || labelLower === 'updated') {
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

export function setupMobileTableAccordion(table: HTMLTableElement): void {
  if (!shouldUseMobileTableCards()) return

  table.querySelectorAll('tbody tr.dash-native-table__card-row').forEach((row) => {
    const tr = row as HTMLTableRowElement
    if (tr.classList.contains('dash-mobile-table__accordion-row')) return

    tr.classList.add('dash-mobile-table__accordion-row')

    const primaryCell = tr.querySelector(
      'td.dash-native-table__cell--primary'
    ) as HTMLTableCellElement | null
    if (!primaryCell) return

    let toggle = primaryCell.querySelector(
      '.dash-mobile-table__toggle'
    ) as HTMLButtonElement | null
    if (!toggle) {
      toggle = document.createElement('button')
      toggle.type = 'button'
      toggle.className = 'dash-mobile-table__toggle'
      toggle.setAttribute('aria-expanded', 'false')
      toggle.setAttribute('aria-label', 'Expand row details')
      toggle.innerHTML = MOBILE_TABLE_CHEVRON
      primaryCell.insertBefore(toggle, primaryCell.firstChild)
    }

    const setExpanded = (expanded: boolean) => {
      tr.classList.toggle('dash-mobile-table--expanded', expanded)
      toggle!.setAttribute('aria-expanded', String(expanded))
      toggle!.setAttribute(
        'aria-label',
        expanded ? 'Collapse row details' : 'Expand row details'
      )
    }

    toggle.addEventListener('click', (event) => {
      event.stopPropagation()
      setExpanded(!tr.classList.contains('dash-mobile-table--expanded'))
    })

    tr.addEventListener('click', (event) => {
      const target = event.target as Element
      if (target.closest('button, a, input, label, [data-no-accordion-toggle]')) return
      if (tr.classList.contains('dash-mobile-table--expanded')) return
      setExpanded(true)
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
    setupMobileTableAccordion(table)
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
  const mode = shouldUseMobileTableCards()
    ? isCapacitorIosDocument()
      ? getNativeTableLayoutMode(key)
      : 'cards'
    : 'table'
  applyNativeTableLayout(shell, mode)
  return mode
}

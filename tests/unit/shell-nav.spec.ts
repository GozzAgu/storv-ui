import { describe, expect, it } from 'vitest'
import {
  SHELL_BRANCHES_NAV_NAME,
  buildShellNavSections,
  shellRouteTitle,
  type ShellNavSourceItem,
} from '~/utils/shell-nav'

const item = (name: string, href: string): ShellNavSourceItem => ({ name, href, iconKey: 'folder' })

describe('shell-nav', () => {
  it('places Branches between Team and Activity under Organization', () => {
    const sections = buildShellNavSections([
      item('Activity Logs', '/dashboard/activity'),
      item(SHELL_BRANCHES_NAV_NAME, '/dashboard/branches'),
      item('Departments', '/dashboard/departments'),
    ])
    const organization = sections.find((section) => section.id === 'organization')
    expect(organization?.items.map((entry) => entry.label)).toEqual(['Team', 'Branches', 'Activity'])
  })

  it('drops Organization when none of its pages are available', () => {
    const sections = buildShellNavSections([item('Inventory', '/dashboard/inventory')])
    expect(sections.map((section) => section.id)).toEqual(['primary'])
  })

  it('titles the branches route', () => {
    expect(shellRouteTitle('/branches')).toBe('Branches')
    expect(shellRouteTitle('/experience-unavailable')).toBe('Unavailable')
  })
})

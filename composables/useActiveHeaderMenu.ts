/**
 * Coordinates the topnav's mutually-exclusive popovers (store switcher, notifications,
 * profile menu, assistant, ...) so opening one closes whichever other one was open.
 * Each popover keeps its own local open-state/outside-click logic - this just tracks which
 * id is "active" and lets each one watch for someone else taking over.
 */
export function useActiveHeaderMenu() {
  const activeMenu = useState<string | null>('dashboard-active-header-menu', () => null)

  function openHeaderMenu(id: string) {
    activeMenu.value = id
  }

  function closeHeaderMenu(id: string) {
    if (activeMenu.value === id) {
      activeMenu.value = null
    }
  }

  return { activeMenu, openHeaderMenu, closeHeaderMenu }
}

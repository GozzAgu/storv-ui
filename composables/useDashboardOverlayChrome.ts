/**
 * Shared shell tokens for Modal, SidePanel, and overlay surfaces.
 */
export function useDashboardOverlayChrome() {
  const backdropClass = 'dash-overlay-backdrop'

  const shellClass = 'dash-overlay-shell'
  const modalShellClass = 'dash-overlay-shell dash-overlay-modal'
  const drawerShellClass = 'dash-overlay-shell dash-overlay-drawer'

  const headerClass = 'dash-overlay-header'
  const headerDenseClass = 'dash-overlay-header dash-overlay-header--dense'

  const bodyClass = 'dash-overlay-body'

  const footerClass = 'dash-overlay-footer'
  const footerDenseClass = 'dash-overlay-footer dash-overlay-footer--dense'

  const closeButtonClass = 'dash-overlay-close'

  const titleClass = 'dash-overlay-title'
  const titleDenseClass = 'dash-overlay-title dash-overlay-title--dense'

  const subtitleClass = 'dash-overlay-subtitle'
  const subtitleDenseClass = 'dash-overlay-subtitle dash-overlay-subtitle--dense'

  const eyebrowClass = 'dash-overlay-eyebrow'

  const footerBtnOutlineClass =
    '!inline-flex !h-9 !min-h-9 !items-center !justify-center !rounded-full !px-4 !py-0 !text-xs !font-semibold'

  const footerBtnPrimaryClass = footerBtnOutlineClass

  return {
    backdropClass,
    shellClass,
    modalShellClass,
    drawerShellClass,
    headerClass,
    headerDenseClass,
    bodyClass,
    footerClass,
    footerDenseClass,
    closeButtonClass,
    titleClass,
    titleDenseClass,
    subtitleClass,
    subtitleDenseClass,
    eyebrowClass,
    footerBtnOutlineClass,
    footerBtnPrimaryClass,
  }
}

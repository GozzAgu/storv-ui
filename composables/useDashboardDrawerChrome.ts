/**
 * Shared DS class names for sheet flows (receipts, inventory, pick lists).
 */
export function useDashboardDrawerChrome() {
  const drawerFillClass = 's-form'
  const drawerFillFixedClass = 's-form'
  const drawerFillScrollClass = 's-form'
  const drawerFillStepClass = 's-form'

  const pickListClass = 's-pick'
  const pickListScrollClass = 's-pick__scroll'
  const pickRowClass = 's-pick__row'
  const pickRowSelectedClass = 's-pick__row s-pick__row--selected'

  const pickRowTitleClass = 's-pick__title'
  const pickRowMetaClass = 's-pick__meta'

  const emptyStateClass = 's-pick__empty'

  const sectionLabelClass = 's-field__label'
  const drawerHintClass = 's-field__hint'
  const drawerCalloutClass = 's-callout'

  return {
    drawerFillClass,
    drawerFillFixedClass,
    drawerFillScrollClass,
    drawerFillStepClass,
    pickListClass,
    pickListScrollClass,
    pickRowClass,
    pickRowSelectedClass,
    pickRowTitleClass,
    pickRowMetaClass,
    emptyStateClass,
    sectionLabelClass,
    drawerHintClass,
    drawerCalloutClass,
  }
}

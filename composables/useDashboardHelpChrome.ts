/**
 * Shared layout tokens for the dashboard help center page.
 */
import { useDashboardPageChrome } from '~/composables/useDashboardPageChrome'

export function useDashboardHelpChrome() {
  const pageClass = 'dash-page dash-page--unified'
  const layoutClass = 'dash-help-layout'
  const tocClass = 'dash-help-toc'
  const tocLabelClass = 'dash-help-toc__label'
  const tocLinkClass = 'dash-help-toc__link'
  const contentClass = 'dash-help-content'
  const sectionClass = 'dash-help-section'
  const sectionHeadClass = 'dash-help-section__head'
  const sectionIconClass = 'dash-help-section__icon'
  const sectionTitleClass = 'dash-help-section__title'
  const sectionBlurbClass = 'dash-help-section__blurb'
  const articleClass = 'dash-help-article'
  const articleTitleClass = 'dash-help-article__title'
  const articleBodyClass = 'dash-help-article__body'
  const chipClass = 'dash-help-chip'
  const chipLinkClass = 'dash-help-chip dash-help-chip--link'
  const toolbarLabelClass = 'dash-help-toolbar-label'
  const backTopClass = 'dash-help-back-top'

  return {
    ...useDashboardPageChrome(),
    pageClass,
    layoutClass,
    tocClass,
    tocLabelClass,
    tocLinkClass,
    contentClass,
    sectionClass,
    sectionHeadClass,
    sectionIconClass,
    sectionTitleClass,
    sectionBlurbClass,
    articleClass,
    articleTitleClass,
    articleBodyClass,
    chipClass,
    chipLinkClass,
    toolbarLabelClass,
    backTopClass,
  }
}

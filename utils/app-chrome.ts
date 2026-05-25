/**
 * App-wide surface tokens (cards, inputs, panels).
 * Field borders use CSS vars in `assets/css/main.css` (`--app-field-*`).
 */

/** Tailwind helpers aligned with `--app-field-border-color` (prefer `.app-field` or native inputs). */
export const APP_FIELD_BORDER_CLASS =
  'border border-solid border-primary-500/10 transition-[border-color,box-shadow,background-color] duration-200 ease-out focus:border-primary-400/35 dark:border-primary-300/12 dark:focus:border-primary-400/40'

export const APP_CARD_CLASS = 'rounded-xl border-0 bg-white dark:!bg-dashboard-card'

export const APP_CARD_SM_CLASS = 'rounded-lg border-0 bg-white dark:!bg-dashboard-card'

const APP_FIELD_BASE = [
  'app-field w-full rounded-lg bg-white px-2.5 text-xs leading-normal text-gray-900 shadow-none',
  'min-h-9 h-9 py-0',
  'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/15',
  'dark:bg-white/[0.04] dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:ring-primary-400/20',
].join(' ')

export const APP_FIELD_CLASS = APP_FIELD_BASE

export const APP_FIELD_COMPACT_CLASS = [
  'app-field h-8 min-h-8 rounded-lg bg-white px-2.5 text-xs font-medium leading-normal text-gray-800 shadow-none',
  'placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/15',
  'dark:bg-white/[0.04] dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:ring-primary-400/20',
].join(' ')

export const APP_FIELD_ON_WHITE_CLASS = `${APP_FIELD_BASE} dark:!bg-dashboard-card`

/** Drawer / dense forms: textarea overrides height via class */
export const APP_FIELD_TEXTAREA_CLASS = `${APP_FIELD_ON_WHITE_CLASS} !h-auto min-h-[4.5rem] py-2`

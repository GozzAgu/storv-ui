import type { ExperienceMode } from '~/types/business-experience'

export type ExperienceModeOption = {
  mode: ExperienceMode
  title: string
  description: string
  changesWhenSelected: string[]
}

export const EXPERIENCE_MODE_OPTIONS: ExperienceModeOption[] = [
  {
    mode: 'solo',
    title: 'Just me',
    description:
      'A focused setup for running the business yourself. Enable team and multi-location tools later.',
    changesWhenSelected: [
      'Hides Departments, branches switcher, and Multi-Store Sync by default',
      'Payment links stay off until you turn them on in Advanced features',
      'You can unlock team and branch tools anytime in Settings',
    ],
  },
  {
    mode: 'business',
    title: 'Growing business',
    description:
      'The full Storvv workspace with team, branches, and advanced tools as your plan allows.',
    changesWhenSelected: [
      'Shows team, branch, and admin navigation when your plan includes them',
      'Payment links appear when your plan supports them',
      'Best when you manage staff or multiple locations',
    ],
  },
]

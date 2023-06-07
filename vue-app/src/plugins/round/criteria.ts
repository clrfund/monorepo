import { useHumanbound, humanboundWebsiteUrl } from '@/api/core'

export interface Criterion {
  emoji: string
  translationKey: string
  link?: string
}

const CRITERIA: Criterion[] = [
  {
    emoji: '🤲',
    translationKey: 'free_open_source',
  },
  {
    emoji: '👯‍♀️',
    translationKey: 'no_clones',
  },
  {
    emoji: '🙋‍♀️',
    translationKey: 'project_ownership',
  },
  {
    emoji: '👺',
    translationKey: 'no_scams',
  },
]

if (useHumanbound) {
  CRITERIA.push({
    emoji: '🛡️',
    translationKey: 'humanbound',
    link: humanboundWebsiteUrl,
  })
}

export const criteria: Criterion[] = [...CRITERIA]

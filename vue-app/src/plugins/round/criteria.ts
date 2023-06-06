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
  {
    emoji: '🛡️',
    translationKey: 'humanbound',
    link: 'https://app.humanbound.xyz',
  },
]

export const criteria: Criterion[] = [...CRITERIA]

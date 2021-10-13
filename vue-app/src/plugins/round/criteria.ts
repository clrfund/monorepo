export interface Criterion {
  emoji: string
  criterion: string
  description: string
}

const baseCriterion: Criterion[] = [
  {
    emoji: '🤲',
    criterion: 'Free and open source',
    description:
      'Your project code must be available to anyone to use under an open source license.',
  },
  {
    emoji: '👺',
    criterion: 'No scams',
    description:
      "Obviously, your project must not put anyone's funds or information at risk.",
  },
  {
    emoji: '👯‍♀️',
    criterion: 'No clones',
    description:
      "If you've forked code, you must provide additional, unique value to the ecosystem.",
  },
  {
    emoji: '🙋‍♀️',
    criterion: 'Project ownership',
    description:
      'The project must be yours or you must have permission from the project owner.',
  },
  {
    emoji: '💻',
    criterion: 'No clients',
    description:
      'Client teams are so important but this round of funding is focused on supporting other parts of the ecosystem.',
  },
]

/**
 * Add any round-specific criteria here
 */
const ADDITIONAL_CRITERION: Criterion[] = [
  {
    emoji: '💰',
    criterion: 'Related to Ethereum upgrades and staking',
    description: 'Your project must support Ethereum staking/validating.',
  },
  {
    emoji: '💻',
    criterion: 'No clients',
    description:
      'Client teams are so important but this round of funding is focused on supporting other parts of the ecosystem.',
  },
]

export const criteria: Criterion[] = [...baseCriterion, ...ADDITIONAL_CRITERION]

export interface Criterion {
  emoji: string
  criterion: string
  description: string
}

const CRITERIA: Criterion[] = [
  {
    emoji: '💰',
    criterion: 'Related to Ethereum staking',
    description: 'Your project must support Ethereum staking/validating.',
  },
  {
    emoji: '🤲',
    criterion: 'Free and open source',
    description:
      'Your project code must be available to anyone to use under a free and open source license.',
  },
  {
    emoji: '🙋‍♀️',
    criterion: 'Project ownership',
    description:
      'The project must be yours or you must have permission from the project owner.',
  },
  {
    emoji: '🆔',
    criterion: 'KYC',
    description:
      "You'll be contacted by the registry admin and must complete some basic KYC/AML requirements.",
  },
  {
    emoji: '👺',
    criterion: 'No scams',
    description:
      "Obviously, your project must not put anyone's funds or information at risk.",
  },
]

export const criteria: Criterion[] = [...CRITERIA]

export interface Criterion {
  emoji: string
  criterion: string
  description: string
}

const CRITERIA: Criterion[] = [
  {
    emoji: '💰',
    criterion: 'Related to Ethereum staking',
    description: 'Your project must support staking on Ethereum.',
  },
  {
    emoji: '🤲',
    criterion: 'Free and open source',
    description:
      'Your project must be free to use and any code associated with your project should be available to anyone under an open source license.',
  },
  {
    emoji: '🙋‍♀️',
    criterion: 'Project ownership',
    description:
      'The project you submit must be yours or you must have permission from the project owner.',
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

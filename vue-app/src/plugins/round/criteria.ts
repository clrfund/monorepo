export interface Criterion {
  emoji: string
  criterion: string
  description: string
}

const CRITERIA: Criterion[] = [
  {
    emoji: '💰',
    criterion: 'Related to Buidl Honduras',
    description: 'Your project must support the Honduras ecosystem.',
  },
  {
    emoji: '😺',
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
    emoji: '💀',
    criterion: 'No clones',
    description:
      "If you've forked code, you must provide additional, unique value to the ecosystem.",
  },
  {
    emoji: '🤓',
    criterion: 'Project ownership',
    description:
      'The project must be yours or you must have permission from the project owner.',
  },
  {
    emoji: '💻',
    criterion: 'No vaporware',
    description:
      'Vaporware is important (?) but we will not be focusing on this.',
  },
]

export const criteria: Criterion[] = [...CRITERIA]

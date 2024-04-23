/**
 * Maci tally file interface
 */
export interface Tally {
  provider: string
  maci: string
  pollId: string
  newTallyCommitment: string
  results: {
    commitment: string
    tally: string[]
    salt: string
  }
  totalSpentVoiceCredits: {
    spent: string
    commitment: string
    salt: string
  }
  perVOSpentVoiceCredits: {
    commitment: string
    tally: string[]
    salt: string
  }
}

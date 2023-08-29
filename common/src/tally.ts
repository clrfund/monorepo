/**
 * Maci tally file interface
 */
export interface Tally {
  provider: string
  maci: string
  results: {
    commitment: string
    tally: string[]
    salt: string
  }
  totalVoiceCredits: {
    spent: string
    commitment: string
    salt: string
  }
  totalVoiceCreditsPerVoteOption: {
    commitment: string
    tally: string[]
    salt: string
  }
}

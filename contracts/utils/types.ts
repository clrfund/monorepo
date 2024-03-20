/**
 * ClrFund contracts
 */
export enum EContracts {
  ClrFund = 'ClrFund',
  FundingRoundFactory = 'FundingRoundFactory',
  FundingRound = 'FundingRound',
  MACIFactory = 'MACIFactory',
  MACI = 'MACI',
  Verifier = 'Verifier',
  TopupCredit = 'TopupCredit',
  PollFactory = 'PollFactory',
  Poll = 'Poll',
  MessageProcessorFactory = 'MessageProcessorFactory',
  MessageProcessor = 'MessageProcessor',
  TallyFactory = 'TallyFactory',
  Tally = 'Tally',
  PoseidonT3 = 'PoseidonT3',
  PoseidonT4 = 'PoseidonT4',
  PoseidonT5 = 'PoseidonT5',
  PoseidonT6 = 'PoseidonT6',
  SimpleRecipientRegistry = 'SimpleRecipientRegistry',
  OptimisticRecipientRegistry = 'OptimisticRecipientRegistry',
  KlerosGTCRAdapter = 'KlerosGTCRAdapter',
  SimpleUserRegistry = 'SimpleUserRegistry',
  SemaphoreUserRegistry = 'SemaphoreUserRegistry',
  BrightIdUserRegistry = 'BrightIdUserRegistry',
  AnyOldERC20Token = 'AnyOldERC20Token',
  BrightIdSponsor = 'BrightIdSponsor',
  ClrFundDeployer = 'ClrFundDeployer',
  ERC20 = 'ERC20',
  TopupToken = 'TopupToken',
}

export enum recipientRegistryType {
  simple = 0,
  kleros = 1,
  optimistic = 2,
}

export interface Project {
  id: string
  requester?: string
  recipientIndex?: number
  recipientAddress?: string
  name?: string
  state: string
  createdAt?: Date
  removedAt?: Date
  tallyIndex?: number
  tallyResult?: string
  spentVoiceCredits?: string
  formattedDonationAmount?: string
  allocatedAmount?: string
  metadata?: any
  rawMetadata?: string
}

export interface Token {
  symbol: string
  decimals: number
}

/**
 * Round interface
 * recipientDeposit is optional for non-optimistic recipient registries
 */
export interface Round {
  chainId: number
  operator: string
  address: string
  userRegistryAddress: string
  recipientRegistryAddress: string
  recipientDepositAmount?: string
  maciAddress: string
  pollAddress?: string
  pollId?: bigint
  contributorCount: number
  totalSpent: string
  matchingPoolSize: string
  voiceCreditFactor: string
  isFinalized: boolean
  isCancelled: boolean
  tallyHash: string
  nativeTokenAddress: string
  nativeTokenSymbol: string
  nativeTokenDecimals: number
  startTime: number
  endTime: number
  signUpDuration: number
  votingDuration: number
  messages: bigint
  maxMessages: bigint
  maxRecipients: bigint
  blogUrl?: string
}

export type EventType =
  | 'RequestSubmitted'
  | 'RequestResolved'
  | 'KlerosRecipientAdded'
  | 'KlerosRecipientRemoved'
  | 'RecipientRemoved'
  | 'RecipientAdded'
  | 'RecipientRemovedV1'
  | 'RecipientAddedV1'

export type AbiInfo = {
  type: EventType
  name: string
  abi: string
}

export type RoundFileContent = {
  round: Round
  projects: Project[]
  tally: any
}

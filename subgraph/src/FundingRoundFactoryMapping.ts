import { BigInt, log, Address } from '@graphprotocol/graph-ts'
import {
  CoordinatorChanged,
  FundingSourceAdded,
  FundingSourceRemoved,
  OwnershipTransferred,
  RoundFinalized,
  RoundStarted,
  TokenChanged,
  FundingRoundFactory as FundingRoundFactoryContract,
} from '../generated/FundingRoundFactory/FundingRoundFactory'

import { MACIFactory as MACIFactoryContract } from '../generated/FundingRoundFactory/MACIFactory'
import { FundingRound as FundingRoundContract } from '../generated/FundingRoundFactory/FundingRound'

import { OptimisticRecipientRegistry as RecipientRegistryContract } from '../generated/FundingRoundFactory/OptimisticRecipientRegistry'
import { BrightIdUserRegistry as BrightIdUserRegistryContract } from '../generated/FundingRoundFactory/BrightIdUserRegistry'

import {
  FundingRound as FundingRoundTemplate,
  OptimisticRecipientRegistry as recipientRegistryTemplate,
  MACI as MACITemplate,
} from '../generated/templates'
import {
  FundingRoundFactory,
  FundingRound,
  RecipientRegistry,
  ContributorRegistry,
} from '../generated/schema'

function createRecipientRegistry(
  fundingRoundFactoryAddress: Address,
  recipientRegistryAddress: Address
): RecipientRegistry {
  log.info('New recipientRegistry {}', [recipientRegistryAddress.toHex()])
  let recipientRegistryId = recipientRegistryAddress.toHexString()
  let recipientRegistry = new RecipientRegistry(recipientRegistryId)

  recipientRegistryTemplate.create(recipientRegistryAddress)
  let recipientRegistryContract = RecipientRegistryContract.bind(
    recipientRegistryAddress
  )
  let baseDeposit = recipientRegistryContract.try_baseDeposit()
  if (baseDeposit.reverted) {
    recipientRegistry.baseDeposit = BigInt.fromI32(0)
    recipientRegistry.challengePeriodDuration = BigInt.fromI32(0)
  } else {
    recipientRegistry.baseDeposit = baseDeposit.value
    let challengePeriodDuration =
      recipientRegistryContract.challengePeriodDuration()
    recipientRegistry.challengePeriodDuration = challengePeriodDuration
  }
  let controller = recipientRegistryContract.try_controller()
  let maxRecipients = recipientRegistryContract.try_maxRecipients()
  let owner = recipientRegistryContract.try_owner()

  if (!controller.reverted) {
    recipientRegistry.controller = controller.value
  }
  if (!maxRecipients.reverted) {
    recipientRegistry.maxRecipients = maxRecipients.value
  }
  if (!owner.reverted) {
    recipientRegistry.owner = owner.value
  }
  recipientRegistry.fundingRoundFactory =
    fundingRoundFactoryAddress.toHexString()
  recipientRegistry.save()

  return recipientRegistry
}

function createContributorRegistry(
  fundingRoundFactoryAddress: Address,
  contributorRegistryAddress: Address
): ContributorRegistry {
  log.info('New contributorRegistry', [])

  let owner = fundingRoundFactoryAddress
  let contributorRegistryId = contributorRegistryAddress.toHexString()

  let brightIdUserRegistryContract = BrightIdUserRegistryContract.bind(
    contributorRegistryAddress
  )
  let brightIdSponsorCall = brightIdUserRegistryContract.try_brightIdSponsor()
  let contributorRegistry = new ContributorRegistry(contributorRegistryId)
  contributorRegistry.context = brightIdSponsorCall.reverted
    ? 'BrightId user registry'
    : 'simple user registry'
  contributorRegistry.owner = owner
  contributorRegistry.fundingRoundFactory =
    fundingRoundFactoryAddress.toHexString()
  contributorRegistry.save()

  return contributorRegistry
}

function createOrUpdateFundingRoundFactory(
  fundingRoundFactoryAddress: Address
): FundingRoundFactory | null {
  let fundingRoundFactoryId = fundingRoundFactoryAddress.toHexString()

  let fundingRoundFactoryContract = FundingRoundFactoryContract.bind(
    fundingRoundFactoryAddress
  )

  let fundingRoundFactory = FundingRoundFactory.load(fundingRoundFactoryId)
  if (!fundingRoundFactory) {
    fundingRoundFactory = new FundingRoundFactory(fundingRoundFactoryId)
  }

  let maciFactoryAddressCall = fundingRoundFactoryContract.try_maciFactory()
  if (maciFactoryAddressCall.reverted) {
    log.info('TRY maciFactoryAddress Failed', [])
  } else {
    let maciFactoryAddress = maciFactoryAddressCall.value
    let maciFactoryContract = MACIFactoryContract.bind(maciFactoryAddress)
    let batchUstVerifier = maciFactoryContract.batchUstVerifier()
    let qvtVerifier = maciFactoryContract.qvtVerifier()
    let votingDuration = maciFactoryContract.votingDuration()
    let signUpDuration = maciFactoryContract.signUpDuration()

    let tallyBatchSize = maciFactoryContract.batchSizes().value0
    let messageBatchSize = maciFactoryContract.batchSizes().value1
    let stateTreeDepth = maciFactoryContract.treeDepths().value0
    let messageTreeDepth = maciFactoryContract.treeDepths().value1
    let voteOptionTreeDepth = maciFactoryContract.treeDepths().value2
    let maxUsers = maciFactoryContract.maxValues().value0
    let maxMessages = maciFactoryContract.maxValues().value1
    let maxVoteOptions = maciFactoryContract.maxValues().value2

    fundingRoundFactory.maciFactory = maciFactoryAddress
    fundingRoundFactory.batchUstVerifier = batchUstVerifier
    fundingRoundFactory.qvtVerifier = qvtVerifier
    fundingRoundFactory.votingDuration = votingDuration
    fundingRoundFactory.signUpDuration = signUpDuration
    fundingRoundFactory.tallyBatchSize = BigInt.fromI32(tallyBatchSize)
    fundingRoundFactory.messageBatchSize = BigInt.fromI32(messageBatchSize)
    fundingRoundFactory.messageTreeDepth = BigInt.fromI32(messageTreeDepth)
    fundingRoundFactory.stateTreeDepth = BigInt.fromI32(stateTreeDepth)
    fundingRoundFactory.voteOptionTreeDepth =
      BigInt.fromI32(voteOptionTreeDepth)
    fundingRoundFactory.maxUsers = maxUsers
    fundingRoundFactory.maxMessages = maxMessages
    fundingRoundFactory.maxVoteOptions = maxVoteOptions

    log.info('New maciFactoryAddress', [])
  }

  let nativeToken = fundingRoundFactoryContract.nativeToken()
  let coordinator = fundingRoundFactoryContract.coordinator()
  let owner = fundingRoundFactoryContract.owner()

  //Check if these registries already exist/are being tracked
  let recipientRegistryAddress = fundingRoundFactoryContract.recipientRegistry()
  let recipientRegistryId = recipientRegistryAddress.toHexString()
  let recipientRegistry = RecipientRegistry.load(recipientRegistryId)
  if (!recipientRegistry) {
    createRecipientRegistry(
      fundingRoundFactoryAddress,
      recipientRegistryAddress
    )
  }

  let contributorRegistryAddress = fundingRoundFactoryContract.userRegistry()
  let contributorRegistryId = contributorRegistryAddress.toHexString()
  let contributorRegistry = ContributorRegistry.load(contributorRegistryId)
  if (!contributorRegistry) {
    createContributorRegistry(
      fundingRoundFactoryAddress,
      contributorRegistryAddress
    )
  }

  fundingRoundFactory.contributorRegistry = contributorRegistryId
  fundingRoundFactory.recipientRegistry = recipientRegistryId
  fundingRoundFactory.contributorRegistryAddress = contributorRegistryAddress
  fundingRoundFactory.recipientRegistryAddress = recipientRegistryAddress
  fundingRoundFactory.nativeToken = nativeToken
  fundingRoundFactory.coordinator = coordinator
  fundingRoundFactory.owner = owner

  fundingRoundFactory.save()
  return fundingRoundFactory
}

export function handleCoordinatorChanged(event: CoordinatorChanged): void {
  log.info('handleCoordinatorChanged', [])
  createOrUpdateFundingRoundFactory(event.address)
}

export function handleFundingSourceAdded(event: FundingSourceAdded): void {
  log.info('handleFundingSourceAdded', [])
  createOrUpdateFundingRoundFactory(event.address)
}

export function handleFundingSourceRemoved(event: FundingSourceRemoved): void {
  log.info('handleFundingSourceRemoved', [])
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  log.info('handleOwnershipTransferred', [event.params.newOwner.toHexString()])
  createOrUpdateFundingRoundFactory(event.address)

  /* comment out testing code
  let fundingRoundFactory = createOrUpdateFundingRoundFactory(event.address)
  fundingRoundFactory.nativeToken = Address.fromString('0xda10009cbd5d07dd0cecc66161fc93d7c9000da1')
  fundingRoundFactory.coordinator = Address.fromString('0x7246e313dadaf4083df2d8132801f1bfcad53aeb')
  fundingRoundFactory.contributorRegistry = '0x631a12430f94207de980d9b6a744aeb4093dcec1'
  fundingRoundFactory.recipientRegistry = '0x998b330b1424e343b18d83169c19bca4de39153f'
  fundingRoundFactory.owner = event.params.newOwner

  let contributorRegistryAddress = Address.fromString(fundingRoundFactory.contributorRegistry)
  let recipientRegistryAddress = Address.fromString(fundingRoundFactory.recipientRegistry)
  createContributorRegistry(event.address, contributorRegistryAddress)
  createRecipientRegistry(event.address, recipientRegistryAddress)
  fundingRoundFactory.contributorRegistryAddress = contributorRegistryAddress
  fundingRoundFactory.recipientRegistryAddress = recipientRegistryAddress
  fundingRoundFactory.save()
  */
}

export function handleRoundFinalized(event: RoundFinalized): void {
  log.info('handleRoundFinalized', [])
  let fundingRoundAddress = event.params._round

  let fundingRoundContract = FundingRoundContract.bind(fundingRoundAddress)

  let fundingRound = new FundingRound(fundingRoundAddress.toHexString())

  let totalSpent = fundingRoundContract.totalSpent()
  let totalVotes = fundingRoundContract.totalVotes()
  let tallyHash = fundingRoundContract.tallyHash()
  let isFinalized = fundingRoundContract.isFinalized()
  let contributorCount = fundingRoundContract.contributorCount()
  let matchingPoolSize = fundingRoundContract.matchingPoolSize()

  fundingRound.totalSpent = totalSpent
  fundingRound.totalVotes = totalVotes
  fundingRound.tallyHash = tallyHash
  fundingRound.isFinalized = isFinalized
  fundingRound.contributorCount = contributorCount
  fundingRound.matchingPoolSize = matchingPoolSize

  fundingRound.save()
}

export function handleRoundStarted(event: RoundStarted): void {
  log.info('handleRoundStarted!!!', [])
  let fundingRoundFactoryId = event.address.toHexString()
  let fundingRoundId = event.params._round.toHexString()

  let fundingRoundFactory = createOrUpdateFundingRoundFactory(event.address)

  FundingRoundTemplate.create(event.params._round)
  let fundingRoundFactoryContract = FundingRoundFactoryContract.bind(
    event.address
  )
  let fundingRoundAddress = event.params._round

  let fundingRoundContract = FundingRoundContract.bind(fundingRoundAddress)

  let fundingRound = new FundingRound(fundingRoundId)

  log.info('Get all the things', [])
  let nativeToken = fundingRoundContract.nativeToken()
  let coordinator = fundingRoundContract.coordinator()
  let maci = fundingRoundContract.maci()
  let voiceCreditFactor = fundingRoundContract.voiceCreditFactor()
  let contributorCount = fundingRoundContract.contributorCount()
  let matchingPoolSize = fundingRoundContract.matchingPoolSize()

  MACITemplate.create(maci)

  fundingRound.fundingRoundFactory = fundingRoundFactoryId
  fundingRound.nativeToken = nativeToken
  fundingRound.coordinator = coordinator
  fundingRound.maci = maci
  fundingRound.voiceCreditFactor = voiceCreditFactor
  fundingRound.contributorCount = contributorCount
  fundingRound.matchingPoolSize = matchingPoolSize

  let recipientRegistryId = fundingRoundFactory.recipientRegistry
  let recipientRegistryAddress = fundingRoundFactory.recipientRegistryAddress

  let contributorRegistryId = fundingRoundFactory.contributorRegistry
  let contributorRegistryAddress =
    fundingRoundFactory.contributorRegistryAddress

  log.info('TRY maciFactoryAddress', [])
  let maciFactoryAddressCall = fundingRoundFactoryContract.try_maciFactory()

  if (maciFactoryAddressCall.reverted) {
    log.info('TRY maciFactoryAddress Failed', [])
  } else {
    let maciFactoryAddress = maciFactoryAddressCall.value
    let maciFactoryContract = MACIFactoryContract.bind(maciFactoryAddress)
    let votingDuration = maciFactoryContract.votingDuration()
    let signUpDuration = maciFactoryContract.signUpDuration()

    fundingRound.signUpDeadline = event.block.timestamp.plus(signUpDuration)
    fundingRound.votingDeadline = event.block.timestamp
      .plus(signUpDuration)
      .plus(votingDuration)

    log.info('New maciFactoryAddress', [])
  }

  fundingRoundFactory.currentRound = fundingRoundId

  fundingRoundFactory.save()

  //NOTE: Set the registries for the round
  fundingRound.contributorRegistry = contributorRegistryId
  fundingRound.recipientRegistry = recipientRegistryId
  fundingRound.contributorRegistryAddress = contributorRegistryAddress
  fundingRound.recipientRegistryAddress = recipientRegistryAddress
  fundingRound.startTime = event.block.timestamp
  fundingRound.recipientCount = BigInt.fromString('0')

  fundingRound.save()
}

export function handleTokenChanged(event: TokenChanged): void {
  log.info('handleTokenChanged {}', [event.params._token.toHexString()])
}

import { BigInt, log, Address } from '@graphprotocol/graph-ts'
import {
  CoordinatorChanged,
  FundingSourceAdded,
  FundingSourceRemoved,
  OwnershipTransferred,
  RoundFinalized,
  RoundStarted,
  TokenChanged,
  UserRegistryChanged,
  RecipientRegistryChanged,
  ClrFund as ClrFundContract,
} from '../generated/ClrFund/ClrFund'

import { Token as TokenContract } from '../generated/ClrFund/Token'
import { Poll as PollContract } from '../generated/ClrFund/Poll'
import { MACI as MACIContract } from '../generated/ClrFund/MACI'

import { MACIFactory as MACIFactoryContract } from '../generated/ClrFund/MACIFactory'
import { FundingRound as FundingRoundContract } from '../generated/ClrFund/FundingRound'

import { OptimisticRecipientRegistry as RecipientRegistryContract } from '../generated/ClrFund/OptimisticRecipientRegistry'
import { BrightIdUserRegistry as BrightIdUserRegistryContract } from '../generated/ClrFund/BrightIdUserRegistry'
import { createRecipientRegistry } from './RecipientRegistry'

import {
  FundingRound as FundingRoundTemplate,
  OptimisticRecipientRegistry as recipientRegistryTemplate,
  MACI as MACITemplate,
  Poll as PollTemplate,
} from '../generated/templates'
import {
  ClrFund,
  FundingRound,
  RecipientRegistry,
  ContributorRegistry,
  Token,
  Poll,
} from '../generated/schema'

function createContributorRegistry(
  clrFundAddress: Address,
  contributorRegistryAddress: Address
): ContributorRegistry {
  log.info('New contributorRegistry', [])

  let owner = clrFundAddress
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
  contributorRegistry.clrFund = clrFundAddress.toHexString()
  contributorRegistry.save()

  return contributorRegistry
}

function createToken(tokenAddress: Address, blockTimestamp: BigInt): Token {
  let tokenId = tokenAddress.toHexString()
  let token = new Token(tokenId)
  let tokenContract = TokenContract.bind(tokenAddress)

  let symbol = tokenContract.try_symbol()
  let decimals = tokenContract.try_decimals()

  if (!symbol.reverted) {
    token.symbol = symbol.value
  }

  if (!decimals.reverted) {
    token.decimals = BigInt.fromI32(decimals.value)
  }

  let timestamp = blockTimestamp.toString()
  token.createdAt = timestamp
  token.lastUpdatedAt = timestamp
  token.tokenAddress = tokenAddress
  token.save()

  return token
}

function createOrUpdateClrFund(
  clrFundAddress: Address,
  timestamp: BigInt
): ClrFund {
  let clrFundId = clrFundAddress.toHexString()

  let clrFundContract = ClrFundContract.bind(clrFundAddress)

  let loadedClrFund = ClrFund.load(clrFundId)
  let clrFund = loadedClrFund ? loadedClrFund : new ClrFund(clrFundId)

  let maciFactoryAddressCall = clrFundContract.try_maciFactory()
  if (maciFactoryAddressCall.reverted) {
    log.info('TRY maciFactoryAddress Failed', [])
  } else {
    let maciFactoryAddress = maciFactoryAddressCall.value
    let maciFactoryContract = MACIFactoryContract.bind(maciFactoryAddress)

    let stateTreeDepth = maciFactoryContract.stateTreeDepth()
    let messageTreeDepth = maciFactoryContract.treeDepths().value2
    let voteOptionTreeDepth = maciFactoryContract.treeDepths().value3

    clrFund.maciFactory = maciFactoryAddress
    clrFund.messageTreeDepth = BigInt.fromI32(messageTreeDepth)
    clrFund.stateTreeDepth = BigInt.fromI32(stateTreeDepth)
    clrFund.voteOptionTreeDepth = BigInt.fromI32(voteOptionTreeDepth)

    log.info('New maciFactoryAddress', [])
  }

  let nativeToken = clrFundContract.nativeToken()
  let nativeTokenId = nativeToken.toHexString()
  let nativeTokenEntity = Token.load(nativeTokenId)
  if (!nativeTokenEntity) {
    createToken(nativeToken, timestamp)
  }

  let coordinator = clrFundContract.coordinator()
  let owner = clrFundContract.owner()

  //Check if these registries already exist/are being tracked
  let recipientRegistryAddress = clrFundContract.recipientRegistry()
  let recipientRegistryId = recipientRegistryAddress.toHexString()
  let recipientRegistry = RecipientRegistry.load(recipientRegistryId)
  if (!recipientRegistry) {
    createRecipientRegistry(clrFundId, recipientRegistryAddress)
  }

  let contributorRegistryAddress = clrFundContract.userRegistry()
  let contributorRegistryId = contributorRegistryAddress.toHexString()
  let contributorRegistry = ContributorRegistry.load(contributorRegistryId)
  if (!contributorRegistry) {
    createContributorRegistry(clrFundAddress, contributorRegistryAddress)
  }

  clrFund.contributorRegistry = contributorRegistryId
  clrFund.recipientRegistry = recipientRegistryId
  clrFund.contributorRegistryAddress = contributorRegistryAddress
  clrFund.recipientRegistryAddress = recipientRegistryAddress
  clrFund.nativeToken = nativeToken
  clrFund.nativeTokenInfo = nativeTokenId
  clrFund.coordinator = coordinator
  clrFund.owner = owner

  clrFund.save()
  return clrFund
}

export function handleCoordinatorChanged(event: CoordinatorChanged): void {
  log.info('handleCoordinatorChanged', [])
  createOrUpdateClrFund(event.address, event.block.timestamp)
}

export function handleFundingSourceAdded(event: FundingSourceAdded): void {
  log.info('handleFundingSourceAdded', [])
  createOrUpdateClrFund(event.address, event.block.timestamp)
}

export function handleFundingSourceRemoved(event: FundingSourceRemoved): void {
  log.info('handleFundingSourceRemoved', [])
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  log.info('handleOwnershipTransferred', [event.params.newOwner.toHexString()])
  createOrUpdateClrFund(event.address, event.block.timestamp)
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
  let isCancelled = fundingRoundContract.isCancelled()
  let contributorCount = fundingRoundContract.contributorCount()
  let matchingPoolSize = fundingRoundContract.matchingPoolSize()

  fundingRound.totalSpent = totalSpent
  fundingRound.totalVotes = totalVotes
  fundingRound.tallyHash = tallyHash
  fundingRound.isFinalized = isFinalized
  fundingRound.isCancelled = isCancelled
  fundingRound.contributorCount = contributorCount
  fundingRound.matchingPoolSize = matchingPoolSize

  fundingRound.save()
}

export function handleRoundStarted(event: RoundStarted): void {
  log.info('handleRoundStarted!!!', [])
  let clrFundId = event.address.toHexString()
  let fundingRoundId = event.params._round.toHexString()

  let clrFund = createOrUpdateClrFund(event.address, event.block.timestamp)

  FundingRoundTemplate.create(event.params._round)
  let fundingRoundAddress = event.params._round
  let fundingRoundContract = FundingRoundContract.bind(fundingRoundAddress)
  let fundingRound = new FundingRound(fundingRoundId)

  log.info('Get all the things', [])
  let nativeToken = fundingRoundContract.nativeToken()
  let nativeTokenId = nativeToken.toHexString()
  let nativeTokenEntity = Token.load(nativeTokenId)
  if (!nativeTokenEntity) {
    createToken(nativeToken, event.block.timestamp)
  }
  let coordinator = fundingRoundContract.coordinator()
  let maci = fundingRoundContract.maci()
  let voiceCreditFactor = fundingRoundContract.voiceCreditFactor()
  let contributorCount = fundingRoundContract.contributorCount()
  let matchingPoolSize = fundingRoundContract.matchingPoolSize()

  MACITemplate.create(maci)

  fundingRound.clrFund = clrFundId
  fundingRound.nativeToken = nativeToken
  fundingRound.nativeTokenInfo = nativeTokenId
  fundingRound.coordinator = coordinator
  fundingRound.maci = maci
  fundingRound.maciTxHash = event.transaction.hash
  fundingRound.voiceCreditFactor = voiceCreditFactor
  fundingRound.contributorCount = contributorCount
  fundingRound.matchingPoolSize = matchingPoolSize
  fundingRound.startTime = event.block.timestamp

  let recipientRegistryId = clrFund.recipientRegistry
  let recipientRegistryAddress = clrFund.recipientRegistryAddress

  let contributorRegistryId = clrFund.contributorRegistry
  let contributorRegistryAddress = clrFund.contributorRegistryAddress

  let maciContract = MACIContract.bind(maci)
  let stateTreeDepth = maciContract.try_stateTreeDepth()
  if (!stateTreeDepth.reverted) {
    fundingRound.stateTreeDepth = stateTreeDepth.value
  }

  log.info('TRY pollAddress', [])
  let pollIdCall = fundingRoundContract.try_pollId()
  if (!pollIdCall.reverted) {
    fundingRound.pollId = pollIdCall.value
  }

  let pollAddressCall = fundingRoundContract.try_poll()
  if (pollAddressCall.reverted) {
    log.info('TRY pollAddress Failed', [])
  } else {
    let pollAddress = pollAddressCall.value
    fundingRound.pollAddress = pollAddress
    PollTemplate.create(pollAddress)

    let pollEntityId = pollAddress.toHexString()
    let pollEntity = new Poll(pollEntityId)
    pollEntity.fundingRound = fundingRoundId
    pollEntity.save()

    let pollContract = PollContract.bind(pollAddress)
    let deployTimeAndDuration = pollContract.try_getDeployTimeAndDuration()
    if (!deployTimeAndDuration.reverted) {
      let deployTime = deployTimeAndDuration.value.value0
      let duration = deployTimeAndDuration.value.value1
      // MACI's signup deadline is the same as the voting deadline
      fundingRound.signUpDeadline = deployTime.plus(duration)
      fundingRound.votingDeadline = fundingRound.signUpDeadline
      fundingRound.startTime = deployTime

      log.info('New pollAddress', [])
    }

    let treeDepths = pollContract.try_treeDepths()
    if (!treeDepths.reverted) {
      fundingRound.messageTreeDepth = treeDepths.value.value2
      fundingRound.voteOptionTreeDepth = treeDepths.value.value3
    }

    let coordinatorPubKey = pollContract.try_coordinatorPubKey()
    if (!coordinatorPubKey.reverted) {
      fundingRound.coordinatorPubKeyX = coordinatorPubKey.value.value0
      fundingRound.coordinatorPubKeyY = coordinatorPubKey.value.value1
    }
  }

  clrFund.currentRound = fundingRoundId

  clrFund.save()

  //NOTE: Set the registries for the round
  fundingRound.contributorRegistry = contributorRegistryId
  fundingRound.recipientRegistry = recipientRegistryId
  fundingRound.contributorRegistryAddress = contributorRegistryAddress
  fundingRound.recipientRegistryAddress = recipientRegistryAddress
  fundingRound.recipientCount = BigInt.fromString('0')

  fundingRound.save()
}

export function handleTokenChanged(event: TokenChanged): void {
  log.info('handleTokenChanged {}', [event.params._token.toHexString()])
  createOrUpdateClrFund(event.address, event.block.timestamp)
}

export function handleRecipientRegistryChanged(
  event: RecipientRegistryChanged
): void {
  log.info('handleRecipientRegistryChanged {}', [
    event.params._recipientRegistry.toHexString(),
  ])
  createOrUpdateClrFund(event.address, event.block.timestamp)
}

export function handleUserRegistryChanged(event: UserRegistryChanged): void {
  log.info('handleUserRegistryChanged {}', [
    event.params._userRegistry.toHexString(),
  ])
  createOrUpdateClrFund(event.address, event.block.timestamp)
}

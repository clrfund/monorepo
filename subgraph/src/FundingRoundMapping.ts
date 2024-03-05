import { BigInt, log, store } from '@graphprotocol/graph-ts'
import {
  Contribution,
  ContributionWithdrawn,
  FundsClaimed,
  OwnershipTransferred,
  TallyPublished,
  RegisterCall,
  FundingRound as FundingRoundContract,
} from '../generated/templates/FundingRound/FundingRound'
import { OptimisticRecipientRegistry as RecipientRegistryContract } from '../generated/templates/FundingRound/OptimisticRecipientRegistry'

import {
  Recipient,
  Contributor,
  Contribution as FundingRoundContribution,
  Donation,
  FundingRound,
} from '../generated/schema'
// The following functions can then be called on this contract to access
// state variables and other data:
//
// - contract.contributorCount(...)
// - contract.coordinator(...)
// - contract.getAllocatedAmount(...)
// - contract.getVoiceCredits(...)
// - contract.isCancelled(...)
// - contract.isFinalized(...)
// - contract.maci(...)
// - contract.matchingPoolSize(...)
// - contract.nativeToken(...)
// - contract.owner(...)
// - contract.recipientRegistry(...)
// - contract.tallyHash(...)
// - contract.totalSpent(...)
// - contract.totalVotes(...)
// - contract.userRegistry(...)
// - contract.voiceCreditFactor(...)

export function handleContribution(event: Contribution): void {
  log.info('handleContribution', [])

  let fundingRoundId = event.address.toHexString()
  let fundingRound = FundingRound.load(fundingRoundId)
  if (fundingRound == null) {
    log.error('Error: handleContribution failed', [])
    return
  }

  let timestamp = event.block.timestamp.toString()

  let fundingRoundContract = FundingRoundContract.bind(event.address)
  let voiceCreditFactor = fundingRoundContract.voiceCreditFactor()
  let contributorRegistryAddress = fundingRoundContract.userRegistry()
  let contributorRegistryId = contributorRegistryAddress.toHexString()

  // let brightIdUserRegistryContract = BrightIdUserRegistryContract.bind(contributorRegistryAddress);

  //DONE: Retroactively register here as there are no events emitted in registration function
  let contributorAddress = event.params._sender
  let contributorId = contributorAddress.toHexString()
  let contributor = Contributor.load(contributorId)
  let contributionId = fundingRoundId
    .concat('-contribution-')
    .concat(contributorId)

  //NOTE: If the contracts aren't being tracked initialize them
  if (contributor == null) {
    let contributor = new Contributor(contributorId)

    let _fundingRounds = [fundingRoundId] as string[]
    contributor.fundingRounds = _fundingRounds

    contributor.contributorRegistry = contributorRegistryId
    contributor.contributorAddress = contributorAddress
    contributor.verifiedTimeStamp = event.block.timestamp.toString()

    contributor.save()
  } else {
    let fundingRounds = contributor.fundingRounds
    if (fundingRounds) {
      fundingRounds.push(fundingRoundId)
      contributor.fundingRounds = fundingRounds
    } else {
      let _fundingRounds = [fundingRoundId] as string[]
      contributor.fundingRounds = _fundingRounds
    }

    contributor.contributorRegistry = contributorRegistryId
    contributor.contributorAddress = contributorAddress
    contributor.verifiedTimeStamp = event.block.timestamp.toString()

    contributor.save()
  }

  //NOTE: Contributions are deleted from DB table if they are withdrawn
  let contribution = new FundingRoundContribution(contributionId)
  contribution.contributor = contributorId
  contribution.fundingRound = fundingRoundId
  contribution.amount = event.params._amount
  contribution.voiceCredits = event.params._amount.div(voiceCreditFactor)
  contribution.createdAt = timestamp

  //NOTE: Update Funding Round
  fundingRound.contributorCount = fundingRound.contributorCount.plus(
    BigInt.fromI32(1)
  )
  fundingRound.lastUpdatedAt = timestamp

  contribution.save()
  fundingRound.save()
}

export function handleContributionWithdrawn(
  event: ContributionWithdrawn
): void {
  log.info('handleContributionWithdrawn', [])
  let fundingRoundId = event.address.toHexString()
  let contributorId = event.params._contributor.toHexString()
  let contributionId = fundingRoundId
    .concat('-contribution-')
    .concat(contributorId)
  let timestamp = event.block.timestamp.toString()

  store.remove('Contribution', contributionId)

  let fundingRound = FundingRound.load(fundingRoundId)
  if (fundingRound == null) {
    log.error('Error: handleContributionWithdrawn failed', [])
    return
  }
  fundingRound.contributorCount = fundingRound.contributorCount.minus(
    BigInt.fromI32(1)
  )
  fundingRound.lastUpdatedAt = timestamp
}

export function handleFundsClaimed(event: FundsClaimed): void {
  log.info('handleFundsClaimed', [])

  let fundingRoundId = event.address.toHexString()
  let fundingRound = FundingRound.load(fundingRoundId)
  if (fundingRound == null) {
    log.error('Error: handleContribution failed', [])
    return
  }

  let timestamp = event.block.timestamp.toString()

  let fundingRoundContract = FundingRoundContract.bind(event.address)
  let recipientRegistryAddress = fundingRoundContract.recipientRegistry()
  let recipientRegistryId = recipientRegistryAddress.toHexString()

  //DONE: Retroactively register here as there are no events emitted in registration function
  let recipient = event.params._recipient
  let voteOptionIndex = event.params._voteOptionIndex
  let donationId = fundingRoundId
    .concat('-contribution-')
    .concat(recipient.toHex())
    .concat('-')
    .concat(voteOptionIndex.toString())

  let donation = new Donation(donationId)
  donation.fundingRound = fundingRoundId
  donation.recipient = recipient
  donation.amount = event.params._amount
  donation.voteOptionIndex = voteOptionIndex
  donation.createdAt = timestamp

  fundingRound.recipientCount = fundingRound.recipientCount.plus(
    BigInt.fromI32(1)
  )
  fundingRound.lastUpdatedAt = timestamp

  donation.save()
  fundingRound.save()
}

export function handleTallyPublished(event: TallyPublished): void {
  log.info('handleTallyPublished', [])
  let fundingRoundId = event.address.toHexString()
  let timestamp = event.block.timestamp.toString()

  let fundingRound = FundingRound.load(fundingRoundId)
  if (fundingRound == null) {
    log.error('Error: handleTallyPublished failed', [])
    return
  }
  fundingRound.tallyHash = event.params._tallyHash
  fundingRound.lastUpdatedAt = timestamp
}
export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  log.info('handleOwnershipTransferred- Funding Round', [])
}

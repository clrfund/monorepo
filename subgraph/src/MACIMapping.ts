import { log } from '@graphprotocol/graph-ts'
import { PublishMessage, SignUp } from '../generated/templates/MACI/MACI'

import { FundingRound, Message, PublicKey } from '../generated/schema'

// It is also possible to access smart contracts from mappings. For
// example, the contract that has emitted the event can be connected to
// with:
//
// let contract = Contract.bind(event.address)
//
// The following functions can then be called on this contract to access
// state variables and other data:
//
// - contract.context(...)
// - contract.isOwner(...)
// - contract.isVerifiedUser(...)
// - contract.owner(...)
// - contract.verifications(...)
// - contract.verifier(...)

export function handlePublishMessage(event: PublishMessage): void {
  let fundingRoundId = event.transaction.to.toHexString()
  if (fundingRoundId == null) {
    log.error(
      'Error: handlePublishMessage failed fundingRound not registered',
      []
    )
    return
  }
  let fundingRound = FundingRound.load(fundingRoundId)
  if (fundingRound == null) {
    log.error(
      'Error: handlePublishMessage failed fundingRound not registered',
      []
    )
    return
  }

  let messageID =
    event.transaction.hash.toHexString() +
    '-' +
    event.transactionLogIndex.toString()

  let timestamp = event.block.timestamp.toString()
  let message = new Message(messageID)
  message.data = event.params._message.data
  message.iv = event.params._message.iv
  message.blockNumber = event.block.number
  message.transactionIndex = event.transaction.index

  let publicKeyId = event.transaction.from.toHexString()
  let publicKey = PublicKey.load(publicKeyId)

  //NOTE: If the public keys aren't being tracked initialize them
  if (publicKey == null) {
    let publicKey = new PublicKey(publicKeyId)
    publicKey.x = event.params._encPubKey.x
    publicKey.y = event.params._encPubKey.y

    let _messages = [messageID] as string[]
    publicKey.messages = _messages
    publicKey.fundingRound = fundingRoundId

    publicKey.save()
  }

  message.publicKey = publicKeyId as string
  message.timestamp = timestamp
  message.fundingRound = fundingRoundId
  message.save()
  log.info('handlePublishMessage', [])
}

export function handleSignUp(event: SignUp): void {
  let publicKeyId = event.transaction.from.toHexString()
  let publicKey = PublicKey.load(publicKeyId)

  //NOTE: If the public keys aren't being tracked initialize them
  if (publicKey == null) {
    let publicKey = new PublicKey(publicKeyId)
    publicKey.x = event.params._userPubKey.x
    publicKey.y = event.params._userPubKey.y
    publicKey.stateIndex = event.params._stateIndex

    publicKey.voiceCreditBalance = event.params._voiceCreditBalance

    publicKey.save()
  }

  log.info('SignUp', [])
}

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
  const fundingRoundId = event.transaction.to.toHexString()
  if (fundingRoundId == null) {
    log.error(
      'Error: handlePublishMessage failed fundingRound not registered',
      []
    )
    return
  }
  const fundingRound = FundingRound.load(fundingRoundId)
  if (fundingRound == null) {
    log.error(
      'Error: handlePublishMessage failed fundingRound not registered',
      []
    )
    return
  }

  const messageID = event.transaction.hash.toHexString()

  const timestamp = event.block.timestamp.toString()
  const message = new Message(messageID)
  message.data = event.params._message.data
  message.iv = event.params._message.iv

  const publicKeyId = event.transaction.from.toHexString()
  const publicKey = PublicKey.load(publicKeyId)

  //NOTE: If the public keys aren't being tracked initialize them
  if (publicKey == null) {
    const publicKey = new PublicKey(publicKeyId)
    publicKey.x = event.params._encPubKey.x
    publicKey.y = event.params._encPubKey.y

    const _messages = [messageID] as string[]
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
  const publicKeyId = event.transaction.from.toHexString()
  const publicKey = PublicKey.load(publicKeyId)

  //NOTE: If the public keys aren't being tracked initialize them
  if (publicKey == null) {
    const publicKey = new PublicKey(publicKeyId)
    publicKey.x = event.params._userPubKey.x
    publicKey.y = event.params._userPubKey.y

    publicKey.save()
  }

  log.info('SignUp', [])
}

import { log, ByteArray, crypto, BigInt } from '@graphprotocol/graph-ts'
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

function makePubKeyId(x: BigInt, y: BigInt): string {
  let pubKeyX = x.toString()
  let pubKeyY = y.toString()
  let pubKeyXY = ByteArray.fromUTF8(pubKeyX + '.' + pubKeyY)
  let publicKeyId = crypto.keccak256(pubKeyXY).toHexString()
  return publicKeyId
}

export function handlePublishMessage(event: PublishMessage): void {
  if (!event.transaction.to) {
    log.error(
      'Error: handlePublishMessage failed fundingRound not registered',
      []
    )
    return
  }

  let fundingRoundId = event.transaction.to!.toHex()
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
  message.submittedBy = event.transaction.from

  let publicKeyId = makePubKeyId(
    event.params._encPubKey.x,
    event.params._encPubKey.y
  )
  let publicKey = PublicKey.load(publicKeyId)

  //NOTE: If the public keys aren't being tracked initialize them
  if (publicKey == null) {
    let publicKey = new PublicKey(publicKeyId)
    publicKey.x = event.params._encPubKey.x
    publicKey.y = event.params._encPubKey.y
    publicKey.fundingRound = fundingRoundId

    publicKey.save()
  }

  message.publicKey = publicKeyId
  message.timestamp = timestamp
  message.fundingRound = fundingRoundId
  message.save()
  log.info('handlePublishMessage', [])
}

export function handleSignUp(event: SignUp): void {
  let publicKeyId = makePubKeyId(
    event.params._userPubKey.x,
    event.params._userPubKey.y
  )
  let publicKey = PublicKey.load(publicKeyId)

  //NOTE: If the public keys aren't being tracked initialize them
  if (publicKey == null) {
    publicKey = new PublicKey(publicKeyId)
  }
  publicKey.x = event.params._userPubKey.x
  publicKey.y = event.params._userPubKey.y
  publicKey.stateIndex = event.params._stateIndex

  publicKey.voiceCreditBalance = event.params._voiceCreditBalance

  let fundingRoundAddress = event.transaction.to!
  let fundingRoundId = fundingRoundAddress.toHex()
  let fundingRound = FundingRound.load(fundingRoundId)
  if (fundingRound == null) {
    log.error('Error: handleSignUp failed, fundingRound not registered', [])
    return
  }

  publicKey.fundingRound = fundingRoundId
  publicKey.save()

  log.info('SignUp', [])
}

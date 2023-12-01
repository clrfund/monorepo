import { log, ByteArray, crypto, BigInt } from '@graphprotocol/graph-ts'
import { PublishMessage } from '../generated/templates/Poll/Poll'

import { FundingRound, Message, PublicKey } from '../generated/schema'
import { makePublicKeyId } from './PublicKey'

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
  message.msgType = event.params._message.msgType
  message.blockNumber = event.block.number
  message.transactionIndex = event.transaction.index
  message.submittedBy = event.transaction.from

  let publicKeyId = makePublicKeyId(
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

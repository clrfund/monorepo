import { log } from '@graphprotocol/graph-ts'
import { SignUp } from '../generated/templates/MACI/MACI'

import { FundingRound, PublicKey } from '../generated/schema'
import { makePublicKeyId } from './PublicKey'

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

export function handleSignUp(event: SignUp): void {
  let fundingRoundAddress = event.transaction.to!
  let fundingRoundId = fundingRoundAddress.toHex()

  let publicKeyId = makePublicKeyId(
    fundingRoundId,
    event.params._userPubKeyX,
    event.params._userPubKeyY
  )
  let publicKey = PublicKey.load(publicKeyId)

  //NOTE: If the public keys aren't being tracked initialize them
  if (publicKey == null) {
    publicKey = new PublicKey(publicKeyId)
  }
  publicKey.x = event.params._userPubKeyX
  publicKey.y = event.params._userPubKeyY
  publicKey.stateIndex = event.params._stateIndex
  publicKey.voiceCreditBalance = event.params._voiceCreditBalance

  let fundingRound = FundingRound.load(fundingRoundId)
  if (fundingRound == null) {
    log.error('Error: handleSignUp failed, fundingRound not registered', [])
    return
  }

  publicKey.fundingRound = fundingRoundId
  publicKey.save()

  log.info('SignUp', [])
}

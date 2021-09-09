import { log } from '@graphprotocol/graph-ts'
import {
  OwnershipTransferred,
  SetBrightIdSettings,
  Sponsor,
} from '../generated/templates/BrightIdUserRegistry/BrightIdUserRegistry'

import { BrightIdUserRegistry as BrightIdUserRegistryContract } from '../generated/templates/BrightIdUserRegistry/BrightIdUserRegistry'

import { Contributor } from '../generated/schema'

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

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  log.info('handleOwnershipTransferred', [])
}

export function handleSetBrightIdSettings(event: SetBrightIdSettings): void {
  log.info('handleSetBrightIdSettings', [])
}

export function handleSponsor(event: Sponsor): void {
  log.info('handleSponsor', [])

  //TODO: create contributorRegistry entity here if it does not exist.

  let contributorId = event.params.addr.toHexString()
  let brightIdUserRegistryContract = BrightIdUserRegistryContract.bind(
    event.address
  )

  //DEBT: Retroactively register here as there are no events emitted in registration function
  let contributor = new Contributor(contributorId)
  contributor.verified = brightIdUserRegistryContract.verifications(
    event.params.addr
  ).value1
  contributor.verifiedTimeStamp = brightIdUserRegistryContract
    .verifications(event.params.addr)
    .value0.toString()
  contributor.contributorAddress = event.params.addr
  contributor.contributorRegistry = event.address.toHexString()
  contributor.save()
}

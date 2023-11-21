/**
 * Set the coordinator in ClrFund, create the MACI key if not provided
 *
 * Sample usage:
 *
 *  yarn hardhat set-coordinator --network <network> \
 *    --clrfund <clrfund contract address> \
 *    --coordinator <coordinator ETH address> \
 *    [--coordinator-macisk <coordinator MACI secret key>]
 */

import { task } from 'hardhat/config'
import { PrivKey, Keypair } from '@clrfund/maci-domainobjs'
import { Contract } from 'ethers'

/**
 * Set the coordinator address and maci public key in the funding round factory
 *
 * @param fundingRoundFactory funding round factory contract
 * @param coordinatorAddress
 * @param MaciPrivateKey
 */
async function setCoordinator({
  clrfundContract,
  coordinatorAddress,
  coordinatorMacisk,
}: {
  clrfundContract: Contract
  coordinatorAddress: string
  coordinatorMacisk?: string
  stateFile?: string
}) {
  // Generate or use the passed in coordinator key
  const privKey = coordinatorMacisk
    ? PrivKey.unserialize(coordinatorMacisk)
    : undefined

  const keypair = new Keypair(privKey)
  const coordinatorPubKey = keypair.pubKey
  const SecretKey = keypair.privKey.serialize()
  const PublicKey = keypair.pubKey.serialize()

  const setCoordinatorTx = await clrfundContract.setCoordinator(
    coordinatorAddress,
    coordinatorPubKey.asContractParam()
  )
  await setCoordinatorTx.wait()

  console.log(`Coordinator address: ${coordinatorAddress}`)
  console.log(`SecretKey: ${SecretKey}`)
  console.log(`PublicKey: ${PublicKey}`)
}

task('set-coordinator', 'Set the coordinator address and maci key')
  .addParam('clrfund', 'The funding round factory contract address')
  .addParam('coordinator', 'The coordinator ETH address')
  .addOptionalParam('coordinatorMacisk', 'The coordinator maci secret key')
  .setAction(
    async ({ clrfund, coordinator, coordinatorMacisk }, { ethers }) => {
      const clrfundContract = await ethers.getContractAt('ClrFund', clrfund)

      await setCoordinator({
        clrfundContract,
        coordinatorAddress: coordinator,
        coordinatorMacisk,
      })
    }
  )

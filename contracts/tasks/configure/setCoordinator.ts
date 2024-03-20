/**
 * Set the coordinator in clrfund
 * Usage:
 * hardhat set-coordinator \
 *   --clrfund <clrfund address> \
 *   --coordinator <coordinator wallet address> \
 *   --pubkey <coordinator MACI serialized public key, e.g. macipk.*> \
 *   --network <network>
 */
import { BaseContract } from 'ethers'
import { task } from 'hardhat/config'
import { ClrFund } from '../../typechain-types'
import { PubKey } from '@clrfund/common'

task('set-coordinator', 'Set the Clrfund coordinator')
  .addParam('clrfund', 'The ClrFund contract address')
  .addParam('coordinator', 'The coordinator wallet address')
  .addParam('pubkey', 'The coordinator MACI public key')
  .setAction(async ({ clrfund, coordinator, pubkey }, { ethers }) => {
    const clrfundContract = (await ethers.getContractAt(
      'ClrFund',
      clrfund
    )) as BaseContract as ClrFund

    const coordinatorPubkey = PubKey.deserialize(pubkey)
    const tx = await clrfundContract.setCoordinator(
      coordinator,
      coordinatorPubkey.asContractParam()
    )
    const receipt = await tx.wait()
    if (receipt?.status !== 1) {
      throw new Error('Failed to set coordinator')
    }

    console.log('Set coordinator at tx', tx.hash)
  })

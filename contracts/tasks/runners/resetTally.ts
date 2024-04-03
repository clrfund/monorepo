/**
 * WARNING:
 * This script will create a new instance of the tally contract in the funding round contract
 *
 * Usage:
 * hardhat resetTally --funding-round <fundingRound contract address> --network <network>
 *
 * Note:
 * 1) This script needs to be run by the coordinator
 * 2) It can only be run if the funding round hasn't been finalized
 */
import { task } from 'hardhat/config'
import { getCurrentFundingRoundContract } from '../../utils/contracts'
import { Subtask } from '../helpers/Subtask'

task('reset-tally', 'Reset the tally contract')
  .addParam('clrfund', 'The clrfund contract address')
  .setAction(async ({ clrfund }, hre) => {
    const subtask = Subtask.getInstance(hre)
    subtask.setHre(hre)

    let success = false
    try {
      const [coordinator] = await hre.ethers.getSigners()
      console.log('Coordinator address: ', await coordinator.getAddress())

      const fundingRoundContract = await getCurrentFundingRoundContract(
        clrfund,
        coordinator,
        hre.ethers
      )

      const tx = await fundingRoundContract.resetTally()
      const receipt = await tx.wait()
      if (receipt?.status !== 1) {
        throw new Error('Failed to reset the tally contract')
      }

      subtask.logTransaction(tx)
      success = true
    } catch (err) {
      console.error(
        '\n=========================================================\nERROR:',
        err,
        '\n'
      )
      success = false
    }

    await subtask.finish(success)
  })

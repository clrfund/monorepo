/**
 * Set the coordinator in clrfund
 *
 * Usage:
 * hardhat set-coordinator --network <network>
 *
 * Note:
 * 1) The script will use the signer address as the coordinator address if
 *  it is not configured in the clrfund.coordinator field in the deploy-config.json file (see deploy-config-example.json).
 * 2) Use --clrfund to specify the clrfund address if you do not have the deployed-contracts.json file
 * 3) Make sure that the COORDINATOR_MACISK (the coordinator's MACI private key) is set in the .env file
 */
import { task } from 'hardhat/config'
import { Subtask } from '../helpers/Subtask'
import { ISubtaskParams } from '../helpers/types'

task('set-coordinator', 'Set the Clrfund coordinator')
  .addOptionalParam('clrfund', 'The ClrFund contract address')
  .setAction(async ({ clrfund }, hre) => {
    const subtask = Subtask.getInstance(hre)
    subtask.setHre(hre)

    let success: boolean
    try {
      await subtask.logStart()

      // set incremental to avoid resetting contract de
      const params: ISubtaskParams = {
        verify: false,
        incremental: false,
        clrfund,
      }
      const steps = await subtask.getDeploySteps(['coordinator'], params)

      const skip = 0
      await subtask.runSteps(steps, skip)
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

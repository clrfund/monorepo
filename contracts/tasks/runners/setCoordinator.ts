/**
 * Set the coordinator in clrfund
 * Usage:
 * hardhat set-coordinator \
 *   --clrfund <clrfund address> \
 *   --coordinator <coordinator wallet address> \
 *   --pubkey <coordinator MACI serialized public key, e.g. macipk.*> \
 *   --network <network>
 */
import { task } from 'hardhat/config'
import { Subtask } from '../helpers/Subtask'
import { ISubtaskParams } from '../helpers/types'

task('set-coordinator', 'Set the Clrfund coordinator').setAction(
  async (_, hre) => {
    const subtask = Subtask.getInstance(hre)
    subtask.setHre(hre)

    let success: boolean
    try {
      await subtask.logStart()

      // set incremental to avoid resetting contract de
      const params: ISubtaskParams = { verify: false, incremental: false }
      const steps = await subtask.getDeploySteps(['coordinator'], params)

      const skip = params.skip || 0
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
  }
)

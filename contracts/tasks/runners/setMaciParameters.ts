/**
 * Set the zkeys parameters in the MACI factory
 *
 * Sample usage:
 *
 * yarn hardhat set-maci-params --network <network>
 *
 * Make sure you have deploy-config.json (see deploy-config-example.json).
 */

import { task, types } from 'hardhat/config'
import { Subtask } from '../helpers/Subtask'
import { type ISubtaskParams } from '../helpers/types'

task('set-maci-params', 'Set the MACI parameters')
  .addFlag('incremental', 'Incremental deployment')
  .addFlag('strict', 'Fail on warnings')
  .addFlag('verify', 'Verify contracts at Etherscan')
  .addFlag('manageNonce', 'Manually increment nonce for each transaction')
  .addOptionalParam('skip', 'Skip steps with less or equal index', 0, types.int)
  .setAction(async (params: ISubtaskParams, hre) => {
    const { manageNonce } = params
    const subtask = Subtask.getInstance(hre)

    subtask.setHre(hre)
    const deployer = await subtask.getDeployer()

    if (manageNonce) {
      subtask.setNonceManager(deployer)
    }

    let success: boolean
    try {
      await subtask.logStart()
      const steps = await subtask.getDeploySteps(['maciParams'], params)

      const skip = params.skip || 0

      console.log('steps', steps)
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

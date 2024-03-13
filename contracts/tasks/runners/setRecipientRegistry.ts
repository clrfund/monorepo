/* eslint-disable no-console */
/**
 * Deploy a new instance of ClrFund
 *
 * Make sure you have deploy-config.json (see deploy-config-example.json).
 *
 * Sample usage:
 * yarn hardhat new-clrfund --verify --network <network>
 *
 * Note:
 * 1) use --incremental to resume a deployment stopped due to a failure
 * 2) use --manage-nonce to manually set nonce, useful on optimism-sepolia
 *    where `nonce too low` errors occur occasionally
 */
import { task, types } from 'hardhat/config'

import { Subtask } from '../helpers/Subtask'
import { type ISubtaskParams } from '../helpers/types'

task('set-recipient-registry', 'Set recipient registry in ClrFund')
  .addFlag('incremental', 'Incremental deployment')
  .addFlag('strict', 'Fail on warnings')
  .addFlag('verify', 'Verify contracts at Etherscan')
  .addFlag('manageNonce', 'Manually increment nonce for each transaction')
  .addOptionalParam('skip', 'Skip steps with less or equal index', 0, types.int)
  .setAction(async (params: ISubtaskParams, hre) => {
    const { verify, manageNonce } = params
    const subtask = Subtask.getInstance(hre)

    subtask.setHre(hre)
    const deployer = await subtask.getDeployer()

    if (manageNonce) {
      subtask.setNonceManager(deployer)
    }

    let success: boolean
    try {
      await subtask.logStart()
      const steps = await subtask.getDeploySteps(['recipient'], params)

      const skip = params.skip || 0
      await subtask.runSteps(steps, skip)
      await subtask.checkResults(params.strict)
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

    if (verify) {
      console.log('Verify all contracts')
      await hre.run('verify-all')
    }
  })

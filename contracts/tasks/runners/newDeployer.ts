/* eslint-disable no-console */
/**
 * Deploy a new ClrFundDeployer contract
 *
 * Sample usage:
 * yarn hardhat new-deployer --verify --network <network>
 *
 * Note:
 * 1) Make sure you have deploy-config.json (see deploy-config-example.json).
 * 2) Make sure you set environment variable COORDINATOR_MACISK with the coordinator MACI private key
 * 3) use --incremental to resume a deployment stopped due to a failure
 * 4) use --manage-nonce to manually set nonce; useful on optimism-sepolia
 *    where `nonce too low` errors occur occasionally
 */
import { task, types } from 'hardhat/config'

import { Subtask } from '../helpers/Subtask'
import { type ISubtaskParams } from '../helpers/types'

task('new-deployer', 'Deploy a new instance of ClrFund')
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
      await subtask.start(params)
      const steps = await subtask.getDeploySteps(
        ['clrfund', 'deployer', 'maci'],
        params
      )

      const skip = params.skip || 0

      // run all the steps except for the init-clrfund step
      await subtask.runSteps(
        steps.filter((step) => step.taskName !== 'clrfund:init-clrfund'),
        skip
      )
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

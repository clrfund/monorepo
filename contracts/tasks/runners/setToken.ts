/**
 * Set the native token in the ClrFund contract, create a test token
 * if a token address is not configured in the ClrFund.token field in
 * the deploy-config.json file
 *
 * Sample usage:
 * yarn hardhat set-token --network <network>
 *
 * Notes:
 * 1) Make sure you have the deploy-config.json file (see deploy-config-example.json).
 * 2) Use --clrfund <address> to provide the clrfund address if deployed-contracts.json does not exist
 */

import { task, types } from 'hardhat/config'
import { Subtask } from '../helpers/Subtask'
import { type ISubtaskParams } from '../helpers/types'

task('set-token', 'Set the token in ClrFund')
  .addFlag('incremental', 'Incremental deployment')
  .addFlag('strict', 'Fail on warnings')
  .addFlag('verify', 'Verify contracts at Etherscan')
  .addFlag('manageNonce', 'Manually increment nonce for each transaction')
  .addOptionalParam('clrfund', 'The ClrFund contract address')
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
      const steps = await subtask.getDeploySteps(['token'], params)

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

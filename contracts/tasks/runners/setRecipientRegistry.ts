/* eslint-disable no-console */
/**
 * Set the recipient registry in the ClrFund contract. It will create
 * the recipient registry contract if it is not deployed and recorded in the
 * deployed-contract.json file
 *
 * Sample usage:
 * yarn hardhat set-recipient-registry --verify --network <network>
 *
 * Note:
 * 1) use --incremental to resume a previously interrupted deployment
 * 2) use --manage-nonce to manually set the nonce. This is useful on the optimism-sepolia
 *    public node where `nonce too low` errors occur occasionally
 * 3) use --clrfund to provide the clrfund address if you do not have the deployed-contracts.json file
 * 4) Make sure you have the deploy-config.json file (see deploy-config-example.json).
 */
import { task, types } from 'hardhat/config'

import { Subtask } from '../helpers/Subtask'
import { type ISubtaskParams } from '../helpers/types'

task('set-recipient-registry', 'Set recipient registry in ClrFund')
  .addFlag('incremental', 'Incremental deployment')
  .addFlag('strict', 'Fail on warnings')
  .addFlag('verify', 'Verify contracts at Etherscan')
  .addFlag('manageNonce', 'Manually increment nonce for each transaction')
  .addOptionalParam('clrfund', 'The ClrFund contract address')
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

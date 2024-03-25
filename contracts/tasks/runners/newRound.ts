/**
 * Create a new instance of Funding Round
 *
 * Sample usage:
 *  yarn hardhat new-round --round-duration <duration in seconds> --network <network>
 *
 * Note:
 * 1) Make sure you have deploy-config.json (see deploy-config-example.json).
 * 2) Make sure you have deployed-contracts.json created from the new-clrfund task
 */
import { types } from 'hardhat/config'
import { ZERO_ADDRESS } from '../../utils/constants'
import { task } from 'hardhat/config'
import { EContracts } from '../../utils/types'
import { Subtask } from '../helpers/Subtask'
import { ISubtaskParams } from '../helpers/types'
import { ClrFund, FundingRound } from '../../typechain-types'

task('new-round', 'Deploy a new funding round contract')
  .addFlag('verify', 'Verify contracts at Etherscan')
  .addFlag('manageNonce', 'Manually increment nonce for each transaction')
  .addParam(
    'roundDuration',
    'The duration of the funding round in seconds',
    undefined,
    types.int
  )
  .addOptionalParam('clrfund', 'The ClrFund contract address')
  .addOptionalParam('skip', 'Skip steps with less or equal index', 0, types.int)
  .setAction(async (params: ISubtaskParams, hre) => {
    const { verify, manageNonce, roundDuration, clrfund } = params
    const subtask = Subtask.getInstance(hre)

    subtask.setHre(hre)

    if (manageNonce) {
      const signer = await subtask.getDeployer()
      subtask.setNonceManager(signer)
    }

    const deployer = await subtask.getDeployer()

    const clrfundContract = await subtask.getContract<ClrFund>({
      name: EContracts.ClrFund,
      signer: deployer,
      address: clrfund,
    })

    // check if the current round is finalized before starting a new round to avoid revert
    const currentRoundAddress = await clrfundContract.getCurrentRound()
    if (currentRoundAddress !== ZERO_ADDRESS) {
      const currentRound = await subtask.getContract<FundingRound>({
        name: EContracts.FundingRound,
        address: currentRoundAddress,
      })
      const isFinalized = await currentRound.isFinalized()
      if (!isFinalized) {
        throw new Error(
          'Cannot start a new round as the current round is not finalized'
        )
      }
    }

    let success: boolean
    try {
      await subtask.logStart()
      const params: ISubtaskParams = {
        manageNonce,
        verify,
        incremental: false,
        roundDuration,
        clrfund,
      }
      const steps = await subtask.getDeploySteps(['round'], params)

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

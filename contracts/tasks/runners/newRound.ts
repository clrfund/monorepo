/**
 * Create a new instance of Funding Round
 *
 * Sample usage:
 *
 *  yarn hardhat new-round --network <network>
 *
 */
import { ZERO_ADDRESS } from '../../utils/constants'
import { task } from 'hardhat/config'
import { EContracts } from '../../utils/types'
import { ContractStorage } from '../helpers/ContractStorage'
import { Subtask } from '../helpers/Subtask'
import { ISubtaskParams } from '../helpers/types'

task('new-round', 'Deploy a new funding round contract')
  .addFlag('verify', 'Verify contracts at Etherscan')
  .addFlag('manageNonce', 'Manually increment nonce for each transaction')
  .setAction(async ({ verify, manageNonce }: ISubtaskParams, hre) => {
    const subtask = Subtask.getInstance(hre)
    const storage = ContractStorage.getInstance()
    const network = hre.network.name

    subtask.setHre(hre)

    if (manageNonce) {
      const signer = await subtask.getDeployer()
      subtask.setNonceManager(signer)
    }

    const deployer = await subtask.getDeployer()

    const clrfund = storage.mustGetAddress(EContracts.ClrFund, network)
    const clrfundContract = await hre.ethers.getContractAt(
      'ClrFund',
      clrfund,
      deployer
    )

    // check if the current round is finalized before starting a new round to avoid revert
    const currentRoundAddress = await clrfundContract.getCurrentRound()
    if (currentRoundAddress !== ZERO_ADDRESS) {
      const currentRound = await hre.ethers.getContractAt(
        EContracts.FundingRound,
        currentRoundAddress
      )
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
      }
      const steps = await subtask.getDeploySteps(['round'], params)

      const skip = 0
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

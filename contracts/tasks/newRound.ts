/**
 * Create a new instance of the ClrFundDeployer
 *
 * Sample usage:
 *
 *  yarn hardhat new-round \
 *    --network <network> \
 *    --clrfund <clrfund contract address> \
 *    --duration <funding round duration in seconds>
 *
 */
import { task, types } from 'hardhat/config'
import { JSONFile } from '../utils/JSONFile'

task('new-round', 'Deploy a new funding round contract')
  .addParam('clrfund', 'ClrFund contract address')
  .addParam('duration', 'The funding round duration in seconds')
  .addOptionalParam(
    'newBrightid',
    'Create a new BrightId user registry',
    false,
    types.boolean
  )
  .addOptionalParam('context', 'BrightId context')
  .addOptionalParam('verifier', 'BrightId verifier')
  .addOptionalParam('sponsor', 'BrightId sponsor')
  .addOptionalParam('stateFile', 'Save the state information in state file')
  .setAction(
    async (
      { clrfund, duration, newBrightid, context, verifier, sponsor, stateFile },
      { ethers, run }
    ) => {
      const [signer] = await ethers.getSigners()
      console.log(`Deploying from address: ${signer.address}`)

      const clrfundContract = await ethers.getContractAt('ClrFund', clrfund)

      // check if the current round is finalized before starting a new round to avoid revert
      const currentRoundAddress = await clrfundContract.getCurrentRound()
      if (currentRoundAddress !== ethers.constants.AddressZero) {
        const currentRound = await ethers.getContractAt(
          'FundingRound',
          currentRoundAddress
        )
        const isFinalized = await currentRound.isFinalized()
        if (!isFinalized) {
          throw new Error(
            'Cannot start a new round as the current round is not finalized'
          )
        }
      }

      if (newBrightid) {
        await run('set-user-registry', {
          clrfund,
          type: 'brightid',
          sponsor,
          verifier,
          context,
        })
      }

      const tx = await clrfundContract.deployNewRound(duration)
      await tx.wait()
      const fundingRound = await clrfundContract.getCurrentRound()
      console.log('New funding round address: ', fundingRound)

      if (stateFile) {
        const pollId = 0
        const state = { fundingRound, pollId, maciTxHash: tx.hash }
        JSONFile.update(stateFile, state)
      }
      console.log('*******************')
      console.log('Script complete!')
      console.log('*******************')
    }
  )

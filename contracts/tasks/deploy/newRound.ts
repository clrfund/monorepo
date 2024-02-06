/**
 * Create a new instance of the ClrFundDeployer
 *
 * Sample usage:
 *
 *  yarn hardhat new-round \
 *    --clrfund <clrfund contract address> \
 *    --duration <funding round duration in seconds> \
 *    --network <network>
 *
 */
import { JSONFile } from '../../utils/JSONFile'
import { deployUserRegistry } from '../../utils/deployment'
import { ZERO_ADDRESS } from '../../utils/constants'
import { task, types } from 'hardhat/config'
import { EContracts } from '../../utils/types'

task('new-round', 'Deploy a new funding round contract')
  .addParam('clrfund', 'ClrFund contract address')
  .addParam(
    'duration',
    'The funding round duration in seconds',
    undefined,
    types.int
  )
  .addOptionalParam(
    'newBrightid',
    'Create a new BrightId user registry',
    false,
    types.boolean
  )
  .addOptionalParam('context', 'The brightid context for the new user registry')
  .addOptionalParam(
    'verifier',
    'The brightid verifier address for the new user registry'
  )
  .addOptionalParam(
    'sponsor',
    'The brightid sponsor contract address for the new user registry'
  )
  .addOptionalParam(
    'stateFile',
    'File to store the ClrFundDeployer address for e2e testing'
  )
  .setAction(
    async (
      { clrfund, duration, newBrightid, context, verifier, sponsor, stateFile },
      { ethers }
    ) => {
      const [signer] = await ethers.getSigners()
      console.log(`Deploying from address: ${signer.address}`)

      const clrfundContract = await ethers.getContractAt('ClrFund', clrfund)

      // check if the current round is finalized before starting a new round to avoid revert
      const currentRoundAddress = await clrfundContract.getCurrentRound()
      if (currentRoundAddress !== ZERO_ADDRESS) {
        const currentRound = await ethers.getContractAt(
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

      if (newBrightid) {
        const userRegistryType = 'brightid'
        const userRegistryContract = await deployUserRegistry({
          ethers,
          signer,
          userRegistryType,
          brightidContext: context,
          brightidVerifier: verifier,
          brightidSponsor: sponsor,
        })

        const setUserRegistryTx = await clrfundContract.setUserRegistry(
          userRegistryContract.target
        )

        await setUserRegistryTx.wait()
        console.log(
          `New ${userRegistryType} user registry: ${userRegistryContract.target}`
        )
      }

      const tx = await clrfundContract.deployNewRound(duration)
      await tx.wait()
      const fundingRound = await clrfundContract.getCurrentRound()
      console.log('New funding round address: ', fundingRound)

      const fundingRoundContract = await ethers.getContractAt(
        'FundingRound',
        fundingRound
      )

      const maciFactoryAddress = await clrfundContract.maciFactory()
      const coordinatorPubKey = await clrfundContract.coordinatorPubKey()
      const deployPollTx = await fundingRoundContract.deployPoll(
        duration,
        maciFactoryAddress,
        { x: coordinatorPubKey.x, y: coordinatorPubKey.y }
      )
      const deployPollReceipt = await deployPollTx.wait()
      if (deployPollReceipt.status !== 1) {
        throw new Error('Deploy poll failed')
      }

      if (stateFile) {
        const pollId = 0
        const state = { fundingRound, pollId, maciTxHash: tx.hash }
        JSONFile.update(stateFile, state)
      }
    }
  )

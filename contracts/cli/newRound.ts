/**
 * Create a new instance of the ClrFundDeployer
 *
 * Sample usage:
 *
 *  HARDHAT_NETWOR=localhost yarn ts-node cli/newRound.ts \
 *    --clrfund <clrfund contract address> \
 *    --duration <funding round duration in seconds>
 *
 */
import { ethers } from 'hardhat'
import { JSONFile } from '../utils/JSONFile'
import { program } from 'commander'
import { deployUserRegistry } from '../utils/deployment'
import { ZERO_ADDRESS } from '../utils/constants'
import { BaseContract } from 'ethers'
import { ClrFund, FundingRound } from '../typechain-types'

program
  .description('Deploy a new funding round contract')
  .requiredOption('-c --clrfund <clrfund>', 'ClrFund contract address')
  .requiredOption(
    '-d --duration <duration>',
    'The funding round duration in seconds'
  )
  .option(
    '-n --new-brightid <new-brightid>',
    'Create a new BrightId user registry',
    false
  )
  .option(
    '-x --context <context>',
    'The brightid context for the new user registry'
  )
  .option(
    '-v --verifier <verifier>',
    'The brightid verifier address for the new user registry'
  )
  .option(
    '-o --sponsor <sponsor>',
    'The brightid sponsor contract address for the new user registry'
  )
  .option(
    '-t --dry-run',
    'Dry run is only used to estimate gas used, no execution',
    false
  )
  .option(
    '-s --state-file <file>',
    'File to store the ClrFundDeployer address for e2e testing'
  )
  .parse()

async function main(args: any) {
  const {
    clrfund,
    duration,
    newBrightid,
    context,
    verifier,
    sponsor,
    stateFile,
    dryRun,
  } = args

  const [signer] = await ethers.getSigners()
  console.log(`Deploying from address: ${signer.address}`)
  console.log('args', args)

  const clrfundContract = (await ethers.getContractAt(
    'ClrFund',
    clrfund
  )) as BaseContract as ClrFund

  // check if the current round is finalized before starting a new round to avoid revert
  const currentRoundAddress = await clrfundContract.getCurrentRound()
  if (currentRoundAddress !== ZERO_ADDRESS) {
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

  if (newBrightid && !dryRun) {
    const userRegistryContract = await deployUserRegistry({
      ethers,
      signer,
      userRegistryType: 'brighid',
      brightidContext: context,
      brightidVerifier: verifier,
      brightidSponsor: sponsor,
    })

    const setUserRegistryTx = await clrfundContract.setUserRegistry(
      userRegistryContract.target
    )

    await setUserRegistryTx.wait()
    console.log(
      `New ${args.userRegistryType} user registry: ${userRegistryContract.target}`
    )
  }

  if (dryRun) {
    const gas = await clrfundContract.deployNewRound.estimateGas(duration)
    console.log('Estimated gas to deploy new round', gas)
  } else {
    try {
      const newRoundTx = await clrfundContract.deployNewRound(duration)
      const receipt = await newRoundTx.wait()
      if (receipt?.status !== 1) {
        throw new Error(
          'Failed to deploy a new round, gas used' + receipt?.gasUsed.toString()
        )
      }

      const fundingRound = await clrfundContract.getCurrentRound()
      console.log(
        `New funding round deployed at: ${fundingRound}.`,
        `Gas used: ${receipt.gasUsed.toString()}`
      )
      if (stateFile) {
        const pollId = 0
        const state = { fundingRound, pollId, maciTxHash: newRoundTx.hash }
        JSONFile.update(stateFile, state)
      }
    } catch (e) {
      throw new Error(
        'Error deploying a new funding round' + (e as Error).message
      )
    }

    try {
      const fundingRound = await clrfundContract.getCurrentRound()
      const fundingRoundContract = (await ethers.getContractAt(
        'FundingRound',
        fundingRound
      )) as BaseContract as FundingRound

      const maciFactory = await clrfundContract.maciFactory()
      const coordinatorPubKey = await clrfundContract.coordinatorPubKey()
      const tx = await fundingRoundContract.deployPoll(duration, maciFactory, {
        x: coordinatorPubKey.x,
        y: coordinatorPubKey.y,
      })
      const pollReceipt = await tx.wait()
      if (pollReceipt?.status === 1) {
        const pollAddress = await fundingRoundContract.poll()
        console.log(
          `Poll deployed at ${pollAddress}. Gas used:`,
          pollReceipt?.gasUsed.toString()
        )
      } else {
        console.log(
          'Failed to deploy Poll. Gas used:',
          pollReceipt?.gasUsed.toString()
        )
      }
    } catch (e) {
      console.log('Error deploying Poll', e)
    }
  }
}

main(program.opts())
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(-1)
  })

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
  .option('-x --context <context>', 'The brightid context')
  .option('-v --verifier <verifier>', 'The brightid verifier address')
  .option('-o --sponsor <sponsor>', 'The brightid sponsor contract address')
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
  } = args

  const [signer] = await ethers.getSigners()
  console.log(`Deploying from address: ${signer.address}`)
  console.log('args', args)

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
    const userRegistryContract = await deployUserRegistry({
      ethers,
      signer,
      userRegistryType: 'brighid',
      brightidContext: context,
      brightidVerifier: verifier,
      brightidSponsor: sponsor,
    })

    const setUserRegistryTx = await clrfundContract.setUserRegistry(
      userRegistryContract.address
    )

    await setUserRegistryTx.wait()
    console.log(
      `New ${args.userRegistryType} user registry: ${userRegistryContract.address}`
    )
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
}

main(program.opts())
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.error(err)
    process.exit(-1)
  })

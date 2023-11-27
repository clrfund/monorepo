/**
 * Contribute to a funding round. This script is mainly used by e2e testing
 * All the input used by the script comes from the state.json file
 *
 * Sample usage:
 *  HARDHAT_NETWORK=localhost yarn ts-node cli/contribute.ts <state file>
 */

import { JSONFile } from '../utils/JSONFile'
import { Keypair } from '@clrfund/common'

import { UNIT } from '../utils/constants'
import { getEventArg } from '../utils/contracts'
import { program } from 'commander'
import { ethers } from 'hardhat'
import { isPathExist } from '../utils/misc'

program
  .description('Contribute to a funding round')
  .argument('state-file', 'The file to store the state information')
  .parse()

async function main(args: any) {
  const [, , , , , , , , , , , , contributor1, contributor2] =
    await ethers.getSigners()

  const stateFile = args[0]
  if (!isPathExist(stateFile)) {
    throw new Error(`File ${stateFile} not found`)
  }

  const state = JSONFile.read(stateFile)
  const fundingRound = await ethers.getContractAt(
    'FundingRound',
    state.fundingRound
  )
  const tokenAddress = await fundingRound.nativeToken()
  const token = await ethers.getContractAt('AnyOldERC20Token', tokenAddress)
  const maciAddress = await fundingRound.maci()
  const maci = await ethers.getContractAt('MACI', maciAddress)

  const contributionAmount = UNIT.mul(16).div(10)

  state.contributors = {}
  for (const contributor of [contributor1, contributor2]) {
    const contributorAddress = await contributor.getAddress()

    // transfer token to contributor first
    await token.transfer(contributorAddress, contributionAmount)

    const contributorKeypair = new Keypair()
    const tokenAsContributor = token.connect(contributor)
    await tokenAsContributor.approve(fundingRound.address, contributionAmount)

    const fundingRoundAsContributor = fundingRound.connect(contributor)
    const contributionTx = await fundingRoundAsContributor.contribute(
      contributorKeypair.pubKey.asContractParam(),
      contributionAmount
    )
    const stateIndex = await getEventArg(
      contributionTx,
      maci,
      'SignUp',
      '_stateIndex'
    )
    const voiceCredits = await getEventArg(
      contributionTx,
      maci,
      'SignUp',
      '_voiceCreditBalance'
    )
    console.log('saving states')
    state.contributors[contributorAddress] = {
      privKey: contributorKeypair.privKey.serialize(),
      pubKey: contributorKeypair.pubKey.serialize(),
      stateIndex: parseInt(stateIndex),
      voiceCredits: voiceCredits.toString(),
    }
    console.log(
      `Contributor ${contributorAddress} registered. State index: ${stateIndex}. Voice credits: ${voiceCredits.toString()}.`
    )
  }

  // Update state file
  JSONFile.update(stateFile, state)
}

main(program.args)
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(-1)
  })
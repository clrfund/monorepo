/**
 * Topup contribution to a funding round. This script is mainly used by e2e testing
 * All the input used by the script comes from the state.json file
 *
 * Sample usage:
 *  HARDHAT_NETWORK=localhost yarn ts-node cli/topup.ts <state file>
 */

import { JSONFile } from '../utils/JSONFile'

import { UNIT } from '../utils/constants'
import { program } from 'commander'
import { ethers } from 'hardhat'
import { isPathExist } from '../utils/misc'
import type { FundingRound, ERC20 } from '../typechain-types'

program
  .description('Topup contribution')
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

  const topupAmount = (UNIT * BigInt(16)) / BigInt(10)
  let gasUsed: bigint
  for (const contributor of [contributor1, contributor2]) {
    const contributorAddress = await contributor.getAddress()
    const stateIndex = state.contributors[contributorAddress].stateIndex

    // transfer token to contributor first
    try {
      const tx = await token.transfer(contributorAddress, topupAmount)
      const receipt = await tx.wait()
      if (receipt.status !== 1) {
        throw new Error('Failed to transfer tokens to contributor')
      }
    } catch (e) {
      throw new Error('Error with transfer(). ' + (e as Error).message)
    }

    const tokenAsContributor = token.connect(contributor) as ERC20

    try {
      const tx = await tokenAsContributor.approve(
        fundingRound.target,
        topupAmount
      )
      const receipt = await tx.wait()
      if (receipt?.status !== 1) {
        throw new Error('Failed to approve tokens')
      }
      gasUsed = receipt.gasUsed
    } catch (e) {
      throw new Error('Error with approve(). ' + (e as Error).message)
    }

    const fundingRoundAsContributor = fundingRound.connect(
      contributor
    ) as FundingRound

    try {
      const tx = await fundingRoundAsContributor.topup(stateIndex, topupAmount)
      const receipt = await tx.wait()
      if (receipt?.status !== 1) {
        throw new Error('Failed to add more funds')
      }
    } catch (e) {
      throw new Error('Error with topup(). ' + (e as Error).message)
    }

    console.log('saving states')
    const [newAmount] = await fundingRound.contributors(contributorAddress)
    if (BigInt(newAmount) <= BigInt(topupAmount)) {
      throw new Error(
        'Invalid total contribution amount for ' + contributorAddress
      )
    }
    state.contributors[contributorAddress].amount = newAmount
    console.log(
      `Contributor ${contributorAddress} added more funds. ` +
        `State index: ${stateIndex}. Total contribution: ${newAmount.toString()}.` +
        ` Gas used ${gasUsed}.`
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

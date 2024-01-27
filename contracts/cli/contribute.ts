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
import type { FundingRound, ERC20 } from '../typechain-types'
import { BaseContract } from 'ethers'

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
  const token = (await ethers.getContractAt(
    'AnyOldERC20Token',
    tokenAddress
  )) as BaseContract as ERC20
  const maciAddress = await fundingRound.maci()
  const maci = await ethers.getContractAt('MACI', maciAddress)

  const contributionAmount = (UNIT * BigInt(16)) / BigInt(10)

  state.contributors = {}
  for (const contributor of [contributor1, contributor2]) {
    const contributorAddress = await contributor.getAddress()

    // transfer token to contributor first
    const tx = await token.transfer(contributorAddress, contributionAmount)
    const transferReciept = await tx.wait()
    if (transferReciept?.status !== 1) {
      throw new Error('Failed token.transfer()')
    }

    const contributorKeypair = new Keypair()
    const tokenAsContributor = token.connect(contributor) as ERC20
    const approveTx = await tokenAsContributor.approve(
      fundingRound.target,
      contributionAmount
    )
    const approveReceipt = await approveTx.wait()
    if (approveReceipt?.status !== 1) {
      throw new Error('Failed token.approve()')
    }

    const fundingRoundAsContributor = fundingRound.connect(
      contributor
    ) as FundingRound
    const contributionTx = await fundingRoundAsContributor.contribute(
      contributorKeypair.pubKey.asContractParam(),
      contributionAmount
    )
    const receipt = await contributionTx.wait()
    if (receipt?.status !== 1) {
      throw new Error('Failed contribute()')
    }

    const stateIndex = await getEventArg(
      contributionTx,
      maci,
      'SignUp',
      '_stateIndex'
    )
    const amount = await getEventArg(
      contributionTx,
      fundingRound,
      'Contribution',
      '_amount'
    )

    console.log('saving states with amount', amount)
    state.contributors[contributorAddress] = {
      privKey: contributorKeypair.privKey.serialize(),
      pubKey: contributorKeypair.pubKey.serialize(),
      stateIndex: parseInt(stateIndex),
      amount: amount.toString(),
    }

    const totalGasUsed =
      transferReciept.gasUsed + approveReceipt.gasUsed + receipt.gasUsed
    console.log(
      `Contributor ${contributorAddress} registered. State index: ${stateIndex}. Contribution: ${amount}}. ` +
        `Gas used: ${totalGasUsed}`
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

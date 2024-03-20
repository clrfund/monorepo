/**
 * Contribute to a funding round. This script is mainly used by e2e testing
 * All the input used by the script comes from the state.json file
 *
 * Sample usage:
 *  yarn hardhat test-contribute --state-file <state file> --network <network>
 */

import { Keypair } from '@clrfund/common'

import { JSONFile } from '../../utils/JSONFile'
import { UNIT } from '../../utils/constants'
import { getEventArg } from '../../utils/contracts'
import { isPathExist } from '../../utils/misc'
import type { FundingRound, ERC20 } from '../../typechain-types'
import { task } from 'hardhat/config'
import { EContracts } from '../../utils/types'

task('test-contribute', 'Contribute to a funding round')
  .addParam('stateFile', 'The file to store the state information')
  .setAction(async ({ stateFile }, { ethers }) => {
    const [, , , , , , , , , , , , contributor1, contributor2] =
      await ethers.getSigners()

    if (!isPathExist(stateFile)) {
      throw new Error(`File ${stateFile} not found`)
    }

    const state = JSONFile.read(stateFile)
    const fundingRound = await ethers.getContractAt(
      EContracts.FundingRound,
      state.fundingRound
    )
    const tokenAddress = await fundingRound.nativeToken()
    const token = await ethers.getContractAt(
      EContracts.AnyOldERC20Token,
      tokenAddress
    )
    const maciAddress = await fundingRound.maci()
    const maci = await ethers.getContractAt(EContracts.MACI, maciAddress)

    const contributionAmount = (UNIT * BigInt(16)) / BigInt(10)

    state.contributors = {}
    for (const contributor of [contributor1, contributor2]) {
      const contributorAddress = await contributor.getAddress()

      // transfer token to contributor first
      await token.transfer(contributorAddress, contributionAmount)

      const contributorKeypair = new Keypair()
      const tokenAsContributor = token.connect(contributor) as ERC20
      await tokenAsContributor.approve(fundingRound.target, contributionAmount)

      const fundingRoundAsContributor = fundingRound.connect(
        contributor
      ) as FundingRound
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
  })

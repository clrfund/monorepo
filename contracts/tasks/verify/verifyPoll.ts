/**
 * Verifies the Poll contract
 *
 * Sample usage:
 * yarn hardhat verify-poll --address <poll address> --network <network>
 */

import { task } from 'hardhat/config'
import { Contract } from 'ethers'
import { EContracts } from '../../utils/types'

async function getConstructorArguments(pollContract: Contract): Promise<any[]> {
  const [, duration] = await pollContract.getDeployTimeAndDuration()
  const [maxValues, treeDepths, coordinatorPubKey, extContracts] =
    await Promise.all([
      pollContract.maxValues(),
      pollContract.treeDepths(),
      pollContract.coordinatorPubKey(),
      pollContract.extContracts(),
    ])

  const result = [
    duration,
    {
      maxMessages: maxValues.maxMessages,
      maxVoteOptions: maxValues.maxVoteOptions,
    },
    {
      intStateTreeDepth: treeDepths.intStateTreeDepth,
      messageTreeSubDepth: treeDepths.messageTreeSubDepth,
      messageTreeDepth: treeDepths.messageTreeDepth,
      voteOptionTreeDepth: treeDepths.voteOptionTreeDepth,
    },
    {
      x: coordinatorPubKey.x,
      y: coordinatorPubKey.y,
    },
    {
      maci: extContracts.maci,
      messageAq: extContracts.messageAq,
      topupCredit: extContracts.topupCredit,
    },
  ]
  return result
}

task('verify-poll', 'Verify a Poll contract')
  .addParam('address', 'Poll contract address')
  .setAction(async ({ address }, { run, ethers }) => {
    const poll = await ethers.getContractAt(EContracts.Poll, address)

    const constructorArguments = await getConstructorArguments(poll)
    console.log('Constructor arguments', constructorArguments)

    await run('verify:verify', {
      address,
      constructorArguments,
    })
  })

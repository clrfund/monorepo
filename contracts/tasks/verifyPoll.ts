import { task } from 'hardhat/config'
import { Contract } from 'ethers'

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

/**
 * Verifies the Poll contract
 * - it constructs the constructor arguments by querying the Poll contract
 * - it calls the etherscan hardhat plugin to verify the contract
 */
task('verify-poll', 'Verify a Poll contract')
  .addParam('address', 'Poll contract address')
  .setAction(async ({ address }, { run, ethers }) => {
    const poll = await ethers.getContractAt('Poll', address)

    const constructorArguments = await getConstructorArguments(poll)
    console.log('Constructor arguments', constructorArguments)

    await run('verify:verify', {
      address,
      constructorArguments,
    })
  })

import { task } from 'hardhat/config'

/**
 * Verifies the MACI contract
 * - it constructs the constructor arguments by querying the MACI contract
 * - it calls the etherscan hardhat plugin to verify the contract
 */
task('verify-maci', 'Verify a MACI contract')
  .addPositionalParam('maciAddress', 'MACI contract address')
  .setAction(async ({ maciAddress }, { run, ethers }) => {
    const maci = await ethers.getContractAt('MACI', maciAddress)
    const treeDepths = await maci.treeDepths()
    const tallyBatchSize = await maci.tallyBatchSize()
    const messageBatchSize = await maci.messageBatchSize()
    const maxUsers = await maci.maxUsers()
    const maxMessages = await maci.maxMessages()
    const maxVoteOptions = await maci.voteOptionsMaxLeafIndex()
    const signUpGatekeeper = await maci.signUpGatekeeper()
    const batchUstVerifier = await ethers.provider.getStorageAt(maciAddress, 1)
    const qvtVerifier = await ethers.provider.getStorageAt(maciAddress, 2)
    const signUpDurationSeconds = await maci.signUpDurationSeconds()
    const votingDurationSeconds = await maci.votingDurationSeconds()
    const initialVoiceCreditProxy = await maci.initialVoiceCreditProxy()
    const coordinatorAddress = await maci.coordinatorAddress()
    const coordinatorPubKey = await maci.coordinatorPubKey()

    const constructorArguments = [
      {
        stateTreeDepth: treeDepths[0],
        messageTreeDepth: treeDepths[1],
        voteOptionTreeDepth: treeDepths[2],
      },
      { tallyBatchSize, messageBatchSize },
      { maxUsers, maxMessages, maxVoteOptions },
      signUpGatekeeper,
      ethers.utils.hexDataSlice(batchUstVerifier, 12),
      ethers.utils.hexDataSlice(qvtVerifier, 12),
      signUpDurationSeconds,
      votingDurationSeconds,
      initialVoiceCreditProxy,
      { x: coordinatorPubKey.x, y: coordinatorPubKey.y },
      coordinatorAddress,
    ]

    console.log('Verifying the MACI contract', maciAddress)
    console.log('Constructor arguments', constructorArguments)

    await run('verify:verify', {
      address: maciAddress,
      constructorArguments,
    })
  })

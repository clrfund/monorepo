import { ethers, run } from 'hardhat'

async function main() {
  const maciAddress = process.env.MACI_ADDRESS
  if (!maciAddress) {
    throw new Error('The MACI_ADDRESS environment variable is not setup')
  }

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

  console.log('Constructor arguments', constructorArguments)

  await run('verify:verify', {
    address: maciAddress,
    constructorArguments,
  })
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

import { task } from 'hardhat/config'
import { Contract } from 'ethers'

type ProvidedArgs = {
  signupDuration?: string
  votingDuration?: string
}

async function getConstructorArguments(
  maciFactory: Contract,
  provided: ProvidedArgs = {}
): Promise<any[]> {
  const signupPromise = provided.signupDuration
    ? Promise.resolve(provided.signupDuration)
    : maciFactory.signUpDuration()

  const votingPromise = provided.votingDuration
    ? Promise.resolve(provided.votingDuration)
    : maciFactory.votingDuration()

  const [
    treeDepths,
    batchSizes,
    batchUstVerifier,
    qvtVerifier,
    signUpDuration,
    votingDuration,
  ] = await Promise.all([
    maciFactory.treeDepths(),
    maciFactory.batchSizes(),
    maciFactory.batchUstVerifier(),
    maciFactory.qvtVerifier(),
    signupPromise,
    votingPromise,
  ])

  const [stateTreeDepth, messageTreeDepth, voteOptionTreeDepth] = treeDepths
  const [tallyBatchSize, messageBatchSize] = batchSizes

  return [
    stateTreeDepth,
    messageTreeDepth,
    voteOptionTreeDepth,
    tallyBatchSize,
    messageBatchSize,
    batchUstVerifier,
    qvtVerifier,
    signUpDuration,
    votingDuration,
  ]
}

/**
 * Verifies the MACI factory contract
 * - it constructs the constructor arguments by querying the MACI factory contract
 * - it calls the etherscan hardhat plugin to verify the contract
 */
task('verify-maci-factory', 'Verify a MACI factory contract')
  .addParam('address', 'MACI factory contract address')
  .addOptionalParam('signupDuration', 'Signup duration in seconds')
  .addOptionalParam('votingDuration', 'Voting duration in seconds')
  .setAction(
    async ({ address, signupDuration, votingDuration }, { run, ethers }) => {
      const maciFactory = await ethers.getContractAt('MACIFactory', address)

      const constructorArguments = await getConstructorArguments(maciFactory, {
        signupDuration,
        votingDuration,
      })
      console.log('Constructor arguments', constructorArguments)

      await run('verify:verify', {
        address,
        constructorArguments,
      })
    }
  )

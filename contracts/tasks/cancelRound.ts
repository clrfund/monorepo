import { task } from 'hardhat/config'

task('cancel-round', 'Cancel the current round')
  .addParam('factory', 'The funding round factory contract address')
  .setAction(async ({ factory }, { network, ethers }) => {
    const [deployer] = await ethers.getSigners()
    console.log('deployer', deployer.address)
    const fundingRoundFactory = await ethers.getContractAt(
      'FundingRoundFactory',
      factory,
      deployer
    )

    const cancelTx = await fundingRoundFactory.cancelCurrentRound()
    await cancelTx.wait()
    console.log('Cancel transaction hash: ', cancelTx.hash)
  })

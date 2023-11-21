import { task } from 'hardhat/config'

task('cancel-round', 'Cancel the current round')
  .addParam('clrfund', 'The ClrFund contract address')
  .setAction(async ({ clrfund }, { ethers }) => {
    const [deployer] = await ethers.getSigners()
    console.log('deployer', deployer.address)
    const clrfundContract = await ethers.getContractAt(
      'ClrFund',
      clrfund,
      deployer
    )

    const cancelTx = await clrfundContract.cancelCurrentRound()
    await cancelTx.wait()
    console.log('Cancel transaction hash: ', cancelTx.hash)
  })

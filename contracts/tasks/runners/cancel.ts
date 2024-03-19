/**
 * Cancel the current round
 *
 * Sample usage:
 * yarn hardhat cancel-round --clrfund <ClrFund address> --network <network>
 */
import { task } from 'hardhat/config'
import { EContracts } from '../../utils/types'

task('cancel-round', 'Cancel the current round')
  .addParam('clrfund', 'The ClrFund contract address')
  .setAction(async ({ clrfund }, { ethers, network }) => {
    const [deployer] = await ethers.getSigners()
    console.log('deployer', deployer.address)
    console.log('network', network.name)

    const clrfundContract = await ethers.getContractAt(
      EContracts.ClrFund,
      clrfund,
      deployer
    )

    const cancelTx = await clrfundContract.cancelCurrentRound()
    const receipt = await cancelTx.wait()
    if (receipt.status !== 1) {
      throw new Error('Failed to cancel current round')
    }

    console.log('Cancel transaction hash: ', cancelTx.hash)
  })

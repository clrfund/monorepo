/**
 * Cancel the current round
 *
 * Sample usage:
 * yarn hardhat clr-cancel --clrfund <ClrFund address> --network <network>
 */
import { task } from 'hardhat/config'
import { EContracts } from '../utils/types'

task('clr-cancel', 'Cancel the current round')
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
    await cancelTx.wait()
    console.log('Cancel transaction hash: ', cancelTx.hash)
  })

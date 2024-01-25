/**
 * Set the funding round factory in clrfund
 * Usage:
 * hardhat set-round-factory \
 *   --clrfund <clrfund address> \
 *   [--round-factory <funding round factory address>] \
 *   --network <network>
 */
import { BaseContract } from 'ethers'
import { task } from 'hardhat/config'
import { ClrFund } from '../typechain-types'
import { deployContract } from '../utils/deployment'

task(
  'set-round-factory',
  'Set (create if non-existent) the funding round factory address in the ClrFund contract'
)
  .addParam('clrfund', 'The ClrFund contract address')
  .addOptionalParam(
    'roundFactory',
    'The funding round factory contract address'
  )
  .setAction(async ({ clrfund, roundFactory }, { ethers }) => {
    const clrfundContract = (await ethers.getContractAt(
      'ClrFund',
      clrfund
    )) as BaseContract as ClrFund

    let roundFactoryAddress = roundFactory
    if (!roundFactoryAddress) {
      const roundFactoryContract = await deployContract({
        name: 'FundingRoundFactory',
        ethers,
      })
      roundFactoryAddress = roundFactoryContract.target
      console.log('Deployed funding round factory at', roundFactoryAddress)
    }

    const tx = await clrfundContract.setFundingRoundFactory(roundFactoryAddress)
    const receipt = await tx.wait()
    if (receipt?.status !== 1) {
      throw new Error('Failed to set funding round factory')
    }

    console.log('Set funding round factory at tx', tx.hash)
  })

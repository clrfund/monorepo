/**
 * Deploy an instance of the BrightID sponsor contract
 *
 * Sample usage:
 *
 * yarn hardhat new-sponsor --network <network>
 */
import { task } from 'hardhat/config'
import { EContracts } from '../../utils/types'

task('new-sponsor', 'Deploy the BrightID sponsor contract').setAction(
  async (_, { ethers }) => {
    const SponsorContract = await ethers.getContractFactory(
      EContracts.BrightIdSponsor
    )
    const sponsor = await SponsorContract.deploy()
    // wait for the contract to be deployed to the network
    await sponsor.waitForDeployment()
    console.log('Deployed the sponsor contract at', sponsor.target)
  }
)

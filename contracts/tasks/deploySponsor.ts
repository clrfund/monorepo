import { task } from 'hardhat/config'

task('deploy-sponsor', 'Deploy the BrightID sponsor contract').setAction(
  async (_, { ethers }) => {
    const SponsorContract = await ethers.getContractFactory('BrightIdSponsor')
    const sponsor = await SponsorContract.deploy()
    console.log('Deployed the sponsor contract at', sponsor.address)
  }
)

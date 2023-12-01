/**
 * Deploy an instance of the BrightID sponsor contract
 *
 * Sample usage:
 *
 * HARDHAT_NETWORK=localhost yarn ts-node cli/deploySponsor.ts
 */
import { ethers } from 'hardhat'

async function main() {
  const SponsorContract = await ethers.getContractFactory('BrightIdSponsor')
  const sponsor = await SponsorContract.deploy()
  console.log('Deployed the sponsor contract at', sponsor.address)
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(-1)
  })
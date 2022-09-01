import { ethers } from 'hardhat'

async function main() {
  console.log('**************************************')
  console.log('Deploying a BrightId sponsor contract!')
  console.log('**************************************')

  const [deployer] = await ethers.getSigners()
  console.log('Deployer address', deployer.address)

  const BrightIdSponsor = await ethers.getContractFactory(
    'BrightIdSponsor',
    deployer
  )
  const sponsor = await BrightIdSponsor.deploy()
  console.log('Transaction hash', sponsor.deployTransaction.hash)
  await sponsor.deployTransaction.wait()
  console.log('Sponsor contract', sponsor.address)

  console.log('*******************')
  console.log('Deploy complete!')
  console.log('*******************')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

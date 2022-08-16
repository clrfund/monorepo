import { ethers } from 'hardhat'
import { Contract, utils } from 'ethers'

async function main() {
  console.log('*******************')
  console.log('Deploying a user registry!')
  console.log('*******************')

  if (!process.env.BRIGHTID_USER_REGISTRY) {
    console.error('Missing BRIGHTID_USER_REGISTRY environment variable')
    return
  }
  if (!process.env.BRIGHTID_CONTEXT) {
    console.error('Missing BRIGHTID_CONTEXT environment variable')
    return
  }
  if (!process.env.BRIGHTID_VERIFIER_ADDR) {
    console.error('Missing BRIGHTID_VERIFIER_ADDR environment variable')
    return
  }

  const [deployer] = await ethers.getSigners()
  console.log('deployer.address: ', deployer.address)

  console.log('deploying brightid sponsor contract')
  const BrightIdSponsor = await ethers.getContractFactory(
    'BrightIdSponsor',
    deployer
  )
  const sponsor = await BrightIdSponsor.deploy()
  const receipt = await sponsor.deployTransaction.wait()
  console.log(`Deployed BrightId Sponsor Contract at ${sponsor.address}`)
  console.log('transaction hash', receipt.transactionHash)

  const userRegistry = await ethers.getContractAt(
    'BrightIdUserRegistry',
    process.env.BRIGHTID_USER_REGISTRY
  )
  const tx = await userRegistry.setSettings(
    utils.formatBytes32String(process.env.BRIGHTID_CONTEXT),
    process.env.BRIGHTID_VERIFIER_ADDR,
    sponsor.address
  )
  const settingReceipt = await tx.wait()
  console.log(
    'Set user registry settings at hash',
    settingReceipt.transactionHash
  )

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

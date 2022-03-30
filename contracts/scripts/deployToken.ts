import { ethers } from 'hardhat'
import { UNIT } from '../utils/constants'

async function main() {
  const [deployer] = await ethers.getSigners()

  // Deploy ERC20 token contract
  const Token = await ethers.getContractFactory('AnyOldERC20Token', deployer)
  const tokenInitialSupply = UNIT.mul(1000)
  const token = await Token.deploy(tokenInitialSupply)
  await token.deployTransaction.wait()
  console.log(`Token deployed: ${token.address}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

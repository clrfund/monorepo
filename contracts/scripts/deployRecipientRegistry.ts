import { ethers } from 'hardhat'
import { UNIT } from '../utils/constants'
import { RecipientRegistryFactory } from '../utils/recipient-registry-factory'

/*
 * Deploy a new recipient registry.
 * The following environment variables must be set to run the script
 *
 * RECIPIENT_REGISTRY_TYPE - default is simple, values can be simple, optimistic
 * FUNDING_ROUND_FACTORY_ADDRESS - address of the funding round factory
 * WALLET_PRIVATE_KEY - private key of the account that will fund this transaction
 * JSONRPC_HTTP_URL - URL to connect to the node
 *
 * For example, to run the script on rinkeby network:
 * From the contracts folder:
 *    npx hardhat run --network rinkeby scripts/deployRecipientRegistry.ts
 *
 */
async function main() {
  const recipientRegistryType = process.env.RECIPIENT_REGISTRY_TYPE || 'simple'
  const fundingRoundFactoryAddress = process.env.FUNDING_ROUND_FACTORY_ADDRESS
  let challengePeriodDuration = '0'
  let baseDeposit = '0'

  if (recipientRegistryType === 'optimistic') {
    challengePeriodDuration = process.env.CHALLENGE_PERIOD_IN_SECONDS || '300'
    baseDeposit = process.env.BASE_DEPOSIT || UNIT.div(10).toString()
  }

  if (!fundingRoundFactoryAddress) {
    console.log('Environment variable FUNDING_ROUND_FACTORY_ADDRESS not set')
    return
  }
  const fundingRoundFactory = await ethers.getContractAt(
    'FundingRoundFactory',
    fundingRoundFactoryAddress
  )
  const factoryOwner = await fundingRoundFactory.owner()

  console.log('*******************')
  console.log(`Deploying a new ${recipientRegistryType} recipient registry!`)
  console.log(` challenge period in seconds: ${challengePeriodDuration}`)
  console.log(` baseDeposit: ${baseDeposit}`)
  console.log(` fundingRoundFactoryAddress: ${fundingRoundFactoryAddress}`)
  console.log(` fundingRoundFactoryOwner: ${factoryOwner}`)
  const [deployer] = await ethers.getSigners()

  const recipientRegistry = await RecipientRegistryFactory.deploy(
    recipientRegistryType,
    {
      controller: fundingRoundFactory.address,
      baseDeposit,
      challengePeriodDuration,
    },
    deployer
  )
  console.log(` recipientRegistry address: ${recipientRegistry.address}`)

  const setRecipientRegistryTx = await fundingRoundFactory.setRecipientRegistry(
    recipientRegistry.address
  )

  await setRecipientRegistryTx.wait()
  console.log('*******************')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

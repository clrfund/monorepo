/**
 * Deploy a new recipient registry
 *
 * Sample usage:
 *
 * yarn hardhat deploy-recipient-registry \
 *  --network arbitrum-goerli \
 *  --factory 0x85802c7871e7e778Ec376F097b56BD7299250b8D \
 *  --type optimistic
 */
import { task, types } from 'hardhat/config'
import { Contract } from 'ethers'

// Number.MAX_SAFE_INTEGER - 1
const challengePeriodSeconds = 9007199254740990

task('deploy-recipient-registry', 'Deploy a new recipient registry')
  .addParam('factory', 'The funding round factory contract address')
  .addParam(
    'type',
    'The recipient registry type, e.g. simple, optimistic',
    'optimistic'
  )
  .addOptionalParam(
    'deposit',
    'The base deposit for optimistic recipient registry',
    '0.001'
  )
  .addOptionalParam(
    'challengePeriod',
    'The challenge period in seconds for optimistic recipient registry',
    challengePeriodSeconds,
    types.int
  )
  .setAction(
    async ({ factory, type, deposit, challengePeriod }, { ethers }) => {
      const [deployer] = await ethers.getSigners()
      const fundingRoundFactory = await ethers.getContractAt(
        'FundingRoundFactory',
        factory
      )

      let recipientRegistry: Contract
      if (type === 'simple') {
        const SimpleRecipientRegistry = await ethers.getContractFactory(
          'SimpleRecipientRegistry',
          deployer
        )
        recipientRegistry = await SimpleRecipientRegistry.deploy(
          fundingRoundFactory.address
        )
      } else if (type === 'optimistic') {
        const OptimisticRecipientRegistry = await ethers.getContractFactory(
          'OptimisticRecipientRegistry',
          deployer
        )
        recipientRegistry = await OptimisticRecipientRegistry.deploy(
          ethers.utils.parseUnits(deposit),
          challengePeriod,
          fundingRoundFactory.address
        )
      } else {
        throw new Error('unsupported recipient registry type')
      }

      await recipientRegistry.deployTransaction.wait()
      console.log(`Recipient registry deployed: ${recipientRegistry.address}`)

      const setRecipientRegistryTx =
        await fundingRoundFactory.setRecipientRegistry(
          recipientRegistry.address
        )
      await setRecipientRegistryTx.wait()
      console.log('Done!')
    }
  )

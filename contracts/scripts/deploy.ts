import { ethers } from 'hardhat'
import { Contract } from 'ethers'
import { Keypair } from 'maci-domainobjs'
import { UNIT } from '../utils/constants'
import { deployMaciFactory } from '../utils/deployment'

async function main() {
  const [deployer, coordinator] = await ethers.getSigners();
  const maciFactory = await deployMaciFactory(deployer);
  // Deploy ERC20 token contract
  const Token = await ethers.getContractFactory(
    'AnyOldERC20Token',
    deployer,
  );
  const tokenInitialSupply = UNIT.mul(1000)
  const token = await Token.deploy(tokenInitialSupply)
  const FundingRoundSingleton = await ethers.getContractFactory(
    'FundingRound',
    deployer,
  );

  const FundingRoundFactory = await ethers.getContractFactory(
    'FundingRoundFactory',
    deployer,
  );
  const fundingRoundSingleton = await FundingRoundSingleton.deploy();
  const fundingRoundFactory = await FundingRoundFactory.deploy(
    maciFactory.address,
    fundingRoundSingleton.address
  );
  await fundingRoundFactory.deployed();
  await fundingRoundFactory.setToken(token.address);
  const coordinatorKeyPair = new Keypair()

  await fundingRoundFactory.setCoordinator(
    coordinator.getAddress(),
    coordinatorKeyPair.pubKey.asContractParam(),
  )
  await maciFactory.transferOwnership(fundingRoundFactory.address);

  const SimpleUserRegistry = await ethers.getContractFactory(
    'SimpleUserRegistry',
    deployer,
  )
  const userRegistry = await SimpleUserRegistry.deploy()
  await fundingRoundFactory.setUserRegistry(userRegistry.address)

  const recipientRegistryType = process.env.RECIPIENT_REGISTRY_TYPE || 'simple'
  let recipientRegistry: Contract
  if (recipientRegistryType === 'simple') {
    const SimpleRecipientRegistry = await ethers.getContractFactory(
      'SimpleRecipientRegistry',
      deployer,
    )
    recipientRegistry = await SimpleRecipientRegistry.deploy(
      fundingRoundFactory.address,
    )
  } else if (recipientRegistryType === 'optimistic') {
    const OptimisticRecipientRegistry = await ethers.getContractFactory(
      'OptimisticRecipientRegistry',
      deployer,
    )
    recipientRegistry = await OptimisticRecipientRegistry.deploy(
      UNIT.div(1000),
      0,
      fundingRoundFactory.address,
    )
  } else {
    throw new Error('unsupported recipient registry type')
  }
  await fundingRoundFactory.setRecipientRegistry(recipientRegistry.address)
  await fundingRoundFactory.deployNewRound();
  const fundingRoundAddress = await fundingRoundFactory.getCurrentRound()
  console.log(`Funding round deployed: ${fundingRoundAddress}`)
  console.log(`Factory deployed: ${fundingRoundFactory.address}`)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

import { ethers } from '@nomiclabs/buidler'

import { deployMaciFactory } from '../utils/deployment'

async function main() {
  const [deployer] = await ethers.getSigners();
  const maciFactory = await deployMaciFactory(deployer);

  const FundingRoundFactory = await ethers.getContractFactory(
    'FundingRoundFactory',
    deployer,
  );
  const fundingRoundFactory = await FundingRoundFactory.deploy(
    maciFactory.address,
  );
  await fundingRoundFactory.deployed();
  await maciFactory.transferOwnership(fundingRoundFactory.address);

  const SimpleUserRegistry = await ethers.getContractFactory(
    'SimpleUserRegistry',
    deployer,
  )
  const userRegistry = await SimpleUserRegistry.deploy()
  await fundingRoundFactory.setUserRegistry(userRegistry.address)

  const SimpleRecipientRegistry = await ethers.getContractFactory(
    'SimpleRecipientRegistry',
    deployer,
  )
  const recipientRegistry = await SimpleRecipientRegistry.deploy(
    fundingRoundFactory.address,
  )
  await fundingRoundFactory.setRecipientRegistry(recipientRegistry.address)

  console.log(`Factory deployed: ${fundingRoundFactory.address}`)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

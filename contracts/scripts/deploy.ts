import { ethers } from "@nomiclabs/buidler";

import { deployMaciFactory } from './helpers';

async function main() {
  const [deployer] = await ethers.getSigners();
  const maciFactory = await deployMaciFactory(deployer);

  const FundingRoundFactory = await ethers.getContractFactory(
    'FundingRoundFactory',
    deployer,
  );

  // If we had constructor arguments, they would be passed into deploy()
  let firstCoordinator;
  try {
    firstCoordinator = await ethers.provider.resolveName('vitalik.eth')
  }
  catch {
    firstCoordinator = "0x81aaA9a7a8358cC2971B9b8dE72aCCe6d7862BC8"; 
  }
  const fundingRoundFactory = await FundingRoundFactory.deploy(
    maciFactory.address,
  );

  // The address that the Contract WILL have once mined
  console.log(fundingRoundFactory.address);

  // The transaction that was sent to the network to deploy the Contract
  console.log(fundingRoundFactory.deployTransaction.hash);

  // The contract is NOT deployed yet; we must wait until it is mined
  await fundingRoundFactory.deployed();

  await maciFactory.transferOwnership(fundingRoundFactory.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

import { ethers } from '@nomiclabs/buidler';

async function main() {
  // We're hardcoding factory address due to a buidler limitation:
  // https://github.com/nomiclabs/buidler/issues/651
  const factoryAddress = '0x3619DbE27d7c1e7E91aA738697Ae7Bc5FC3eACA5';
  const [deployer, coordinator, poolContributor, recipient1, recipient2] = await ethers.getSigners();

  // Deploy ERC20 token contract
  const Token = await ethers.getContractFactory(
    'AnyOldERC20Token',
    deployer,
  );
  const tokenInitialSupply = 10000000000;
  const token = await Token.deploy(tokenInitialSupply);
  await token.transfer(poolContributor.getAddress(), tokenInitialSupply / 10);

  // Configure factory
  const factory = await ethers.getContractAt(
    'FundingRoundFactory',
    factoryAddress,
  );
  await factory.setToken(token.address);
  await factory.setCoordinator(coordinator.getAddress(), { x: 0, y: 0 });

  // Add to matching pool
  const poolContributionAmount = 1000;
  const poolContributorToken = token.connect(poolContributor);
  await poolContributorToken.approve(factory.address, poolContributionAmount);
  const poolContributorFactory = factory.connect(poolContributor);
  await poolContributorFactory.contribute(poolContributionAmount);

  // Add dummy recipients
  const metadataRecipient1 = { name: "Recipient 1", description: "Description 1", imageHash: "Ipfs imageHash 1" };
  const metadataRecipient2 = { name: "Recipient 2", description: "Description 2", imageHash: "Ipfs imageHash 2" };
  await factory.addRecipient(recipient1.getAddress(), JSON.stringify(metadataRecipient1));
  await factory.addRecipient(recipient2.getAddress(), JSON.stringify(metadataRecipient2));

  // Deploy new funding round and MACI
  await factory.deployNewRound();
  await factory.deployMaci();
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

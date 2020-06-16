import { ethers } from '@nomiclabs/buidler';

async function main() {
  // We're hardcoding factory address due to a buidler limitation:
  // https://github.com/nomiclabs/buidler/issues/651
  const factoryAddress = '0x1A1FEe7EeD918BD762173e4dc5EfDB8a78C924A8';
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
  await factory.addRecipient(recipient1.getAddress(), 'Recipient 1');
  await factory.addRecipient(recipient2.getAddress(), 'Recipient 2');

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

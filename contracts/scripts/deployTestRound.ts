import fs from 'fs'
import { ethers } from '@nomiclabs/buidler';
import { Keypair } from 'maci-domainobjs'

import { MaciParameters } from '../tests/utils'

async function main() {
  // We're hardcoding factory address due to a buidler limitation:
  // https://github.com/nomiclabs/buidler/issues/651
  const factoryAddress = '0x3619DbE27d7c1e7E91aA738697Ae7Bc5FC3eACA5';
  const [
    deployer,
    coordinator,
    poolContributor,
    recipient1,
    recipient2,
    contributor1,
    contributor2,
  ] = await ethers.getSigners()

  // Deploy ERC20 token contract
  const Token = await ethers.getContractFactory(
    'AnyOldERC20Token',
    deployer,
  );
  const tokenInitialSupply = 1000000
  const token = await Token.deploy(tokenInitialSupply)
  console.log(`Token deployed: ${token.address}`)
  await token.transfer(poolContributor.getAddress(), 100000)
  await token.transfer(contributor1.getAddress(), 100000)
  await token.transfer(contributor2.getAddress(), 100000)

  // Configure factory
  const factory = await ethers.getContractAt(
    'FundingRoundFactory',
    factoryAddress,
  );
  await factory.setToken(token.address);
  const coordinatorKeyPair = new Keypair()
  await factory.setCoordinator(
    coordinator.getAddress(),
    coordinatorKeyPair.pubKey.asContractParam(),
  )
  const maciParameters = new MaciParameters({
    signUpDuration: 300,  // 5 minutes
    votingDuration: 300,
  })
  await factory.setMaciParameters(...maciParameters.values())

  // Add to matching pool
  const poolContributionAmount = 10000
  const poolContributorToken = token.connect(poolContributor);
  await poolContributorToken.approve(factory.address, poolContributionAmount);
  const poolContributorFactory = factory.connect(poolContributor);
  await poolContributorFactory.contribute(poolContributionAmount);

  // Add contributors
  await factory.addUser(contributor1.getAddress())
  await factory.addUser(contributor2.getAddress())

  // Add dummy recipients
  await factory.addRecipient(recipient1.getAddress(), 'Recipient 1');
  await factory.addRecipient(recipient2.getAddress(), 'Recipient 2');

  // Deploy new funding round and MACI
  await factory.deployNewRound();
  const fundingRoundAddress = await factory.getCurrentRound()
  console.log(`Funding round deployed: ${fundingRoundAddress}`)
  const fundingRound = await ethers.getContractAt(
    'FundingRound',
    fundingRoundAddress,
  )
  await factory.deployMaci();
  const maciAddress = await fundingRound.maci()
  console.log(`MACI deployed: ${maciAddress}`)

  // Save the current state of the round
  fs.writeFileSync('state.json', JSON.stringify({
    factory: factory.address,
    fundingRound: fundingRoundAddress,
    coordinator: {
      privKey: coordinatorKeyPair.privKey.serialize(),
      pubKey: coordinatorKeyPair.pubKey.serialize(),
    },
  }))
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

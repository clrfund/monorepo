import { ethers, waffle } from '@nomiclabs/buidler';
import { use, expect } from 'chai';
import { solidity } from 'ethereum-waffle'
import { Contract } from 'ethers';
import { genRandomSalt } from 'maci-crypto'
import { Keypair } from 'maci-domainobjs';

import MACIArtifact from '../build/contracts/MACI.json'
import { ZERO_ADDRESS, UNIT } from '../utils/constants'
import { getGasUsage, getEventArg } from '../utils/contracts'
import { deployMaciFactory } from '../utils/deployment'
import { MaciParameters } from '../utils/maci'

use(solidity);

describe('Funding Round Factory', () => {
  const provider = waffle.provider;
  const [, deployer, coordinator, contributor, recipient] = provider.getWallets()

  let maciFactory: Contract;
  let factory: Contract;
  let token: Contract;
  let maciParameters: MaciParameters
  const coordinatorPubKey = (new Keypair()).pubKey.asContractParam()

  beforeEach(async () => {
    maciFactory = await deployMaciFactory(deployer);
    maciParameters = await MaciParameters.read(maciFactory)

    const SimpleUserRegistry = await ethers.getContractFactory('SimpleUserRegistry', deployer)
    const verifiedUserRegistry = await SimpleUserRegistry.deploy()

    const FundingRoundFactory = await ethers.getContractFactory('FundingRoundFactory', deployer)
    factory = await FundingRoundFactory.deploy(
      maciFactory.address,
      verifiedUserRegistry.address,
    )

    expect(factory.address).to.properAddress;
    expect(await getGasUsage(factory.deployTransaction)).lessThan(5100000)
    await maciFactory.transferOwnership(factory.address);

    // Deploy token contract and transfer tokens to contributor
    const tokenInitialSupply = UNIT.mul(1000)
    const Token = await ethers.getContractFactory('AnyOldERC20Token', deployer)
    token = await Token.deploy(tokenInitialSupply)
    expect(token.address).to.properAddress;
    await token.transfer(contributor.address, tokenInitialSupply);
  });

  it('transfers ownership to another address', async () => {
    await expect(factory.transferOwnership(coordinator.address))
      .to.emit(factory, 'OwnershipTransferred')
      .withArgs(deployer.address, coordinator.address)
  })

  describe('contributing to matching pool', () => {
    const contributionAmount = UNIT.mul(10)

    it('allows user to contribute to matching pool', async () => {
      await factory.setToken(token.address);
      const tokenAsContributor = token.connect(contributor);
      await tokenAsContributor.approve(
        factory.address,
        contributionAmount,
      );
      const factoryAsContributor = factory.connect(contributor);
      await expect(factoryAsContributor.contributeMatchingFunds(contributionAmount))
        .to.emit(factory, 'MatchingPoolContribution')
        .withArgs(contributor.address, contributionAmount);
      expect(await token.balanceOf(factory.address)).to.equal(contributionAmount);
    });

    it('rejects contribution if token address is not set', async () => {
      const tokenAsContributor = token.connect(contributor);
      await tokenAsContributor.approve(
        factory.address,
        contributionAmount,
      );
      const factoryAsContributor = factory.connect(contributor);
      await expect(factoryAsContributor.contributeMatchingFunds(contributionAmount))
        .to.be.revertedWith('Factory: Native token is not set');
    });

    it('requires approval', async () => {
      await factory.setToken(token.address);
      const factoryAsContributor = factory.connect(contributor);
      await expect(factoryAsContributor.contributeMatchingFunds(contributionAmount))
        .to.be.revertedWith('revert ERC20: transfer amount exceeds allowance');
    });
  });

  describe('managing recipients', () => {
    let recipientAddress: string
    let metadata: string;
    beforeEach(() => {
      recipientAddress = recipient.address
      metadata = JSON.stringify({ name: 'Recipient', description: 'Description', imageHash: 'Ipfs imageHash' })
    });

    async function getCurrentBlockNumber(): Promise<number> {
      return (await provider.getBlock('latest')).number
    }

    it('allows owner to add recipient', async () => {
      await expect(factory.addRecipient(recipientAddress, metadata))
        .to.emit(factory, 'RecipientAdded')
        .withArgs(recipientAddress, metadata, 1)
      const blockNumber = await getCurrentBlockNumber()
      expect(await factory.getRecipientIndex(recipientAddress, blockNumber)).to.equal(1)

      const anotherRecipientAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
      // Should increase recipient index for every new recipient
      await expect(factory.addRecipient(anotherRecipientAddress, metadata))
        .to.emit(factory, 'RecipientAdded')
        .withArgs(anotherRecipientAddress, metadata, 2)
    });

    it('rejects attempts to add recipient from anyone except owner', async () => {
      const factoryAsContributor = factory.connect(contributor)
      await expect(factoryAsContributor.addRecipient(recipientAddress, metadata))
        .to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('should not accept zero-address as recipient address', async () => {
      recipientAddress = ZERO_ADDRESS
      await expect(factory.addRecipient(recipientAddress, metadata))
        .to.be.revertedWith('Factory: Recipient address is zero');
    });

    it('should not accept empty string as recipient metadata', async () => {
      metadata = ''
      await expect(factory.addRecipient(recipientAddress, metadata))
        .to.be.revertedWith('Factory: Metadata info is empty string');
    });

    it('should not add already registered recipient', async () => {
      await factory.addRecipient(recipientAddress, metadata)
      metadata = JSON.stringify({ name: 'Recipient 2', description: 'Description 2', imageHash: 'Ipfs imageHash 2' })
      await expect(factory.addRecipient(recipientAddress, metadata))
        .to.be.revertedWith('Factory: Recipient already registered');
    });

    it('should limit the number of recipients', async () => {
      const maxRecipientCount = 5 ** maciParameters.voteOptionTreeDepth - 1;
      let recipientName;
      for (let i = 0; i < maxRecipientCount + 1; i++) {
        recipientName = String(i + 1).padStart(4, '0')
        metadata = JSON.stringify({ name: recipientName, description: 'Description', imageHash: 'Ipfs imageHash' })
        recipientAddress = `0x000000000000000000000000000000000000${recipientName}`
        if (i < maxRecipientCount) {
          await factory.addRecipient(recipientAddress, metadata)
        } else {
          await expect(factory.addRecipient(recipientAddress, metadata))
            .to.be.revertedWith('Factory: Recipient limit reached');
        }
      }
    });

    it('allows owner to remove recipient', async () => {
      await factory.addRecipient(recipientAddress, metadata)
      await expect(factory.removeRecipient(recipientAddress))
        .to.emit(factory, 'RecipientRemoved')
        .withArgs(recipientAddress)
      const blockNumber = await getCurrentBlockNumber()
      expect(await factory.getRecipientIndex(recipientAddress, blockNumber)).to.equal(0)
    })

    it('rejects attempts to remove recipient from anyone except owner', async () => {
      const factoryAsContributor = factory.connect(contributor)
      await expect(factoryAsContributor.removeRecipient(recipientAddress))
        .to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('should not remove already removed recipient', async () => {
      await factory.addRecipient(recipientAddress, metadata)
      await factory.removeRecipient(recipientAddress)
      await expect(factory.removeRecipient(recipientAddress))
        .to.be.revertedWith('Factory: Recipient already removed')
    })

    it('should not return recipient index for unregistered recipient', async () => {
      recipientAddress = ZERO_ADDRESS
      const blockNumber = await getCurrentBlockNumber()
      expect(await factory.getRecipientIndex(recipientAddress, blockNumber)).to.equal(0)
    })

    it('should not return recipient index for recipient that has been added after given timestamp', async () => {
      const timestamp = await getCurrentBlockNumber()
      await provider.send('evm_increaseTime', [1000])
      await factory.addRecipient(recipientAddress, metadata)
      expect(await factory.getRecipientIndex(recipientAddress, timestamp)).to.equal(0)
    })

    it('should return recipient index for recipient that has been removed after given timestamp', async () => {
      await factory.addRecipient(recipientAddress, metadata)
      const addedAt = await getCurrentBlockNumber()
      await provider.send('evm_increaseTime', [1000])
      await factory.removeRecipient(recipientAddress)
      expect(await factory.getRecipientIndex(recipientAddress, addedAt)).to.equal(1)
    })

    it('allows to re-use index of removed recipient', async () => {
      await factory.addRecipient(recipientAddress, metadata)
      const blockNumber1 = await getCurrentBlockNumber()
      await factory.removeRecipient(recipientAddress)
      const otherRecipientAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
      await factory.addRecipient(otherRecipientAddress, metadata)
      const anotherRecipientAddress = '0xef9e07C93b40681F6a63085Cf276aBA3D868Ac6E'
      await factory.addRecipient(anotherRecipientAddress, metadata)
      const blockNumber2 = await getCurrentBlockNumber()

      expect(await factory.getRecipientIndex(recipientAddress, blockNumber1)).to.equal(1)
      expect(await factory.getRecipientIndex(recipientAddress, blockNumber2)).to.equal(0)
      expect(await factory.getRecipientIndex(otherRecipientAddress, blockNumber1)).to.equal(0)
      expect(await factory.getRecipientIndex(otherRecipientAddress, blockNumber2)).to.equal(1)
      expect(await factory.getRecipientIndex(anotherRecipientAddress, blockNumber1)).to.equal(0)
      expect(await factory.getRecipientIndex(anotherRecipientAddress, blockNumber2)).to.equal(2)
    })
  });

  it('sets MACI parameters', async () => {
    await expect(factory.setMaciParameters(...maciParameters.values()))
      .to.emit(maciFactory, 'MaciParametersChanged');
  });

  it('allows only owner to set MACI parameters', async () => {
    const coordinatorFactory = factory.connect(coordinator);
    await expect(coordinatorFactory.setMaciParameters(...maciParameters.values()))
      .to.be.revertedWith('Ownable: caller is not the owner');
  });

  describe('deploying funding round', () => {
    it('deploys funding round', async () => {
      await factory.setToken(token.address);
      await factory.setCoordinator(coordinator.address, coordinatorPubKey);
      const deployed = factory.deployNewRound()
      await expect(deployed).to.emit(factory, 'RoundStarted')
      const deployTx = await deployed
      expect(await getGasUsage(deployTx)).lessThan(9000000)

      const fundingRoundAddress = await factory.getCurrentRound();
      expect(fundingRoundAddress).to.properAddress;
      expect(fundingRoundAddress).to.not.equal(ZERO_ADDRESS);

      const fundingRound = await ethers.getContractAt(
        'FundingRound',
        fundingRoundAddress,
      );
      expect(await fundingRound.owner()).to.equal(factory.address);
      expect(await fundingRound.nativeToken()).to.equal(token.address);

      const maciAddress = await getEventArg(
        deployTx,
        maciFactory,
        'MaciDeployed',
        '_maci',
      )
      expect(await fundingRound.maci()).to.equal(maciAddress)
      const maci = await ethers.getContractAt(MACIArtifact.abi, maciAddress)
      const roundCoordinatorPubKey = await maci.coordinatorPubKey()
      expect(roundCoordinatorPubKey.x).to.equal(coordinatorPubKey.x)
      expect(roundCoordinatorPubKey.y).to.equal(coordinatorPubKey.y)
    });

    it('reverts if native token is not set', async () => {
      await factory.setCoordinator(coordinator.address, coordinatorPubKey);
      await expect(factory.deployNewRound())
        .to.be.revertedWith('Factory: Native token is not set');
    });

    it('reverts if coordinator is not set', async () => {
      await factory.setToken(token.address);
      await expect(factory.deployNewRound())
        .to.be.revertedWith('Factory: No coordinator');
    });

    it('reverts if current round is not finalized', async () => {
      await factory.setToken(token.address);
      await factory.setCoordinator(coordinator.address, coordinatorPubKey);
      await factory.deployNewRound();
      await expect(factory.deployNewRound())
        .to.be.revertedWith('Factory: Current round is not finalized');
    });

    it('deploys new funding round after previous round has been finalized', async () => {
      await factory.setToken(token.address);
      await factory.setCoordinator(coordinator.address, coordinatorPubKey);
      await factory.deployNewRound();
      // Re-set coordinator and cancel current round
      await factory.setCoordinator(coordinator.address, coordinatorPubKey);
      await expect(factory.deployNewRound())
        .to.emit(factory, 'RoundStarted')
    });

    it('only owner can deploy funding round', async () => {
      await factory.setToken(token.address);
      await factory.setCoordinator(coordinator.address, coordinatorPubKey);
      const factoryAsContributor = factory.connect(contributor);
      await expect(factoryAsContributor.deployNewRound())
        .to.be.revertedWith('Ownable: caller is not the owner');
    });
  });

  describe('transferring matching funds', () => {
    const contributionAmount = UNIT.mul(10)
    const totalSpent = UNIT.mul(100)
    const totalSpentSalt = genRandomSalt().toString()

    beforeEach(async () => {
      await factory.setToken(token.address)
      await factory.setCoordinator(coordinator.address, coordinatorPubKey)
      const tokenAsContributor = token.connect(contributor)
      await tokenAsContributor.approve(
        factory.address,
        contributionAmount,
      )
    })

    it('reverts if votes has not been tallied', async () => {
      const factoryAsContributor = factory.connect(contributor);
      await factoryAsContributor.contributeMatchingFunds(contributionAmount)
      await factory.deployNewRound();
      const roundDuration = maciParameters.signUpDuration + maciParameters.votingDuration + 10
      await provider.send('evm_increaseTime', [roundDuration]);
      await expect(factory.transferMatchingFunds(totalSpent, totalSpentSalt))
        .to.be.revertedWith('FundingRound: Votes has not been tallied')
    });

    it('reverts if round has not been deployed', async () => {
      await expect(factory.transferMatchingFunds(totalSpent, totalSpentSalt))
        .to.be.revertedWith('Factory: Funding round has not been deployed');
    });
  });

  it('allows owner to set native token', async () => {
    await expect(factory.setToken(token.address))
      .to.emit(factory, 'TokenChanged')
      .withArgs(token.address);
    expect(await factory.nativeToken()).to.equal(token.address);
  });

  it('only owner can set native token', async () => {
    const factoryAsContributor = factory.connect(contributor);
    await expect(factoryAsContributor.setToken(token.address))
      .to.be.revertedWith('Ownable: caller is not the owner');
  });

  it('allows owner to change coordinator', async () => {
    await expect(factory.setCoordinator(
      coordinator.address,
      coordinatorPubKey,
    ))
      .to.emit(factory, 'CoordinatorChanged')
      .withArgs(coordinator.address);
    expect(await factory.coordinator()).to.eq(coordinator.address);
  });

  it('allows only the owner to set a new coordinator', async () => {
    const factoryAsContributor = factory.connect(contributor);
    await expect(factoryAsContributor.setCoordinator(
      coordinator.address,
      coordinatorPubKey,
    ))
      .to.be.revertedWith('Ownable: caller is not the owner');
  });

  it('allows coordinator to call coordinatorQuit and sets coordinator to null', async () => {
    await factory.setCoordinator(coordinator.address, coordinatorPubKey);
    const factoryAsCoordinator = factory.connect(coordinator);
    await expect(factoryAsCoordinator.coordinatorQuit())
      .to.emit(factory, 'CoordinatorChanged')
      .withArgs(ZERO_ADDRESS);
    expect(await factory.coordinator()).to.equal(ZERO_ADDRESS);
  });

  it('only coordinator can call coordinatorQuit', async () => {
    await factory.setCoordinator(coordinator.address, coordinatorPubKey);
    await expect(factory.coordinatorQuit())
      .to.be.revertedWith('Sender is not the coordinator');
  });

  it('should cancel current round when coordinator is changed', async () => {
    await factory.setToken(token.address);
    await factory.setCoordinator(coordinator.address, coordinatorPubKey);
    await factory.deployNewRound();
    const fundingRoundAddress = await factory.getCurrentRound();
    const fundingRound = await ethers.getContractAt(
      'FundingRound',
      fundingRoundAddress,
    );

    const factoryAsCoordinator = factory.connect(coordinator);
    await expect(factoryAsCoordinator.coordinatorQuit())
      .to.emit(factory, 'RoundFinalized')
      .withArgs(fundingRoundAddress);
    expect(await fundingRound.isCancelled()).to.equal(true);
  });
});

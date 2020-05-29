import { waffle } from '@nomiclabs/buidler';
import { use, expect } from 'chai';
import { deployContract, solidity } from 'ethereum-waffle';
import { ethers } from 'ethers';

import { deployMaciFactory } from '../scripts/helpers';
import { getGasUsage } from './utils';

import RoundArtifact from '../build/contracts/FundingRound.json';
import FactoryArtifact from '../build/contracts/FundingRoundFactory.json';
import TokenArtifact from '../build/contracts/AnyOldERC20Token.json';

// import { FundingRoundFactory } from "../build/types/FundingRoundFactory"

// import { Keypair, Command, PubKey, PrivKey } from 'maci/domainobjs/js/index.js';

use(solidity);

describe('Funding Round Factory', () => {
  const provider = waffle.provider;

  const [dontUseMe, deployer, coordinator, contributor] = provider.getWallets();

  let factory: ethers.Contract;
  let token;
  let tokenContractAsContributor;

  beforeEach(async () => {
    const maciFactory = await deployMaciFactory(deployer);

    factory = await deployContract(deployer, FactoryArtifact, [
      maciFactory.address,
      coordinator.address,
    ]);

    expect(factory.address).to.properAddress;
    expect(await getGasUsage(factory.deployTransaction)).lessThan(4000000);
    await maciFactory.transferOwnership(factory.address);

    const initialSupply = '10000000000';

    token = await deployContract(deployer, TokenArtifact, [initialSupply]);

    expect(token.address).to.properAddress;

    // Get a reference to the token contract where msg.sender
    // is the contributor when it interacts with that contract
    tokenContractAsContributor = token.connect(contributor);

    // const contractImApproving = await factory.currentRound();
    // console.log({ contractImApproving });
    // const amountToApprove = '100000';

    // Send this tx as the contributor
    // await tokenContractAsContributor.approve(
    //   contractImApproving,
    //   amountToApprove
    // );
    // console.log('Approved');
  });

  describe('adding recipients', () => {
    let fundingAddress: string;
    let recipientName: string;
    beforeEach(() => {
      fundingAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
      recipientName = 'test';
    });

    it('allows owner to add recipient', async () => {
      await expect(factory.addRecipient(fundingAddress, recipientName))
        .to.emit(factory, 'RecipientAdded')
        .withArgs(fundingAddress, recipientName);
      expect(await factory.recipients(fundingAddress))
        .to.equal(recipientName);
    });

    it('rejects calls from anyone except owner', async () => {
      const contributorFactory = factory.connect(contributor);
      await expect(contributorFactory.addRecipient(fundingAddress, recipientName))
        .to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('should not accept zero-address', async () => {
      fundingAddress = '0x0000000000000000000000000000000000000000';
      await expect(factory.addRecipient(fundingAddress, recipientName))
        .to.be.revertedWith('Factory: Recipient address is zero');
    });

    it('should not accept empty string as name', async () => {
      recipientName = ''
      await expect(factory.addRecipient(fundingAddress, recipientName))
        .to.be.revertedWith('Factory: Recipient name is empty string');
    });

    it('should not accept already registered address', async () => {
      await factory.addRecipient(fundingAddress, recipientName);
      recipientName = 'test-2';
      await expect(factory.addRecipient(fundingAddress, recipientName))
        .to.be.revertedWith('Factory: Recipient already registered');
    });

    it('should limit the number of recipients', async () => {
      const maxRecipientCount = 16;
      for (var i = 0; i < maxRecipientCount + 1; i++) {
        recipientName = String(i + 1).padStart(4, '0');
        fundingAddress = `0x000000000000000000000000000000000000${recipientName}`;
        if (i < maxRecipientCount) {
          await factory.addRecipient(fundingAddress, recipientName);
        } else {
          await expect(factory.addRecipient(fundingAddress, recipientName))
            .to.be.revertedWith('Factory: Recipient limit reached');
        }
      }
    });
  });

  it('deploys MACI', async () => {
    const signUpDuration = 86400;
    const votingDuration = 86400;
    const coordinatorPubKey = { x: 0, y: 1 };

    const deployTx = await factory.deployMaci(
      signUpDuration,
      votingDuration,
      coordinatorPubKey,
    );
    expect(await getGasUsage(deployTx)).lessThan(6000000);
  });

  it('has new round running', async () => {
    expect(await factory.currentRound()).to.properAddress;
  });

  it('set contract owner/witness/coordinator/round duration correctly', async () => {
    expect(await factory.coordinator()).to.eq(coordinator.address);
  });

  it('allows user to contribute to current round', async () => {
    const contractAddress = await factory.currentRound();
    console.log('About to build contract');
    console.log({ contractAddress });

    const round = new ethers.Contract(
      contractAddress,
      RoundArtifact.abi,
      provider
    );

    // const round = ethers.getContract(
    //   contractAddress,
    //   RoundArtifact.abi,
    //   provider
    // );
    // console.log({ round });

    // const keypair = new Keypair();

    // const { pubKey: rawPubKey, privKey: rawPrivKey } = keypair;
    // const pubKey = new PubKey(rawPubKey);
    // const privKey = new PrivKey(rawPrivKey);
    // console.log({ privKey });
    // console.log({ pubKey });

    // const ecdhSharedKey = Keypair.genEcdhSharedKey(rawPrivKey, rawPubKey);
    // const ecdhSharedKey = Keypair.genEcdhSharedKey(privKey, pubKey);
    // console.log({ ecdhSharedKey });

    //
    // Command params:
    //
    // stateIndex: The unique number starting with 1
    //  = 1
    // newPubKey is your new public key if you changed your keypair.
    //  = Public key from having instantiated keypair thing
    // voteOptionIndex is the user’s vote for a proposal. Proposals are represented by integers starting with 1.  (1-16 for now)
    //  = 1
    // newVoteWeight The **square root** of the amount assigned
    //  = 1
    // Nonce can just be 0 and 1. (old keypair is 0, new keypair is 1).
    //  = 1

    // const command = new Command({
    //   stateIndex: 1,
    //   newPubKey: pubKey,
    //   voteOptionIndex: 1,
    //   newVoteWeight: 1,
    //   nonce: 1
    // });
    // console.log({ command });

    // Encrypt takes args
    // signature: Signature,
    // sharedKey: EcdhSharedKey,
    // const signature = command.sign(privKey);
    // console.log({ signature });
    // const message = command.encrypt(signature, ecdhSharedKey);
    // console.log({ message });

    // contribute args:
    // - uint256[] memory message,
    // - PubKey memory pubKey,
    // - uint256 amount
    // await round.contribute();
  });

  it('allows endRound to be called after round duration', async () => {});

  // it('allows endRound to be called if new coordinator is set', async () => {});

  // it('reverts if endRound is called and round not over or not newCoordinator', async () => {});

  it('deploys new round and sets newRound to updated address when endRound is called', async () => {});

  it('allows only witnesses to call setMaci', async () => {});

  it('set MACI address correctly, and newMaci == true', async () => {});

  // it('reverts if nextRound is called and newMaci != true', async () => {});

  // it('reverts if nextRound is called and coordinator == null', async () => {});

  // TODO: sendFundsToCurrentRound deprecated for `contribute`
  // it('moves funds to current funding round when calling sendFundsToCurrentRound in previous round', async () => {});

  // it('moves funds to current funding round when calling sendFundsToCurrentRound in current round', async () => {});

  it('moves DAI balance of factory to current funding round when calling nextRound', async () => {});

  it('sets currentRound and newMaci correctly when nextRound is called', async () => {});

  // it('allows only the owner to call nextRound', async () => {});

  // it('allows only the owner to set a new coordinator', async () => {});

  // it('ends the round when setCoordinator is called', async () => {});

  // it('allows only the coordinator to call coordinatorQuit and sets coordinator to null', async () => {});

  // it('allows only the witness to call witnessQuit and sets witness to null and newMaci to false', async () => {});

  // it('allows only the owner to call setOwner and sets new owner', async () => {});

  // it('allows only the owner to call setWitness and sets new witness', async () => {});

  // it('allows only the owner to call setRoundDuration and sets new round duration', async () => {});

  it('allows any user to trigger a claim for themselves or others after a round is completed', async () => {
    // recipient receives contributions
    // recipient receives expected contribution amount
  });

  // it('checks that a MACI is valid when donations occur after round duration', async () => {});
});

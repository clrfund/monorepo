import {waffle} from '@nomiclabs/buidler';
import chai from 'chai';
import {deployContract, solidity} from 'ethereum-waffle';

import FactoryArtifact from '../build/contracts/FundingRoundFactory.json';
import {FundingRoundFactory} from '../build/types/FundingRoundFactory';

chai.use(solidity);
const {expect} = chai;

describe('Funding Round Factory', () => {
  const provider = waffle.provider;

  const [wallet] = provider.getWallets();

  let factory: FundingRoundFactory;

  beforeEach(async () => {
    factory = (await deployContract(
      wallet,
      FactoryArtifact
    )) as FundingRoundFactory;

    expect(factory).to.properAddress;
  });

  it('has new round running', async () => {});

  it('set contract owner/witness/coordinator correctly', async () => {});

  it('allows user to contribute to current round', async () => {});

  it('allows endRound to be called after round duration', async () => {});

  it('allows endRound to be called if new coordinator is set', async () => {});

  it('reverts if endRound is called and round not over or not newCoordinator', async () => {});

  it('deploys new round and sets newRound to updated address when endRound is called', async () => {});

  it('allows only witnesses to call setMaci', async () => {});

  it('set MACI address correctly, and newMaci == true', async () => {});

  it('reverts if nextRound is called and newMaci != true', async () => {});

  it('reverts if nextRound is called and coordinator == null', async () => {});

  it('moves funds to current funding round when calling sendFundsToCurrentRound in previous round', async () => {});

  it('moves funds to current funding round when calling sendFundsToCurrentRound in current round', async () => {});

  it('moves DAI balance of factory to current funding round when calling nextRound', async () => {});

  it('sets currentRound and newMaci correctly when nextRound is called', async () => {});

  it('allows only the owner to call nextRound', async () => {});

  it('allows only the owner to set a new coordinator', async () => {});

  it('ends the round when setCoordinator is called', async () => {});

  it('allows only the coordinator to call coordinatorQuit and sets coordinator to null', async () => {});

  it('allows only the witness to call witnessQuit and sets witness to null and newMaci to false', async () => {});

  it('allows only the owner to call setOwner and sets new owner', async () => {});

  it('allows only the owner to call setWitness and sets new witness', async () => {});

  it('allows only the owner to call setRoundDuration and sets new round duration', async () => {});

  it('allows any user to trigger a claim for themselves or others after a round is completed', async () => {
    // recipient receives contributions
    // recipient receives expected contribution amount
  });

  it('checks that a MACI is valid when donations occur after round duration', async () => {});
});

pragma solidity ^0.6.2;

import '@nomiclabs/buidler/console.sol';

import '@openzeppelin/contracts/ownership/Ownable.sol';
import './FundingRound.sol';


// TODO: Import SafeMath

contract FundingRoundFactory is Ownable {
  address public coordinator;
  address public maci;
  address public witness;

  // address private currentRound;
  // address private previousRound;
  FundingRound private currentRound;
  FundingRound private previousRound;

  bool private newMaci;
  bool private previousRoundValid;
  bool private newCoordinatorSet;

  uint256 private duration;
  uint256 private roundEndBlockNumber;

  mapping(address => address) private maciByRound;

  constructor(address _firstCoordinator) public {
    setCoordinator(_firstCoordinator);
    endRound();
  }

  function getCurrentRound() public view returns (FundingRound _currentRound) {
    return currentRound;
  }

  function getPreviousRound()
    public
    view
    returns (FundingRound _previousRound)
  {
    return previousRound;
  }

  function getMaci(address round) public view returns (address _maci) {
    return maciByRound[round];
  }

  // deploy a new contract

  function deployNewRound() internal returns (FundingRound newContract) {
    FundingRound fr = new FundingRound(this);
    // console.log("deployed");
    return fr;
  }

  function endRound() public {
    if (
      block.number >= roundEndBlockNumber ||
      newCoordinatorSet == true ||
      coordinator == address(0)
    ) {
      console.log('Conditional passed');
      FundingRound nextRound = deployNewRound();
      previousRound = currentRound;
      currentRound = nextRound;
      roundEndBlockNumber = block.number + duration; // TODO: Use SafeMath
    } else {
      console.log('Conditional failed');
      revert('Invalid end round conditions');
    }
  }

  // Called every round
  function setMACI(address _maci) public onlyWitness {
    maci = _maci;
    newMaci = true;
  }

  function transferMatchingFunds() public onlyOwner returns (bool allDone) {
    // owner should verify both the MACI and the Coordinators results
    // prior to calling.
    require(coordinator != address(0), 'No coordinator');

    // TODO: Check whther newMaci is true or not

    if (newCoordinatorSet == true) {
      console.log('new coordinator');
      // Set things up for a "redo"
      // Get money out of here and make it a no-op
      // TODO: Send DAI balance of previousRound to currentRound
      newCoordinatorSet = false;
      newMaci = false;
      previousRoundValid = false;
      // emit NewMaciRequired();
      return false; // returning early
    }
    // In a normal scenario, there is a newMaci
    if (newMaci && previousRoundValid) {
      // TODO: Send DAI balance of this to previousRound
      newMaci = false;
      console.log('new maci with valid round');
      return true;
      // emit everything
    } else {
      console.log('else case');
      revert('Invalid conditions for transfer of matching funds');
    }
  }

  // Use `transferOwnership` from Ownable for what you might have expected
  // to be called setOwner based on the other names here

  // DONE:
  function setCoordinator(address _coordinator) public onlyOwner {
    coordinator = _coordinator;
    newCoordinatorSet = true;
    endRound();
  }

  // DONE:
  function setWitness(address _witness) public onlyOwner {
    witness = _witness;
  }

  // DONE:
  function setRoundDuration(uint256 _duration) public onlyOwner {
    duration = _duration;
  }

  // DONE:
  function coordinatorQuit() public onlyCoordinator {
    coordinator = address(0);
    endRound();
  }

  // DONE:
  modifier onlyCoordinator() {
    // Enhancement: Get fancy to handle meta-tx
    // like how OpenZeppelin Ownable does via GSN/Context
    require(msg.sender == coordinator, 'Sender is not the coordinator');
    _;
  }

  // DONE:
  modifier onlyWitness() {
    require(msg.sender == witness, 'Sender is not the witness');
    _;
  }

  // DONE:
  function witnessQuit() public onlyWitness {
    witness = address(0);
    newMaci = false;
  }
}

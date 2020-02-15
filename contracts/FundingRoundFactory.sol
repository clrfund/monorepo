pragma solidity ^0.6.2;

import '@nomiclabs/buidler/console.sol';

import '@openzeppelin/contracts/ownership/Ownable.sol';


contract FundingRoundFactory is Ownable {
  address private coordinator;
  address private maci;
  address private witness;
  bool private newMaci;
  uint256 private duration;

  // Constructor should start a new round

  function endRound() public {
    // if (currentBlock >= roundEnd) || (newCoordinator = TRUE || coordinator = null) {
    // Deploy nextRound contract
    // Address previousRound = currentRound
    // address currentRound = newly deployed round contract
    // }
    // else {
    // revert
    // }
  }

  // Called every round
  function setMACI(address _maci) public {
    // callable by witness
    address maci = _maci;
    bool newMaci = TRUE;
  }

  function nextRound() public onlyOwner {
    // callable by contract owner, who should verify both the MACI and the Coordinators results prior to calling.
    // if coordinator = null revert
    // if newCoordinator = TRUE
    // Send DAI balance of previousRound to currentRound
    // newCoordinator = FALSE
    // newMaci = FALSE
    // return
    // if newMaci = TRUE
    // Send DAI balance of this to previousRound
    // newMaci = FALSE
    // emit everything
    // else
    // revert
  }

  function setOwner(address _owner) {
    require(msg.sender == owner, 'Only owner can set owner');
    // If msg.send = owner
    // owner = _owner
    // Else
    // revert
  }

  function setCoordinator(address _coodinator) onlyOwner {
    coordinator = _coordinator;
    newCoordinator = true;
    endRound();
  }

  function setWitness(address _witness) public onlyOwner {
    witness = _witness;
  }

  function setRoundDuration(uint256 _duration) public onlyOwner {
    duration = _duration;
  }

  function coordinatorQuit() public {
    // Enhancement: Get fancy to handle meta-tx
    // like how OpenZeppelin Ownable does via GSN/Context
    require(msg.sender == coordinator, 'Sender is not the coordinator');
    coordinator = address(0);
    endRound();
  }

  function witnessQuit() {
    require(msg.sender == witness, 'Sender is not the coordinator');
    witness = address(0);
    // newMaci = FALSE
    // Else
    // revert
  }
}

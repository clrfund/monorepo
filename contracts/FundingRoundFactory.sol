pragma solidity ^0.6.2;

import '@nomiclabs/buidler/console.sol';

import '@openzeppelin/contracts/ownership/Ownable.sol';

// TODO: Import SafeMath

contract FundingRoundFactory is Ownable {
    address private coordinator;
    address private maci;
    address private witness;

    address private currentRound;
    address private previousRound;

    bool private newMaci;
    bool private previousRoundValid;
    bool private newCoordinatorSet;

    uint256 private duration;
    uint256 private roundEndBlockNumber;

    mapping(address => address) private maciByRound;

    function getMaci(address round) public view returns (address maci) {
        return maciByRound[round];
    }

    // Constructor should start a new round

    function endRound() public {
        if (
            block.number >= roundEndBlockNumber ||
            newCoordinatorSet == true ||
            coordinator == address(0)
        ) {
            // address memory nextRound = Deploy nextRound contract()
            previousRound = currentRound;
            // currentRound = nextRound;
            roundEndBlockNumber = block.number + duration; // TODO: Use SafeMath
        } else {
            revert();
        }
    }

    // Called every round
    function setMACI(address _maci) public onlyWitness {
        address maci = _maci;
        bool newMaci = true;
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
            // Send DAI balance of previousRound to currentRound
            newCoordinatorSet = false;
            newMaci = false;
            previousRoundValid = false;
            // emit NewMaciRequired();
            return false; // returning early
        }
        if (newMaci && previousRoundValid) {
            // Send DAI balance of this to previousRound
            newMaci = false;
            console.log('new maci with valid round');
            return true;
            // emit everything
        } else {
            console.log('else case');
            revert();
        }
    }

    // Use `transferOwnership` from Ownable for what you might have expected
    // to be called setOwner based on the other names here

    function setCoordinator(address _coordinator) public onlyOwner {
        coordinator = _coordinator;
        newCoordinatorSet = true;
        endRound();
    }

    function setWitness(address _witness) public onlyOwner {
        witness = _witness;
    }

    function setRoundDuration(uint256 _duration) public onlyOwner {
        duration = _duration;
    }

    function coordinatorQuit() public onlyCoordinator {
        coordinator = address(0);
        endRound();
    }

    modifier onlyCoordinator() {
        // Enhancement: Get fancy to handle meta-tx
        // like how OpenZeppelin Ownable does via GSN/Context
        require(msg.sender == coordinator, 'Sender is not the coordinator');
        _;
    }

    modifier onlyWitness() {
        require(msg.sender == witness, 'Sender is not the witness');
        _;
    }

    function witnessQuit() public onlyWitness {
        witness = address(0);
        newMaci = false;
    }
}

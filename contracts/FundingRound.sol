pragma solidity ^0.6.2;

import '@nomiclabs/buidler/console.sol';


// mapping sender address -> encrypted vote
// mapping sender address -> total amount of DAI

contract FundingRound {
  function claimFunds(address recipient) public {
    // Send relative percentage of DAI balance to recipient
  }

  function contribute() public {
    // revert if it's the previous round
    // if this is not the current round
    // Send balance of DAI to current round
    // else
    // revert
  }
}

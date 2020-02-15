pragma solidity ^0.6.2;

import '@nomiclabs/buidler/console.sol';


contract FundingRound {
  function claimFunds(address recipient) public {
    // Send relative percentage of DAI balance to recipient
  }

  function sendFundsToCurrentRound() public {
    // callable only by the Funding Round Factory
    // if this is not the current round
    // Send balance of DAI to current round
    // else
    // revert
  }
}

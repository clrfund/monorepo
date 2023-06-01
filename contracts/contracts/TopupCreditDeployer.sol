// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.10;

import 'maci-contracts/contracts/TopupCredit.sol';

contract TopupCreditDeployer {
  event TopupCreditDeployed(address _topupCredit);

  /**
    * @dev Deploy new TopupCredit instance.
    */
  function deploy(address owner)
    external
    returns (TopupCredit _topupCredit)
  {
    require(owner != address(0), 'Invalid owner');

    _topupCredit = new TopupCredit();
    _topupCredit.transferOwnership(owner);
    
    emit TopupCreditDeployed(address(_topupCredit));
  }
}

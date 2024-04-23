// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.10;

/**
 * @dev a contract that holds common MACI structures
 */
contract MACICommon {
  // MACI tree arity
  uint256 public constant TREE_ARITY = 5;

  /**
   * @dev These are contract factories used to deploy MACI poll processing contracts
   * when creating a new ClrFund funding round.
  */
  struct Factories {
    address pollFactory;
    address tallyFactory;
    // subsidyFactory is not currently used, it's just a place holder here
    address subsidyFactory;
    address messageProcessorFactory;
  }

}
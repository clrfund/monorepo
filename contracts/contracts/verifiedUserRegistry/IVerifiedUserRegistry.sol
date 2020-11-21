// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.6.12;

/**
 * @dev Interface of the registry of verified users.
 */
interface IVerifiedUserRegistry {

  function isVerifiedUser(address _user) external view returns (bool);

}

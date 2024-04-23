// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.10;

/**
 * @dev Interface of the registry of verified users.
 */
interface IUserRegistry {

  function isVerifiedUser(address _user) external view returns (bool);

}

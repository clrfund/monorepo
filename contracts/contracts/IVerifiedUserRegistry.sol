pragma solidity ^0.5.8;
pragma experimental ABIEncoderV2;

/**
 * @dev Interface of the registry of verified users.
 */
interface IVerifiedUserRegistry {

  function addUser(address _user) external;

  function removeUser(address _user) external;

  function isVerifiedUser(address _user) external view returns (bool);

}

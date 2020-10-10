pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

/**
 * @dev Interface of the registry of verified users.
 */
interface IVerifiedUserRegistry {

  function isVerifiedUser(address _user) external view returns (bool);

}

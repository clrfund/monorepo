pragma solidity ^0.5.8;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/ownership/Ownable.sol';

import './IVerifiedUserRegistry.sol';

/**
 * @dev A simple user registry managed by a trusted entity.
 */
contract SimpleUserRegistry is Ownable, IVerifiedUserRegistry {

  mapping(address => bool) private users;

  // Events
  event UserAdded(address indexed _user);
  event UserRemoved(address indexed _user);

  /**
    * @dev Add verified unique user to the registry.
    */
  function addUser(address _user)
    external
    onlyOwner
  {
    require(_user != address(0), 'Factory: User address is zero');
    require(!users[_user], 'Factory: User already verified');
    users[_user] = true;
    emit UserAdded(_user);
  }

  /**
    * @dev Remove user from the registry.
    */
  function removeUser(address _user)
    external
    onlyOwner
  {
    require(users[_user], 'Factory: User is not in the registry');
    delete users[_user];
    emit UserRemoved(_user);
  }

  /**
    * @dev Check if the user is verified.
    */
  function isVerifiedUser(address _user)
    external
    view
    returns (bool)
  {
    return users[_user];
  }

}

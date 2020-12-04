// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.6.12;

import '@openzeppelin/contracts/access/Ownable.sol';

import './IUserRegistry.sol';

/**
 * @dev A simple user registry managed by a trusted entity.
 */
contract SimpleUserRegistry is Ownable, IUserRegistry {

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
    require(_user != address(0), 'UserRegistry: User address is zero');
    require(!users[_user], 'UserRegistry: User already verified');
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
    require(users[_user], 'UserRegistry: User is not in the registry');
    delete users[_user];
    emit UserRemoved(_user);
  }

  /**
    * @dev Check if the user is verified.
    */
  function isVerifiedUser(address _user)
    override
    external
    view
    returns (bool)
  {
    return users[_user];
  }

}

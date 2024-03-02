// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.6.12;

import '@openzeppelin/contracts/access/Ownable.sol';

import './IUserRegistry.sol';

/**
 * @dev A simple user registry managed by a trusted entity.
 */
contract ZupassUserRegistry is Ownable, IUserRegistry {

  mapping(address => bool) private users;
  mapping(uint256 => bool) private semaphoreIds;
  mapping(address => uint256) private userTosemaphoreId;

  // Events
  event UserAdded(address indexed _user, uint256 _semaphoreId);
  event UserRemoved(address indexed _user);

  /**
    * @dev Add verified unique user to the registry.
    */
  function addUser(address _user, uint256 _semaphoreId)
    external
    onlyOwner
  {
    require(_user != address(0), 'UserRegistry: User address is zero');
    require(!users[_user], 'UserRegistry: User already verified');
    users[_user] = true;
    semaphoreIds[_semaphoreId] = true;
    userTosemaphoreId[_user] = _semaphoreId;
    emit UserAdded(_user, _semaphoreId);
  }

  /**
    * @dev Remove user from the registry.
    */
  function removeUser(address _user)
    external
    onlyOwner
  {
    require(users[_user], 'UserRegistry: User is not in the registry');
    uint256 _semaphoreId = userTosemaphoreId[_user];
    delete users[_user];
    delete semaphoreIds[_semaphoreId];
    delete userTosemaphoreId[_user];
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

  /**
    * @dev Check if the semaphore Id is verified.
    */
  function isVerifiedSemaphoreId(uint256 _semaphoreId)
    override
    external
    view
    returns (bool)
  {
    return semaphoreIds[_semaphoreId];
  }

}

// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.6.12;

import '@openzeppelin/contracts/access/Ownable.sol';

import './BaseRecipientRegistry.sol';

/**
 * @dev A simple recipient registry managed by a trusted entity.
 */
contract SimpleRecipientRegistry is Ownable, BaseRecipientRegistry {

  // Events
  event RecipientAdded(bytes32 indexed _recipientId, address _recipient, string _metadata, uint256 _index);
  event RecipientRemoved(bytes32 indexed _recipientId);

  /**
    * @dev Deploy the registry.
    * @param _controller Controller address. Normally it's a funding round factory contract.
    */
  constructor(
    address _controller
  )
    public
  {
    controller = _controller;
  }

  /**
    * @dev Register recipient as eligible for funding allocation.
    * @param _recipient The address that receives funds.
    * @param _metadata The metadata info of the recipient.
    */
  function addRecipient(address _recipient, string calldata _metadata)
    external
    onlyOwner
  {
    require(_recipient != address(0), 'RecipientRegistry: Recipient address is zero');
    require(bytes(_metadata).length != 0, 'RecipientRegistry: Metadata info is empty string');
    bytes32 recipientId = keccak256(abi.encodePacked(_recipient, _metadata));
    uint256 recipientIndex = _addRecipient(recipientId, _recipient);
    emit RecipientAdded(recipientId, _recipient, _metadata, recipientIndex);
  }

  /**
    * @dev Remove recipient from the registry.
    * @param _recipientId The ID of recipient.
    */
  function removeRecipient(bytes32 _recipientId)
    external
    onlyOwner
  {
    _removeRecipient(_recipientId);
    emit RecipientRemoved(_recipientId);
  }
}

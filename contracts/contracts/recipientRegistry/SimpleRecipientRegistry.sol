// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.6.12;

import '@openzeppelin/contracts/access/Ownable.sol';

import './IRecipientRegistry.sol';

/**
 * @dev A simple recipient registry managed by a trusted entity.
 */
contract SimpleRecipientRegistry is Ownable, IRecipientRegistry {

  // Structs
  struct Recipient {
    address addr;
    uint256 index;
    uint256 addedAt;
    uint256 removedAt;
  }

  // State
  address public controller;
  uint256 public maxRecipients;
  mapping(bytes32 => Recipient) private recipients;
  bytes32[] private removed;
  // Slot 0 corresponds to index 1
  // Each slot contains a history of recipients who occupied it
  bytes32[][] private slots;

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
    * @dev Set maximum number of recipients.
    * @param _maxRecipients Maximum number of recipients.
    * @return True if operation is successful.
    */
  function setMaxRecipients(uint256 _maxRecipients)
    override
    external
    returns (bool)
  {
    require(
      _maxRecipients >= maxRecipients,
      'RecipientRegistry: Max number of recipients can not be decreased'
    );
    if (controller != msg.sender) {
      // This allows other clrfund instances to use the registry
      // but only controller can actually increase the limit.
      return false;
    }
    maxRecipients = _maxRecipients;
    return true;
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
    require(maxRecipients > 0, 'RecipientRegistry: Recipient limit is not set');
    require(_recipient != address(0), 'RecipientRegistry: Recipient address is zero');
    require(bytes(_metadata).length != 0, 'RecipientRegistry: Metadata info is empty string');
    bytes32 recipientId = keccak256(abi.encodePacked(_recipient, _metadata));
    require(recipients[recipientId].index == 0, 'RecipientRegistry: Recipient already registered');
    uint256 recipientIndex = 0;
    uint256 nextRecipientIndex = slots.length + 1;
    if (nextRecipientIndex <= maxRecipients) {
      // Assign next index in sequence
      recipientIndex = nextRecipientIndex;
      bytes32[] memory history = new bytes32[](1);
      history[0] = recipientId;
      slots.push(history);
    } else {
      // Assign one of the vacant recipient indexes
      require(removed.length > 0, 'RecipientRegistry: Recipient limit reached');
      bytes32 removedRecipient = removed[removed.length - 1];
      removed.pop();
      recipientIndex = recipients[removedRecipient].index;
      slots[recipientIndex - 1].push(recipientId);
    }
    recipients[recipientId] = Recipient(_recipient, recipientIndex, block.number, 0);
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
    require(recipients[_recipientId].index != 0, 'RecipientRegistry: Recipient is not in the registry');
    require(recipients[_recipientId].removedAt == 0, 'RecipientRegistry: Recipient already removed');
    recipients[_recipientId].removedAt = block.number;
    removed.push(_recipientId);
    emit RecipientRemoved(_recipientId);
  }

  /**
    * @dev Get recipient address by index.
    * @param _index Recipient index.
    * @param _startBlock Starting block of the funding round.
    * @param _endBlock Ending block of the funding round.
    * @return Recipient address.
    */
  function getRecipientAddress(
    uint256 _index,
    uint256 _startBlock,
    uint256 _endBlock
  )
    override
    external
    view
    returns (address)
  {
    if (_index == 0 || _index > slots.length) {
      return address(0);
    }
    bytes32[] memory history = slots[_index - 1];
    if (history.length == 0) {
      // Slot is not occupied
      return address(0);
    }
    address prevRecipientAddress = address(0);
    for (uint256 idx = history.length; idx > 0; idx--) {
      bytes32 recipientId = history[idx - 1];
      Recipient memory recipient = recipients[recipientId];
      if (recipient.addedAt > _endBlock) {
        // Recipient added after the end of the funding round, skip
        continue;
      }
      else if (recipient.removedAt != 0 && recipient.removedAt <= _startBlock) {
        // Recipient had been already removed when the round started
        // Stop search because subsequent items were removed even earlier
        return prevRecipientAddress;
      }
      // This recipient is valid, but the recipient who occupied
      // this slot before also needs to be checked.
      prevRecipientAddress = recipient.addr;
    }
    return prevRecipientAddress;
  }
}

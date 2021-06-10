// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.6.12;

import './IRecipientRegistry.sol';

/**
 * @dev Abstract contract containing common methods for recipient registries.
 */
abstract contract BaseRecipientRegistry is IRecipientRegistry {

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
  mapping(bytes32 => Recipient) internal recipients;
  bytes32[] private removed;
  // Slot 0 corresponds to index 1
  // Each slot contains a history of recipients who occupied it
  bytes32[][] private slots;

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
    * @param _recipientId The ID of recipient.
    * @param _recipient The address that receives funds.
    * @return Recipient index.
    */
  function _addRecipient(bytes32 _recipientId, address _recipient)
    internal
    returns (uint256)
  {
    require(maxRecipients > 0, 'RecipientRegistry: Recipient limit is not set');
    require(recipients[_recipientId].index == 0, 'RecipientRegistry: Recipient already registered');
    uint256 recipientIndex = 0;
    uint256 nextRecipientIndex = slots.length + 1;
    if (nextRecipientIndex <= maxRecipients) {
      // Assign next index in sequence
      recipientIndex = nextRecipientIndex;
      bytes32[] memory history = new bytes32[](1);
      history[0] = _recipientId;
      slots.push(history);
    } else {
      // Assign one of the vacant recipient indexes
      require(removed.length > 0, 'RecipientRegistry: Recipient limit reached');
      bytes32 removedRecipient = removed[removed.length - 1];
      removed.pop();
      recipientIndex = recipients[removedRecipient].index;
      slots[recipientIndex - 1].push(_recipientId);
    }
    recipients[_recipientId] = Recipient(_recipient, recipientIndex, block.timestamp, 0);
    return recipientIndex;
  }

  /**
    * @dev Remove recipient from the registry.
    * @param _recipientId The ID of recipient.
    */
  function _removeRecipient(bytes32 _recipientId)
    internal
  {
    require(recipients[_recipientId].index != 0, 'RecipientRegistry: Recipient is not in the registry');
    require(recipients[_recipientId].removedAt == 0, 'RecipientRegistry: Recipient already removed');
    recipients[_recipientId].removedAt = block.timestamp;
    removed.push(_recipientId);
  }

  /**
    * @dev Get recipient address by index.
    * @param _index Recipient index.
    * @param _startTime The start time of the funding round.
    * @param _endTime The end time of the funding round.
    * @return Recipient address.
    */
  function getRecipientAddress(
    uint256 _index,
    uint256 _startTime,
    uint256 _endTime
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
      if (recipient.addedAt > _endTime) {
        // Recipient added after the end of the funding round, skip
        continue;
      }
      else if (recipient.removedAt != 0 && recipient.removedAt <= _startTime) {
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

  /**
    * @dev Get recipient count.
    * @return count of active recipients in the registry.
    */
  function getRecipientCount() public view returns(uint256) {
      return slots.length - removed.length;
  }
}

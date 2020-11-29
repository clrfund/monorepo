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
    uint256 index;
    uint256 addedAt;
    uint256 removedAt;
  }

  // State
  address public controller;
  uint256 public maxRecipients;
  mapping(address => Recipient) private recipients;
  address[] private removed;
  // Slot 0 corresponds to index 1
  // Each slot contains a history of recipients who occupied it
  address[][] private slots;

  // Events
  event RecipientAdded(address indexed _recipient, string _metadata, uint256 _index);
  event RecipientRemoved(address indexed _recipient);

  /**
    * @dev Set controller. Only controller can set the max number of recipients in the registry.
    * @param _controller Controller address. Normally it's a funding round factory contract.
    */
  function setController(address _controller)
    external
    onlyOwner
  {
    require(controller == address(0), 'RecipientRegistry: Controller is already set');
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
    if (controller == address(0)) {
      // If controller is not set, owner can act as one
      require(msg.sender == owner(), 'RecipientRegistry: Only owner can act as a controller');
    } else if (controller != msg.sender) {
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
    require(recipients[_recipient].index == 0, 'RecipientRegistry: Recipient already registered');
    uint256 recipientIndex = 0;
    uint256 nextRecipientIndex = slots.length + 1;
    if (nextRecipientIndex <= maxRecipients) {
      // Assign next index in sequence
      recipientIndex = nextRecipientIndex;
      address[] memory history = new address[](1);
      history[0] = _recipient;
      slots.push(history);
    } else {
      // Assign one of the vacant recipient indexes
      require(removed.length > 0, 'RecipientRegistry: Recipient limit reached');
      address removedRecipient = removed[removed.length - 1];
      removed.pop();
      recipientIndex = recipients[removedRecipient].index;
      slots[recipientIndex - 1].push(_recipient);
    }
    recipients[_recipient] = Recipient(recipientIndex, block.number, 0);
    emit RecipientAdded(_recipient, _metadata, recipientIndex);
  }

  /**
    * @dev Remove recipient from the registry.
    * @param _recipient The address that receives funds.
    */
  function removeRecipient(address _recipient)
    external
    onlyOwner
  {
    require(recipients[_recipient].index != 0, 'RecipientRegistry: Recipient is not in the registry');
    require(recipients[_recipient].removedAt == 0, 'RecipientRegistry: Recipient already removed');
    recipients[_recipient].removedAt = block.number;
    removed.push(_recipient);
    emit RecipientRemoved(_recipient);
  }

  /**
    * @dev Get recipient index by address.
    * @param _recipient Recipient address.
    * @param _startBlock Starting block of the funding round.
    * @param _endBlock Ending block of the funding round.
    */
  function getRecipientIndex(
    address _recipient,
    uint256 _startBlock,
    uint256 _endBlock
  )
    override
    external
    view
    returns (uint256)
  {
    Recipient memory recipient = recipients[_recipient];
    if (
      recipient.index == 0 ||
      recipient.addedAt > _endBlock ||
      recipient.removedAt != 0 && recipient.removedAt <= _startBlock
    ) {
      // Return 0 if recipient is not in the registry
      // or added after the end of the funding round
      // or had been already removed when the round started
      return 0;
    } else {
      address[] memory history = slots[recipient.index - 1];
      // Check recipients who also occupied this slot
      for (uint256 idx = history.length; idx > 0; idx--) {
        address prevRecipient = history[idx - 1];
        if (prevRecipient == _recipient) {
          continue;
        }
        if (recipients[prevRecipient].removedAt > _startBlock) {
          // Previous recipient still participates in the round
          return 0;
        } else {
          // Stop search because subsequent items were removed
          // before than the beginning of the round
          break;
        }
      }
      return recipient.index;
    }
  }

}

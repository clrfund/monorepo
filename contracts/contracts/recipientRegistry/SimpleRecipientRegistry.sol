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
    uint256 prevRemovedAt;
  }

  // State
  address public controller;
  uint256 public maxRecipients;
  uint256 private nextRecipientIndex = 1;
  mapping(address => Recipient) private recipients;
  address[] private removed;

  // Events
  event RecipientAdded(address indexed _recipient, string _metadata, uint256 _index);
  event RecipientRemoved(address indexed _recipient);

  /**
    * @dev Set controller.
    */
  function setController()
    override
    external
  {
    require(controller == address(0), 'RecipientRegistry: Controller is already set');
    controller = msg.sender;
  }

  /**
    * @dev Set maximum number of recipients.
    * @param _maxRecipients Maximum number of recipients.
    */
  function setMaxRecipients(uint256 _maxRecipients)
    override
    external
  {
    require(msg.sender == controller, 'RecipientRegistry: Only controller can increase recipient limit');
    maxRecipients = _maxRecipients;
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
    uint256 prevRemovedAt = 0;
    if (nextRecipientIndex <= maxRecipients) {
      // Assign next index in sequence
      recipientIndex = nextRecipientIndex;
      nextRecipientIndex += 1;
    } else {
      // Assign one of the vacant recipient indexes
      require(removed.length > 0, 'RecipientRegistry: Recipient limit reached');
      Recipient memory removedRecipient = recipients[removed[removed.length - 1]];
      removed.pop();
      recipientIndex = removedRecipient.index;
      prevRemovedAt = removedRecipient.removedAt;
    }
    recipients[_recipient] = Recipient(recipientIndex, block.number, 0, prevRemovedAt);
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
      recipient.removedAt != 0 && recipient.removedAt <= _startBlock ||
      recipient.prevRemovedAt > _startBlock
    ) {
      // Return 0 if recipient is not in the registry
      // or added after the end of the funding round
      // or had been already removed when the round started
      // or inherits index from removed recipient who participates in the round
      return 0;
    } else {
      return recipient.index;
    }
  }

}

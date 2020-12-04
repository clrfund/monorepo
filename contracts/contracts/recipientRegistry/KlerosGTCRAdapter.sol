// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.6.12;

import '@openzeppelin/contracts/access/Ownable.sol';
import 'solidity-rlp/contracts/RLPReader.sol';

import './IRecipientRegistry.sol';
import './IKlerosGTCR.sol';

/**
 * @dev Recipient registry that uses Kleros GTCR to validate recipients.
 */
contract KlerosGTCRAdapter is Ownable, IRecipientRegistry {
  using RLPReader for bytes;
  using RLPReader for RLPReader.RLPItem;

  // Structs
  struct Recipient {
    address addr;
    uint256 index;
    uint256 addedAt;
    uint256 removedAt;
  }

  // Constants
  // As defined in https://github.com/kleros/tcr/blob/v2.0.0/contracts/GeneralizedTCR.sol
  uint256 private constant STATUS_ABSENT = 0;
  uint256 private constant STATUS_REGISTERED = 1;

  // State
  IKlerosGTCR public tcr;
  address public controller;
  uint256 public maxRecipients;
  mapping(bytes32 => Recipient) private recipients;
  bytes32[] private removed;
  // Slot 0 corresponds to index 1
  // Each slot contains a history of recipients who occupied it
  bytes32[][] private slots;

  // Events
  event RecipientAdded(bytes32 indexed _tcrItemId, bytes _metadata, uint256 _index);
  event RecipientRemoved(bytes32 indexed _tcrItemId);

  constructor(IKlerosGTCR _tcr)
    public
  {
    tcr = _tcr;
  }

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
    * @param _tcrItemId The ID of the TCR item.
    */
  function addRecipient(bytes32 _tcrItemId)
    external
  {
    require(maxRecipients > 0, 'RecipientRegistry: Recipient limit is not set');
    (bytes memory rlpData, uint256 status,) = tcr.getItemInfo(_tcrItemId);
    require(status == STATUS_REGISTERED, 'RecipientRegistry: Item not found in TCR');
    require(recipients[_tcrItemId].index == 0, 'RecipientRegistry: Recipient already registered');
    RLPReader.RLPItem[] memory recipientData = rlpData.toRlpItem().toList();
    // Recipient address is at index 1
    address recipientAddress = recipientData[1].toAddress();
    uint256 recipientIndex = 0;
    uint256 nextRecipientIndex = slots.length + 1;
    if (nextRecipientIndex <= maxRecipients) {
      // Assign next index in sequence
      recipientIndex = nextRecipientIndex;
      bytes32[] memory history = new bytes32[](1);
      history[0] = _tcrItemId;
      slots.push(history);
    } else {
      // Assign one of the vacant recipient indexes
      require(removed.length > 0, 'RecipientRegistry: Recipient limit reached');
      bytes32 removedRecipient = removed[removed.length - 1];
      removed.pop();
      recipientIndex = recipients[removedRecipient].index;
      slots[recipientIndex - 1].push(_tcrItemId);
    }
    recipients[_tcrItemId] = Recipient(recipientAddress, recipientIndex, block.number, 0);
    emit RecipientAdded(_tcrItemId, rlpData, recipientIndex);
  }

  /**
    * @dev Remove recipient from the registry.
    * @param _tcrItemId The ID of the TCR item.
    */
  function removeRecipient(bytes32 _tcrItemId)
    external
  {
    require(recipients[_tcrItemId].index != 0, 'RecipientRegistry: Recipient is not in the registry');
    require(recipients[_tcrItemId].removedAt == 0, 'RecipientRegistry: Recipient already removed');
    (,uint256 status,) = tcr.getItemInfo(_tcrItemId);
    require(status == STATUS_ABSENT, 'RecipientRegistry: Item is not removed from TCR');
    recipients[_tcrItemId].removedAt = block.number;
    removed.push(_tcrItemId);
    emit RecipientRemoved(_tcrItemId);
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
      bytes32 tcrItemId = history[idx - 1];
      Recipient memory recipient = recipients[tcrItemId];
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

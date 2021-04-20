// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.6.12;

import 'solidity-rlp/contracts/RLPReader.sol';

import './BaseRecipientRegistry.sol';
import './IKlerosGTCR.sol';

/**
 * @dev Recipient registry that uses Kleros GTCR to validate recipients.
 */
contract KlerosGTCRAdapter is BaseRecipientRegistry {
  using RLPReader for bytes;
  using RLPReader for RLPReader.RLPItem;

  // Constants
  // As defined in https://github.com/kleros/tcr/blob/v2.0.0/contracts/GeneralizedTCR.sol
  uint256 private constant STATUS_ABSENT = 0;
  uint256 private constant STATUS_REGISTERED = 1;

  // State
  IKlerosGTCR public tcr;

  // Events
  event RecipientAdded(
    bytes32 indexed _tcrItemId,
    bytes _metadata,
    uint256 _index,
    uint256 _timestamp
  );
  event RecipientRemoved(
    bytes32 indexed _tcrItemId,
    uint256 _timestamp
  );

  /**
    * @dev Deploy the registry.
    * @param _tcr Address of the Kleros Generalized TCR.
    * @param _controller Controller address. Normally it's a funding round factory contract.
    */
  constructor(
    IKlerosGTCR _tcr,
    address _controller
  )
    public
  {
    tcr = _tcr;
    controller = _controller;
  }

  /**
    * @dev Register recipient as eligible for funding allocation.
    * @param _tcrItemId The ID of the TCR item.
    */
  function addRecipient(bytes32 _tcrItemId)
    external
  {
    (bytes memory rlpData, uint256 status,) = tcr.getItemInfo(_tcrItemId);
    require(status == STATUS_REGISTERED, 'RecipientRegistry: Item not found in TCR');
    RLPReader.RLPItem[] memory recipientData = rlpData.toRlpItem().toList();
    // Recipient address is at index 1
    address recipientAddress = recipientData[1].toAddress();
    uint256 recipientIndex = _addRecipient(_tcrItemId, recipientAddress);
    emit RecipientAdded(_tcrItemId, rlpData, recipientIndex, block.timestamp);
  }

  /**
    * @dev Remove recipient from the registry.
    * @param _tcrItemId The ID of the TCR item.
    */
  function removeRecipient(bytes32 _tcrItemId)
    external
  {
    (,uint256 status,) = tcr.getItemInfo(_tcrItemId);
    require(status == STATUS_ABSENT, 'RecipientRegistry: Item is not removed from TCR');
    _removeRecipient(_tcrItemId);
    emit RecipientRemoved(_tcrItemId, block.timestamp);
  }
}

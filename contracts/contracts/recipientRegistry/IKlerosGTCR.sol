// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.6.12;

/**
 *  @dev Interface for Kleros Generalized TCR.
 */
interface IKlerosGTCR {

  event MetaEvidence(uint256 indexed _metaEvidenceID, string _evidence);

  event ItemSubmitted(
    bytes32 indexed _itemID,
    address indexed _submitter,
    uint indexed _evidenceGroupID,
    bytes _data
  );

  function getItemInfo(bytes32 _itemID) external view returns (bytes memory, uint256, uint256);
}

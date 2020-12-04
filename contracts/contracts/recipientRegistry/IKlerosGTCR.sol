// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.6.12;

/**
 *  @dev Interface for Kleros Generalized TCR.
 */
interface IKlerosGTCR {

  event MetaEvidence(uint256 indexed _metaEvidenceID, string _evidence);

  function getItemInfo(bytes32 _itemID) external view returns (bytes memory, uint256, uint256);
}

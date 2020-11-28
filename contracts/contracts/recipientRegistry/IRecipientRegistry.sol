// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.6.12;

/**
 * @dev Interface of the recipient registry.
 *
 * This contract must do the following:
 *
 * - Add recipients to the registry.
 * - Allow only legitimate recipients into the registry.
 * - Assign an unique index to each recipient.
 * - Limit the maximum number of entries according to a parameter set by the funding round factory.
 * - Remove invalid entries.
 * - Prevent indices from changing during the funding round.
 * - Find index of a recipient by their ID.
 * - Find address of a recipient by their ID.
 */
interface IRecipientRegistry {

  function setMaxRecipients(uint256 _maxRecipients) external returns (bool);

  function getRecipientIndex(bytes32 _recipientId, uint256 _startBlock, uint256 _endBlock) external view returns (uint256);

  function getRecipientAddress(bytes32 _recipientId) external view returns (address);

}

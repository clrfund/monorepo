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
 * - Find the recipient's index by their address.
 * - Limit the maximum number of entries according to a parameter set by the controller.
 * - Remove invalid entries.
 * - Prevent indices from changing during the funding round.
 */
interface IRecipientRegistry {

  event RecipientAdded(address indexed _recipient, string _metadata, uint256 _index);
  event RecipientRemoved(address indexed _recipient);

  function setController() external;

  function setMaxRecipients(uint256 _maxRecipients) external;

  function getRecipientIndex(address _recipient, uint256 _startBlock, uint256 _endBlock) external view returns (uint256);

}

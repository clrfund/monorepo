pragma solidity ^0.5.8;
pragma experimental ABIEncoderV2;

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

  function setController() external;

  function setMaxRecipients(uint256 _maxRecipients) external;

  function addRecipient(address _recipient, string calldata _name) external;

  function removeRecipient(address _recipient) external;

  function getRecipientIndex(address _recipient, uint256 _timestamp) external view returns (uint256);

}

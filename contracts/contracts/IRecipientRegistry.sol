pragma solidity ^0.5.0;
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
 * - Limit the maximum number of entries according to MACI's maxVoteOptions.
 * - (TODO) Remove invalid entries.
 * - (TODO) Prevent indices from changing during the funding round.
 */
interface IRecipientRegistry {

  function addRecipient(address _fundingAddress, string calldata _name) external;

  function getRecipientIndex(address _recipient) external view returns (uint256);

}

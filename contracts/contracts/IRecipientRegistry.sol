pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

interface IRecipientRegistry {

  function addRecipient(address _fundingAddress, string calldata _name) external;

  function getRecipientIndex(address _recipient) external view returns (uint256);

}

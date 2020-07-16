pragma solidity ^0.5.0;

import 'maci-contracts/sol/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol';

/**
 * @dev Implementation of the InitialVoiceCreditProxy interface.
 */
contract FundingRoundVoiceCreditProxy is InitialVoiceCreditProxy {

  /**
    * @dev Get the amount of voice credits for a given contributor.
    * @param _contributor Contributor's address (or the address of the funding round contract).
    * @param _data Encoded amount.
    */
  function getVoiceCredits(
    address _contributor,
    bytes memory _data
  )
    public
    view
    returns (uint256)
  {
    uint256 initialVoiceCredit = abi.decode(_data, (uint256));
    return initialVoiceCredit;
  }
}

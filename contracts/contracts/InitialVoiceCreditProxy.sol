pragma solidity ^0.5.0;

import 'maci/contracts/sol/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol';

contract FundingRoundVoiceCreditProxy is InitialVoiceCreditProxy {
  function getVoiceCredits(
    address _user,
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

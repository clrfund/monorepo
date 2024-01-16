// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.10;

import {FundingRound} from './FundingRound.sol';
import {IClrFund} from './interfaces/IClrFund.sol';

/**
* @dev A factory to deploy the funding round contract
*/
contract FundingRoundFactory {
  /**
  * @dev Deploy the funding round contract
  * @param _duration the funding round duration
  * @param _clrfund the clrfund contract containing information used to
  *                 deploy a funding round, e.g. nativeToken, coordinator address
  *                 coordinator public key, etc.
   */
  function deploy(
    uint256 _duration,
    address _clrfund
  )
    external
    returns (address)
  {
    FundingRound newRound = new FundingRound(_duration, IClrFund(_clrfund));
    newRound.transferOwnership(_clrfund);
    return address(newRound);
  }
}

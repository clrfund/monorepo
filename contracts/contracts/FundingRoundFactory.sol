// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.10;

import {FundingRound} from './FundingRound.sol';
import {IClrFund} from './interfaces/IClrFund.sol';
import {IMACIFactory} from './interfaces/IMACIFactory.sol';
import {MACICommon} from './MACICommon.sol';
import {MACI} from 'maci-contracts/contracts/MACI.sol';
import {SignUpGatekeeper} from 'maci-contracts/contracts/gatekeepers/SignUpGatekeeper.sol';
import {InitialVoiceCreditProxy} from 'maci-contracts/contracts/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol';

/**
* @dev A factory to deploy the funding round contract
*/
contract FundingRoundFactory is MACICommon {
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
    IClrFund clrfund = IClrFund(_clrfund);
    FundingRound newRound = new FundingRound(
      clrfund.nativeToken(),
      clrfund.userRegistry(),
      clrfund.recipientRegistry(),
      clrfund.coordinator()
    );

    IMACIFactory maciFactory = clrfund.maciFactory();
    (MACI maci, MACI.PollContracts memory pollContracts) = maciFactory.deployMaci(
      SignUpGatekeeper(newRound),
      InitialVoiceCreditProxy(newRound),
      address(newRound.topupToken()),
      _duration,
      newRound.coordinator(),
      clrfund.coordinatorPubKey(),
      address(this)
    );

    // link funding round with maci related contracts
    newRound.setMaci(maci, pollContracts);
    newRound.transferOwnership(_clrfund);
    maci.transferOwnership(address(newRound));
    return address(newRound);
  }
}

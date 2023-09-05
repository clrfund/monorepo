// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.10;

import {MACI} from 'maci-contracts/contracts/MACI.sol';
import {PollFactory} from 'maci-contracts/contracts/Poll.sol';
import {SignUpGatekeeper} from 'maci-contracts/contracts/gatekeepers/SignUpGatekeeper.sol';
import {InitialVoiceCreditProxy} from 'maci-contracts/contracts/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol';

contract MACIFactory {
  event MaciDeployed(address _maci);

  /**
    * @dev Deploy new MACI instance.
    */
  function deployMaci(
    PollFactory pollFactory,
    SignUpGatekeeper signUpGatekeeper,
    InitialVoiceCreditProxy initialVoiceCreditProxy
  )
    external
    returns (MACI _maci)
  {
    // create poll factory
    _maci = new MACI(
      pollFactory,
      signUpGatekeeper,
      initialVoiceCreditProxy
    );
    // transfer poll factory owner to maci
    emit MaciDeployed(address(_maci));
  }
}

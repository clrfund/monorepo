// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.10;

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import {IMACIFactory} from './IMACIFactory.sol';
import {DomainObjs} from 'maci-contracts/contracts/utilities/DomainObjs.sol';

/**
 *  @dev FundingRound interface used by the ClrFund contract
 */
interface IFundingRound {
  function nativeToken() external view returns (ERC20);
  function isFinalized() external view returns (bool);
  function isCancelled() external view returns (bool);
  function cancel() external;
  function finalize(
    uint256 _totalSpent,
    uint256 _totalSpentSalt,
    uint256 _newResultCommitment,
    uint256 _perVOSpentVoiceCreditsHash
  ) external;
  function deployPoll(
    uint256 _duration,
    IMACIFactory _maciFactory,
    DomainObjs.PubKey memory _coordinatorPubKey
  ) external;
}

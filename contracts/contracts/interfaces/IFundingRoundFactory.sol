// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.10;

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';

/**
 *  @dev FundingRoundFactory interface used by the ClrFund contract
 */
interface IFundingRoundFactory {
  function deploy(uint256 _duration, address _clrfund) external returns (address);
}
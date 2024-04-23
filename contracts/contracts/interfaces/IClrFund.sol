// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.10;

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import {IUserRegistry} from '../userRegistry/IUserRegistry.sol';
import {IRecipientRegistry} from '../recipientRegistry/IRecipientRegistry.sol';
import {DomainObjs} from 'maci-contracts/contracts/utilities/DomainObjs.sol';
import {IMACIFactory} from './IMACIFactory.sol';

/**
 *  @dev ClrFund interface
 */
interface IClrFund {
  function nativeToken() external view returns (ERC20);
  function maciFactory() external view returns (IMACIFactory);
  function userRegistry() external view returns (IUserRegistry);
  function recipientRegistry() external view returns (IRecipientRegistry);
  function coordinatorPubKey() external view returns (DomainObjs.PubKey memory);
  function coordinator() external view returns (address);
}
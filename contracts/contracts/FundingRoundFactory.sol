// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.10;

import {FundingRound} from './FundingRound.sol';
import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import {IUserRegistry} from './userRegistry/IUserRegistry.sol';
import {IRecipientRegistry} from './recipientRegistry/IRecipientRegistry.sol';

contract FundingRoundFactory {
  function deploy(
    ERC20 _nativeToken,
    IUserRegistry _userRegistry,
    IRecipientRegistry _recipientRegistry,
    address _coordinator,
    address _owner
  )
    external
    returns (FundingRound newRound)
  {
    newRound = new FundingRound(
      _nativeToken,
      _userRegistry,
      _recipientRegistry,
      _coordinator
    );

    newRound.transferOwnership(_owner);
  }
}

// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.10;

import {MACI} from 'maci-contracts/contracts/MACI.sol';
import {PollFactory, MessageAqFactory} from 'maci-contracts/contracts/Poll.sol';
import {SignUpGatekeeper} from 'maci-contracts/contracts/gatekeepers/SignUpGatekeeper.sol';
import {InitialVoiceCreditProxy} from 'maci-contracts/contracts/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol';
import {TopupCredit} from 'maci-contracts/contracts/TopupCredit.sol';
import {VkRegistry} from 'maci-contracts/contracts/VkRegistry.sol';
import {SnarkCommon} from 'maci-contracts/contracts/crypto/SnarkCommon.sol';
import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {Params} from "maci-contracts/contracts/Params.sol";

contract MACIFactory is Ownable, Params, SnarkCommon {
  // Constants
  uint256 private constant MESSAGE_TREE_BASE = 2;
  uint256 private constant VOTE_OPTION_TREE_BASE = 5;

  // States
  MaxValues public maxValues;

  // Events
  event MaciParametersChanged();
  event MaciDeployed(address _maci);

  function setMaciParameters(
    uint8 _messageTreeDepth,
    uint8 _voteOptionTreeDepth
  )
    external
    onlyOwner
  {
    maxValues = MaxValues(
      MESSAGE_TREE_BASE ** _messageTreeDepth - 1,
      VOTE_OPTION_TREE_BASE ** _voteOptionTreeDepth - 1
    );

    emit MaciParametersChanged();
  }

  /**
    * @dev Deploy new MACI instance.
    */
  function deployMaci(
    SignUpGatekeeper signUpGatekeeper,
    InitialVoiceCreditProxy initialVoiceCreditProxy,
    address vkRegistry,
    address pollFactoryAddress,
    address topupCredit
  )
    external
    onlyOwner
    returns (MACI _maci)
  {
    require(topupCredit != address(0), 'MACIFactory: topupCredit address cannot be zero');

    PollFactory pollFactory = PollFactory(pollFactoryAddress);
    _maci = new MACI(
      pollFactory,
      signUpGatekeeper,
      initialVoiceCreditProxy
    );

    pollFactory.transferOwnership(address(_maci));

    MessageAqFactory messageAqFactory = pollFactory.messageAqFactory();
    _maci.init(VkRegistry(vkRegistry), messageAqFactory, TopupCredit(topupCredit));

    emit MaciDeployed(address(_maci));
  }
}

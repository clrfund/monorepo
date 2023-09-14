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
import {Params} from 'maci-contracts/contracts/Params.sol';
import {PollFactoryCreator} from './PollFactoryCreator.sol';
import {VkRegistryCreator} from './VkRegistryCreator.sol';
import {IPubKey} from 'maci-contracts/contracts/DomainObjs.sol';

contract MACIFactory is Ownable, Params, SnarkCommon, IPubKey {
  // States
  bool public initialized = false;
  uint8 public stateTreeDepth;

  // treeDepths
  TreeDepths public treeDepths;

  VerifyingKey public processVk;
  VerifyingKey public tallyVk;

  // max values
  MaxValues public maxValues;
  uint256 public messageBatchSize;

  // Events
  event MaciParametersChanged();
  event MaciDeployed(address _maci);

  // errors
  error NotInitialized();

  function init(
    uint8 _stateTreeDepth,
    uint8 _intStateTreeDepth,
    uint8 _messageTreeSubDepth,
    uint8 _messageTreeDepth,
    uint8 _voteOptionTreeDepth,
    uint256 _maxMessages,
    uint256 _maxVoteOptions,
    uint256 _messageBatchSize,
    VerifyingKey calldata _processVk,
    VerifyingKey calldata _tallyVk
  )
  external
  {
    _setMaciParameters(
      _stateTreeDepth,
      _intStateTreeDepth,
      _messageTreeSubDepth,
      _messageTreeDepth,
      _voteOptionTreeDepth,
      _maxMessages,
      _maxVoteOptions,
      _messageBatchSize,
      _processVk,
      _tallyVk
    );
    initialized = true;
  }

  function setMaciParameters(
    uint8 _stateTreeDepth,
    uint8 _intStateTreeDepth,
    uint8 _messageTreeSubDepth,
    uint8 _messageTreeDepth,
    uint8 _voteOptionTreeDepth,
    uint256 _maxMessages,
    uint256 _maxVoteOptions,
    uint256 _messageBatchSize,
    VerifyingKey calldata _processVk,
    VerifyingKey calldata _tallyVk
  )
    external
  {
    _setMaciParameters(
      _stateTreeDepth,
      _intStateTreeDepth,
      _messageTreeSubDepth,
      _messageTreeDepth,
      _voteOptionTreeDepth,
      _maxMessages,
      _maxVoteOptions,
      _messageBatchSize,
      _processVk,
      _tallyVk
    );
  }

  function _setMaciParameters(
    uint8 _stateTreeDepth,
    uint8 _intStateTreeDepth,
    uint8 _messageTreeSubDepth,
    uint8 _messageTreeDepth,
    uint8 _voteOptionTreeDepth,
    uint256 _maxMessages,
    uint256 _maxVoteOptions,
    uint256 _messageBatchSize,
    VerifyingKey calldata _processVk,
    VerifyingKey calldata _tallyVk
  )
    internal
    onlyOwner
  {
    stateTreeDepth = _stateTreeDepth;
    treeDepths = TreeDepths(_intStateTreeDepth, _messageTreeSubDepth, _messageTreeDepth, _voteOptionTreeDepth);
    maxValues = MaxValues(_maxMessages, _maxVoteOptions);
    messageBatchSize = _messageBatchSize;
    processVk = _processVk;
    tallyVk = _tallyVk;

    emit MaciParametersChanged();
  }

  /**
    * @dev Deploy new MACI instance.
    */
  function deployMaci(
    SignUpGatekeeper signUpGatekeeper,
    InitialVoiceCreditProxy initialVoiceCreditProxy,
    address topupCredit,
    uint256 duration,
    PubKey calldata coordinatorPubKey
  )
    external
    onlyOwner
    returns (MACI _maci)
  {
    if (!initialized ) {
      revert NotInitialized();
    }

    PollFactory pollFactory = PollFactoryCreator.create();
    _maci = new MACI(
      pollFactory,
      signUpGatekeeper,
      initialVoiceCreditProxy
    );

    pollFactory.transferOwnership(address(_maci));

    VkRegistry vkRegistry = VkRegistryCreator.create();
    vkRegistry.setVerifyingKeys(
        stateTreeDepth,
        treeDepths.intStateTreeDepth,
        treeDepths.messageTreeDepth,
        treeDepths.voteOptionTreeDepth,
        messageBatchSize,
        processVk,
        tallyVk
    );

    MessageAqFactory messageAqFactory = pollFactory.messageAqFactory();
    _maci.init(vkRegistry, messageAqFactory, TopupCredit(topupCredit));

    _maci.deployPoll(duration, maxValues, treeDepths, coordinatorPubKey);

    emit MaciDeployed(address(_maci));
  }
}

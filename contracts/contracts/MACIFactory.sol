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
import {MessageAqFactoryCreator} from './MessageAqFactoryCreator.sol';
import {IPubKey} from 'maci-contracts/contracts/DomainObjs.sol';

contract MACIFactory is Ownable, Params, SnarkCommon, IPubKey {
  // Constants
  uint8 private constant VOTE_OPTION_TREE_BASE = 5;

  // State
  VkRegistry public vkRegistry;
  uint8 public stateTreeDepth;
  TreeDepths public treeDepths;
  MaxValues public maxValues;
  uint256 public messageBatchSize;

  // Events
  event MaciParametersChanged();
  event MaciDeployed(address _maci);

  // errors
  error NotInitialized();
  error CannotDecreaseVoteOptionDepth();
  error ProcessVkNotSet();
  error TallyVkNotSet();
  error InvalidVkRegistry();

  constructor(VkRegistry _vkRegistry) {
    _setVkRegistry(_vkRegistry);
  }

  function _setVkRegistry(VkRegistry _vkRegistry) internal {
    if (address(_vkRegistry) == address(0)) {
      revert InvalidVkRegistry();
    }

    vkRegistry = _vkRegistry;
  }

  function setVkRegistry(VkRegistry _vkRegistry) public onlyOwner {
    _setVkRegistry(_vkRegistry);
  }

  function setMaciParameters(
    uint8 _stateTreeDepth,
    TreeDepths calldata _treeDepths,
    MaxValues calldata _maxValues,
    uint256 _messageBatchSize,
    VerifyingKey calldata _processVk,
    VerifyingKey calldata _tallyVk
  )
    public
    onlyOwner
  {
    if (_treeDepths.voteOptionTreeDepth < treeDepths.voteOptionTreeDepth) {
      revert CannotDecreaseVoteOptionDepth();
    }

    if (!vkRegistry.hasProcessVk(
        _stateTreeDepth,
        _treeDepths.messageTreeDepth,
        _treeDepths.voteOptionTreeDepth,
        _messageBatchSize) ||
      !vkRegistry.hasTallyVk(
        _stateTreeDepth,
        _treeDepths.intStateTreeDepth,
        _treeDepths.voteOptionTreeDepth
      )
    ) {
      vkRegistry.setVerifyingKeys(
        _stateTreeDepth,
        _treeDepths.intStateTreeDepth,
        _treeDepths.messageTreeDepth,
        _treeDepths.voteOptionTreeDepth,
        _messageBatchSize,
        _processVk,
        _tallyVk
      );
    }

    stateTreeDepth = _stateTreeDepth;
    maxValues = _maxValues;
    treeDepths = _treeDepths;
    messageBatchSize = _messageBatchSize;

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
    if (!vkRegistry.hasProcessVk(
      stateTreeDepth,
      treeDepths.messageTreeDepth,
      treeDepths.voteOptionTreeDepth,
      messageBatchSize)
    ) {
      revert ProcessVkNotSet();
    }

    if (!vkRegistry.hasTallyVk(
      stateTreeDepth,
      treeDepths.intStateTreeDepth,
      treeDepths.voteOptionTreeDepth)
    ) {
      revert TallyVkNotSet();
    }

    PollFactory pollFactory = PollFactoryCreator.create();
    _maci = new MACI(
      pollFactory,
      signUpGatekeeper,
      initialVoiceCreditProxy
    );
    pollFactory.transferOwnership(address(_maci));

    MessageAqFactory messageAqFactory = MessageAqFactoryCreator.create();
    messageAqFactory.transferOwnership(address(pollFactory));

    _maci.init(vkRegistry, messageAqFactory, TopupCredit(topupCredit));
    _maci.deployPoll(duration, maxValues, treeDepths, coordinatorPubKey);

    emit MaciDeployed(address(_maci));
  }
}

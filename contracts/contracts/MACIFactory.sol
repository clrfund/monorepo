// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.10;

import {MACI} from '@clrfund/maci-contracts/contracts/MACI.sol';
import {Poll, PollFactory} from '@clrfund/maci-contracts/contracts/Poll.sol';
import {SignUpGatekeeper} from '@clrfund/maci-contracts/contracts/gatekeepers/SignUpGatekeeper.sol';
import {InitialVoiceCreditProxy} from '@clrfund/maci-contracts/contracts/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol';
import {TopupCredit} from '@clrfund/maci-contracts/contracts/TopupCredit.sol';
import {VkRegistry} from '@clrfund/maci-contracts/contracts/VkRegistry.sol';
import {SnarkCommon} from '@clrfund/maci-contracts/contracts/crypto/SnarkCommon.sol';
import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {Params} from '@clrfund/maci-contracts/contracts/Params.sol';
import {IPubKey} from '@clrfund/maci-contracts/contracts/DomainObjs.sol';

contract MACIFactory is Ownable, Params, SnarkCommon, IPubKey {
  // Constants
  uint8 private constant VOTE_OPTION_TREE_BASE = 5;

  // State
  VkRegistry public vkRegistry;
  PollFactory public pollFactory;
  uint8 public stateTreeDepth;
  TreeDepths public treeDepths;
  MaxValues public maxValues;
  uint256 public messageBatchSize;

  // Events
  event MaciParametersChanged();
  event MaciDeployed(address _maci);

  // errors
  error NotInitialized();
  error ProcessVkNotSet();
  error TallyVkNotSet();
  error InvalidVkRegistry();
  error InvalidPollFactory();

  constructor(address _vkRegistry, address _pollFactory) {
    if (_vkRegistry == address(0)) revert InvalidVkRegistry();
    if (_pollFactory == address(0)) revert InvalidPollFactory();

    vkRegistry = VkRegistry(_vkRegistry);
    pollFactory = PollFactory(_pollFactory);
  }

  /**
   * @dev set vk registry
   */
  function setVkRegistry(address _vkRegistry) public onlyOwner {
    if (_vkRegistry == address(0)) revert InvalidVkRegistry();

    vkRegistry = VkRegistry(_vkRegistry);
  }

  /**
   * @dev set poll factory in MACI factory
   * @param _pollFactory poll factory
   */
  function setPollFactory(address _pollFactory) public onlyOwner {
    if (_pollFactory == address(0)) revert InvalidPollFactory();

    pollFactory = PollFactory(_pollFactory);
  }

  /**
   * @dev set MACI zkeys parameters
   */
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
    address coordinator,
    PubKey calldata coordinatorPubKey
  )
    external
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

    _maci = new MACI(
      pollFactory,
      signUpGatekeeper,
      initialVoiceCreditProxy
    );

    _maci.init(vkRegistry, TopupCredit(topupCredit));
    address poll = _maci.deployPoll(duration, maxValues, treeDepths, coordinatorPubKey);
    Poll(poll).transferOwnership(coordinator);

    emit MaciDeployed(address(_maci));
  }
}

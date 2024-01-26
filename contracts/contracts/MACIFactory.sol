// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.10;

import {MACI} from 'maci-contracts/contracts/MACI.sol';
import {IPollFactory} from 'maci-contracts/contracts/interfaces/IPollFactory.sol';
import {ITallySubsidyFactory} from 'maci-contracts/contracts/interfaces/ITallySubsidyFactory.sol';
import {IMessageProcessorFactory} from 'maci-contracts/contracts/interfaces/IMPFactory.sol';
import {SignUpGatekeeper} from 'maci-contracts/contracts/gatekeepers/SignUpGatekeeper.sol';
import {InitialVoiceCreditProxy} from 'maci-contracts/contracts/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol';
import {TopupCredit} from 'maci-contracts/contracts/TopupCredit.sol';
import {VkRegistry} from 'maci-contracts/contracts/VkRegistry.sol';
import {Verifier} from 'maci-contracts/contracts/crypto/Verifier.sol';
import {SnarkCommon} from 'maci-contracts/contracts/crypto/SnarkCommon.sol';
import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {Params} from 'maci-contracts/contracts/utilities/Params.sol';
import {DomainObjs} from 'maci-contracts/contracts/utilities/DomainObjs.sol';
import {MACICommon} from './MACICommon.sol';

contract MACIFactory is Ownable, Params, SnarkCommon, DomainObjs, MACICommon {

  // Verifying Key Registry containing circuit parameters
  VkRegistry public vkRegistry;
  // All the factory contracts used to deploy Poll, Tally, MessageProcessor, Subsidy
  Factories public factories;
  // verifier is used when creating Tally, MessageProcessor, Subsidy
  Verifier public verifier;

  // circuit parameters
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
  error InvalidTallyFactory();
  error InvalidSubsidyFactory();
  error InvalidMessageProcessorFactory();
  error InvalidVerifier();

  constructor(
    address _vkRegistry,
    Factories memory _factories,
    address _verifier
  ) {
    if (_vkRegistry == address(0)) revert InvalidVkRegistry();
    if (_factories.pollFactory == address(0)) revert InvalidPollFactory();
    if (_factories.tallyFactory == address(0)) revert InvalidTallyFactory();
    if (_factories.messageProcessorFactory == address(0)) revert InvalidMessageProcessorFactory();
    if (_verifier == address(0)) revert InvalidVerifier();

    vkRegistry = VkRegistry(_vkRegistry);
    factories = _factories;
    verifier = Verifier(_verifier);
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

    factories.pollFactory = _pollFactory;
  }

  /**
   * @dev set tally factory in MACI factory
   * @param _tallyFactory tally factory
   */
  function setTallyFactory(address _tallyFactory) public onlyOwner {
    if (_tallyFactory == address(0)) revert InvalidTallyFactory();

    factories.tallyFactory = _tallyFactory;
  }

  /**
   * @dev set message processor factory in MACI factory
   * @param _messageProcessorFactory message processor factory
   */
  function setMessageProcessorFactory(address _messageProcessorFactory) public onlyOwner {
    if (_messageProcessorFactory == address(0)) revert InvalidMessageProcessorFactory();

    factories.messageProcessorFactory = _messageProcessorFactory;
  }

  /**
   * @dev set verifier in MACI factory
   * @param _verifier verifier contract
   */
  function setVerifier(address _verifier) public onlyOwner {
    if (_verifier == address(0)) revert InvalidVerifier();

    verifier = Verifier(_verifier);
  }

  /**
   * @dev set MACI zkeys parameters
   */
  function setMaciParameters(
    uint8 _stateTreeDepth,
    TreeDepths calldata _treeDepths,
    MaxValues calldata _maxValues,
    uint256 _messageBatchSize
  )
    public
    onlyOwner
  {

    if (!vkRegistry.hasProcessVk(
      _stateTreeDepth,
      _treeDepths.messageTreeDepth,
      _treeDepths.voteOptionTreeDepth,
      _messageBatchSize)
    ) {
      revert ProcessVkNotSet();
    }

    if (!vkRegistry.hasTallyVk(
      _stateTreeDepth,
      _treeDepths.intStateTreeDepth,
      _treeDepths.voteOptionTreeDepth)
    ) {
      revert TallyVkNotSet();
    }

    stateTreeDepth = _stateTreeDepth;
    treeDepths = _treeDepths;
    maxValues = _maxValues;
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
    PubKey calldata coordinatorPubKey,
    address maciOwner
  )
    external
    returns (MACI _maci, MACI.PollContracts memory _pollContracts)
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
      IPollFactory(factories.pollFactory),
      IMessageProcessorFactory(factories.messageProcessorFactory),
      ITallySubsidyFactory(factories.tallyFactory),
      ITallySubsidyFactory(factories.subsidyFactory),
      signUpGatekeeper,
      initialVoiceCreditProxy,
      TopupCredit(topupCredit),
      stateTreeDepth
    );

    _pollContracts = _maci.deployPoll(
      duration,
      maxValues,
      treeDepths,
      coordinatorPubKey,
      address(verifier),
      address(vkRegistry),
      // pass false to not deploy the subsidy contract
      false
    );

    // transfer ownership to coordinator to run the tally scripts
    Ownable(_pollContracts.poll).transferOwnership(coordinator);
    Ownable(_pollContracts.messageProcessor).transferOwnership(coordinator);
    Ownable(_pollContracts.tally).transferOwnership(coordinator);

    _maci.transferOwnership(maciOwner);

    emit MaciDeployed(address(_maci));
  }
}

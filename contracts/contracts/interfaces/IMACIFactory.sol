// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.10;

import {IVkRegistry} from 'maci-contracts/contracts/interfaces/IVkRegistry.sol';
import {IVerifier} from 'maci-contracts/contracts/interfaces/IVerifier.sol';
import {MACI} from 'maci-contracts/contracts/MACI.sol';
import {Params} from 'maci-contracts/contracts/utilities/Params.sol';
import {DomainObjs} from 'maci-contracts/contracts/utilities/DomainObjs.sol';
import {SignUpGatekeeper} from 'maci-contracts/contracts/gatekeepers/SignUpGatekeeper.sol';
import {InitialVoiceCreditProxy} from 'maci-contracts/contracts/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol';
import {MACICommon} from '../MACICommon.sol';

/**
 *  @dev MACIFactory interface
 */
interface IMACIFactory {
  // Verifying Key Registry containing zk circuit parameters
  function vkRegistry() external view returns (IVkRegistry);

  // All the factory contracts used to deploy Poll, Tally, MessageProcessor, Subsidy
  function factories() external view returns (MACICommon.Factories memory);

  // verifier is used when creating Tally, MessageProcessor, Subsidy
  function verifier() external view returns (IVerifier);

  // poll parameters
  function stateTreeDepth() external view returns (uint8);
  function treeDepths() external view returns (Params.TreeDepths memory);

  function getMessageBatchSize(uint8 _messageTreeSubDepth) external pure
    returns(uint256 _messageBatchSize);

  function TREE_ARITY() external pure returns (uint256);

  function deployMaci(
    SignUpGatekeeper signUpGatekeeper,
    InitialVoiceCreditProxy initialVoiceCreditProxy,
    address topupCredit,
    uint256 duration,
    address coordinator,
    DomainObjs.PubKey calldata coordinatorPubKey,
    address maciOwner
  ) external returns (MACI _maci);
}

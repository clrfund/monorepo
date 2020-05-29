pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/ownership/Ownable.sol';
import 'maci/contracts/sol/MACI.sol';
import 'maci/contracts/sol/MACIParameters.sol';
import 'maci/contracts/sol/gatekeepers/FreeForAllSignUpGatekeeper.sol';
import 'maci/contracts/sol/initialVoiceCreditProxy/ConstantInitialVoiceCreditProxy.sol';
import { BatchUpdateStateTreeVerifier } from 'maci/contracts/sol/BatchUpdateStateTreeVerifier.sol';
import { QuadVoteTallyVerifier } from 'maci/contracts/sol/QuadVoteTallyVerifier.sol';

contract MACIFactory is Ownable, MACIParameters {
  // Constants
  uint8 private constant MACI_STATE_TREE_DEPTH = 4;
  uint8 private constant MACI_MESSAGE_TREE_DEPTH = 4;
  uint8 private constant MACI_VOTE_OPTION_TREE_DEPTH = 4;
  uint8 private constant MACI_TALLY_BATCH_SIZE = 4;
  uint8 private constant MACI_MESSAGE_BATCH_SIZE = 4;
  uint256 private constant MACI_MAX_USERS = 15; // 2 ** MACI_STATE_TREE_DEPTH - 1
  uint256 private constant MACI_MAX_MESSAGES = 15; // 2 ** MACI_MESSAGE_TREE_DEPTH - 1
  uint256 private constant MACI_MAX_VOTE_OPTIONS = 16;

  // State
  FreeForAllGatekeeper private signUpGatekeeper;
  BatchUpdateStateTreeVerifier private batchUstVerifier;
  QuadVoteTallyVerifier private qvtVerifier;
  ConstantInitialVoiceCreditProxy private initialVoiceCreditProxy;

  // Events
  event MaciDeployed(address _maci);

  constructor(
    FreeForAllGatekeeper _signUpGatekeeper,
    BatchUpdateStateTreeVerifier _batchUstVerifier,
    QuadVoteTallyVerifier _qvtVerifier,
    ConstantInitialVoiceCreditProxy _initialVoiceCreditProxy
  )
    public
  {
    signUpGatekeeper = _signUpGatekeeper;
    batchUstVerifier = _batchUstVerifier;
    qvtVerifier = _qvtVerifier;
    initialVoiceCreditProxy = _initialVoiceCreditProxy;
  }

  function deployMaci(
    uint256 _signUpDuration,
    uint256 _votingDuration,
    PubKey memory _coordinatorPubKey
  )
    public
    onlyOwner
    returns (MACI _maci)
  {
    TreeDepths memory treeDepths = TreeDepths(
      MACI_STATE_TREE_DEPTH,
      MACI_MESSAGE_TREE_DEPTH,
      MACI_VOTE_OPTION_TREE_DEPTH
    );
    BatchSizes memory batchSizes = BatchSizes(
      MACI_TALLY_BATCH_SIZE,
      MACI_MESSAGE_BATCH_SIZE
    );
    MaxValues memory maxValues = MaxValues(
      MACI_MAX_USERS,
      MACI_MAX_MESSAGES,
      MACI_MAX_VOTE_OPTIONS
    );
    _maci = new MACI(
      treeDepths,
      batchSizes,
      maxValues,
      signUpGatekeeper,
      batchUstVerifier,
      qvtVerifier,
      _signUpDuration,
      _votingDuration,
      initialVoiceCreditProxy,
      _coordinatorPubKey
    );
    emit MaciDeployed(address(_maci));
  }
}

pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/ownership/Ownable.sol';
import 'maci-contracts/sol/MACI.sol';
import 'maci-contracts/sol/MACIParameters.sol';
import 'maci-contracts/sol/MACISharedObjs.sol';
import 'maci-contracts/sol/gatekeepers/FreeForAllSignUpGatekeeper.sol';
import { BatchUpdateStateTreeVerifier } from 'maci-contracts/sol/BatchUpdateStateTreeVerifier.sol';
import { QuadVoteTallyVerifier } from 'maci-contracts/sol/QuadVoteTallyVerifier.sol';

import './InitialVoiceCreditProxy.sol';

contract MACIFactory is Ownable, MACIParameters, MACISharedObjs {
  // Constants
  uint256 private constant STATE_TREE_BASE = 2;
  uint256 private constant MESSAGE_TREE_BASE = 2;
  uint256 private constant VOTE_OPTION_TREE_BASE = 5;

  // State
  uint8 private stateTreeDepth = 10;
  uint8 private messageTreeDepth = 10;
  uint8 private voteOptionTreeDepth = 2;
  uint8 private tallyBatchSize = 4;
  uint8 private messageBatchSize = 4;
  uint256 public maxUsers = STATE_TREE_BASE ** 10 - 1;
  uint256 public maxMessages = MESSAGE_TREE_BASE ** 10 - 1;
  uint256 public maxVoteOptions = VOTE_OPTION_TREE_BASE ** 2 - 1;
  uint256 public signUpDuration = 7 * 86400;
  uint256 public votingDuration = 7 * 86400;

  FreeForAllGatekeeper private signUpGatekeeper;
  BatchUpdateStateTreeVerifier private batchUstVerifier;
  QuadVoteTallyVerifier private qvtVerifier;
  FundingRoundVoiceCreditProxy private initialVoiceCreditProxy;

  // Events
  event MaciParametersChanged();
  event MaciDeployed(address _maci);

  constructor(
    FreeForAllGatekeeper _signUpGatekeeper,
    BatchUpdateStateTreeVerifier _batchUstVerifier,
    QuadVoteTallyVerifier _qvtVerifier,
    FundingRoundVoiceCreditProxy _initialVoiceCreditProxy
  )
    public
  {
    signUpGatekeeper = _signUpGatekeeper;
    batchUstVerifier = _batchUstVerifier;
    qvtVerifier = _qvtVerifier;
    initialVoiceCreditProxy = _initialVoiceCreditProxy;
  }

  function setMaciParameters(
    uint8 _stateTreeDepth,
    uint8 _messageTreeDepth,
    uint8 _voteOptionTreeDepth,
    uint8 _tallyBatchSize,
    uint8 _messageBatchSize,
    uint256 _signUpDuration,
    uint256 _votingDuration
  )
    public
    onlyOwner
  {
    require(
      _voteOptionTreeDepth >= voteOptionTreeDepth,
      'MACIFactory: Vote option tree depth can not be decreased'
    );
    stateTreeDepth = _stateTreeDepth;
    messageTreeDepth = _messageTreeDepth;
    voteOptionTreeDepth = _voteOptionTreeDepth;
    tallyBatchSize = _tallyBatchSize;
    messageBatchSize = _messageBatchSize;
    maxUsers = STATE_TREE_BASE ** stateTreeDepth - 1;
    maxMessages = MESSAGE_TREE_BASE ** messageTreeDepth - 1;
    maxVoteOptions = VOTE_OPTION_TREE_BASE ** voteOptionTreeDepth - 1;
    signUpDuration = _signUpDuration;
    votingDuration = _votingDuration;
    emit MaciParametersChanged();
  }

  function deployMaci(
    PubKey memory _coordinatorPubKey
  )
    public
    onlyOwner
    returns (MACI _maci)
  {
    TreeDepths memory treeDepths = TreeDepths(
      stateTreeDepth,
      messageTreeDepth,
      voteOptionTreeDepth
    );
    BatchSizes memory batchSizes = BatchSizes(
      tallyBatchSize,
      messageBatchSize
    );
    MaxValues memory maxValues = MaxValues(
      maxUsers,
      maxMessages,
      maxVoteOptions
    );
    _maci = new MACI(
      treeDepths,
      batchSizes,
      maxValues,
      signUpGatekeeper,
      batchUstVerifier,
      qvtVerifier,
      signUpDuration,
      votingDuration,
      initialVoiceCreditProxy,
      _coordinatorPubKey
    );
    emit MaciDeployed(address(_maci));
  }
}

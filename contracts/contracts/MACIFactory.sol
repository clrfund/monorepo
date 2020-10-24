pragma solidity ^0.5.8;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/ownership/Ownable.sol';
import 'maci-contracts/sol/MACI.sol';
import 'maci-contracts/sol/MACIParameters.sol';
import 'maci-contracts/sol/MACISharedObjs.sol';
import 'maci-contracts/sol/gatekeepers/SignUpGatekeeper.sol';
import 'maci-contracts/sol/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol';

contract MACIFactory is Ownable, MACIParameters, MACISharedObjs {
  // Constants
  uint256 private constant STATE_TREE_BASE = 2;
  uint256 private constant MESSAGE_TREE_BASE = 2;
  uint256 private constant VOTE_OPTION_TREE_BASE = 5;

  // State
  TreeDepths public treeDepths = TreeDepths(4, 4, 2);
  BatchSizes public batchSizes = BatchSizes(4, 4);
  MaxValues public maxValues = MaxValues(
    STATE_TREE_BASE ** 4 - 1,
    MESSAGE_TREE_BASE ** 4 - 1,
    VOTE_OPTION_TREE_BASE ** 2 - 1
  );
  uint256 public signUpDuration = 7 * 86400;
  uint256 public votingDuration = 7 * 86400;
  SnarkVerifier public batchUstVerifier;
  SnarkVerifier public qvtVerifier;

  // Events
  event MaciParametersChanged();
  event MaciDeployed(address _maci);

  constructor(
    SnarkVerifier _batchUstVerifier,
    SnarkVerifier _qvtVerifier
  )
    public
  {
    batchUstVerifier = _batchUstVerifier;
    qvtVerifier = _qvtVerifier;
  }

  function setMaciParameters(
    uint8 _stateTreeDepth,
    uint8 _messageTreeDepth,
    uint8 _voteOptionTreeDepth,
    uint8 _tallyBatchSize,
    uint8 _messageBatchSize,
    SnarkVerifier _batchUstVerifier,
    SnarkVerifier _qvtVerifier,
    uint256 _signUpDuration,
    uint256 _votingDuration
  )
    external
    onlyOwner
  {
    require(
      _voteOptionTreeDepth >= treeDepths.voteOptionTreeDepth,
      'MACIFactory: Vote option tree depth can not be decreased'
    );
    treeDepths = TreeDepths(_stateTreeDepth, _messageTreeDepth, _voteOptionTreeDepth);
    batchSizes = BatchSizes(_tallyBatchSize, _messageBatchSize);
    maxValues = MaxValues(
      STATE_TREE_BASE ** treeDepths.stateTreeDepth - 1,
      MESSAGE_TREE_BASE ** treeDepths.messageTreeDepth - 1,
      VOTE_OPTION_TREE_BASE ** treeDepths.voteOptionTreeDepth - 1
    );
    batchUstVerifier = _batchUstVerifier;
    qvtVerifier = _qvtVerifier;
    signUpDuration = _signUpDuration;
    votingDuration = _votingDuration;
    emit MaciParametersChanged();
  }

  /**
    * @dev Deploy new MACI instance.
    */
  function deployMaci(
    SignUpGatekeeper _signUpGatekeeper,
    InitialVoiceCreditProxy _initialVoiceCreditProxy,
    PubKey calldata _coordinatorPubKey
  )
    external
    onlyOwner
    returns (MACI _maci)
  {
    _maci = new MACI(
      treeDepths,
      batchSizes,
      maxValues,
      _signUpGatekeeper,
      batchUstVerifier,
      qvtVerifier,
      signUpDuration,
      votingDuration,
      _initialVoiceCreditProxy,
      _coordinatorPubKey
    );
    emit MaciDeployed(address(_maci));
  }
}

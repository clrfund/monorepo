// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';

import 'maci-contracts/sol/MACI.sol';
import 'maci-contracts/sol/MACISharedObjs.sol';
import 'maci-contracts/sol/gatekeepers/SignUpGatekeeper.sol';
import 'maci-contracts/sol/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol';

import './userRegistry/IUserRegistry.sol';
import './recipientRegistry/IRecipientRegistry.sol';

contract FundingRound is Ownable, MACISharedObjs, SignUpGatekeeper, InitialVoiceCreditProxy {
  using SafeERC20 for ERC20;

  // Constants
  uint256 private constant MAX_VOICE_CREDITS = 10 ** 9;  // MACI allows 2 ** 32 voice credits max
  uint256 private constant MAX_CONTRIBUTION_AMOUNT = 10 ** 4;  // In tokens
  uint256 private constant ALPHA_PRECISION = 10 ** 18; // to account for loss of precision in division
  uint8   private constant LEAVES_PER_NODE = 5; // leaves per node of the tally result tree

  // Structs
  struct ContributorStatus {
    uint256 voiceCredits;
    bool isRegistered;
  }

  struct RecipientStatus {
    // Has the recipient claimed funds?
    bool fundsClaimed;
    // Are the tally result and spent verified
    bool resultsVerified;
    // Tally result
    uint256 tallyResult;
  }

  // State
  uint256 public voiceCreditFactor;
  uint256 public contributorCount;
  uint256 public matchingPoolSize;
  uint256 public totalSpent;
  uint256 public totalVotes;
  bool public isFinalized = false;
  bool public isCancelled = false;

  address public coordinator;
  MACI public maci;
  ERC20 public nativeToken;
  IUserRegistry public userRegistry;
  IRecipientRegistry public recipientRegistry;
  string public tallyHash;

  // The alpha used in quadratic funding formula
  uint256 public alpha = 0;

  // Total number of tally results verified, should match total recipients before finalize
  uint256 public totalTallyResults = 0;
  uint256 public totalVotesSquares = 0;
  mapping(uint256 => RecipientStatus) public recipients;
  mapping(address => ContributorStatus) public contributors;

  // Events
  event Contribution(address indexed _sender, uint256 _amount);
  event ContributionWithdrawn(address indexed _contributor);
  event FundsClaimed(uint256 indexed _voteOptionIndex, address indexed _recipient, uint256 _amount);
  event TallyPublished(string _tallyHash);
  event Voted(address indexed _contributor);
  event TallyResultsAdded(uint256 indexed _voteOptionIndex, uint256 _tally);

  /**
    * @dev Set round parameters.
    * @param _nativeToken Address of a token which will be accepted for contributions.
    * @param _userRegistry Address of the registry of verified users.
    * @param _recipientRegistry Address of the recipient registry.
    * @param _coordinator Address of the coordinator.
    */
  constructor(
    ERC20 _nativeToken,
    IUserRegistry _userRegistry,
    IRecipientRegistry _recipientRegistry,
    address _coordinator
  )
    public
  {
    nativeToken = _nativeToken;
    voiceCreditFactor = (MAX_CONTRIBUTION_AMOUNT * uint256(10) ** nativeToken.decimals()) / MAX_VOICE_CREDITS;
    voiceCreditFactor = voiceCreditFactor > 0 ? voiceCreditFactor : 1;
    userRegistry = _userRegistry;
    recipientRegistry = _recipientRegistry;
    coordinator = _coordinator;
  }

  /**
    * @dev Link MACI instance to this funding round.
    */
  function setMaci(
    MACI _maci
  )
    external
    onlyOwner
  {
    require(address(maci) == address(0), 'FundingRound: Already linked to MACI instance');
    require(
      _maci.calcSignUpDeadline() > block.timestamp,
      'FundingRound: Signup deadline must be in the future'
    );
    maci = _maci;
  }

  /**
    * @dev Contribute tokens to this funding round.
    * @param pubKey Contributor's public key.
    * @param amount Contribution amount.
    */
  function contribute(
    PubKey calldata pubKey,
    uint256 amount
  )
    external
  {
    require(address(maci) != address(0), 'FundingRound: MACI not deployed');
    require(contributorCount < maci.maxUsers(), 'FundingRound: Contributor limit reached');
    require(block.timestamp < maci.calcSignUpDeadline(), 'FundingRound: Contribution period ended');
    require(!isFinalized, 'FundingRound: Round finalized');
    require(amount > 0, 'FundingRound: Contribution amount must be greater than zero');
    require(amount <= MAX_VOICE_CREDITS * voiceCreditFactor, 'FundingRound: Contribution amount is too large');
    require(contributors[msg.sender].voiceCredits == 0, 'FundingRound: Already contributed');
    uint256 voiceCredits = amount / voiceCreditFactor;
    contributors[msg.sender] = ContributorStatus(voiceCredits, false);
    contributorCount += 1;
    bytes memory signUpGatekeeperData = abi.encode(msg.sender, voiceCredits);
    bytes memory initialVoiceCreditProxyData = abi.encode(msg.sender);
    nativeToken.safeTransferFrom(msg.sender, address(this), amount);
    maci.signUp(
      pubKey,
      signUpGatekeeperData,
      initialVoiceCreditProxyData
    );
    emit Contribution(msg.sender, amount);
  }

  /**
    * @dev Register user for voting.
    * This function is part of SignUpGatekeeper interface.
    * @param _data Encoded address of a contributor.
    */
  function register(
    address /* _caller */,
    bytes memory _data
  )
    override
    public
  {
    require(msg.sender == address(maci), 'FundingRound: Only MACI contract can register voters');
    address user = abi.decode(_data, (address));
    bool verified = userRegistry.isVerifiedUser(user);
    require(verified, 'FundingRound: User has not been verified');
    require(contributors[user].voiceCredits > 0, 'FundingRound: User has not contributed');
    require(!contributors[user].isRegistered, 'FundingRound: User already registered');
    contributors[user].isRegistered = true;
  }

  /**
    * @dev Get the amount of voice credits for a given address.
    * This function is a part of the InitialVoiceCreditProxy interface.
    * @param _data Encoded address of a user.
    */
  function getVoiceCredits(
    address /* _caller */,
    bytes memory _data
  )
    override
    public
    view
    returns (uint256)
  {
    address user = abi.decode(_data, (address));
    uint256 initialVoiceCredits = contributors[user].voiceCredits;
    require(initialVoiceCredits > 0, 'FundingRound: User does not have any voice credits');
    return initialVoiceCredits;
  }

  /**
    * @dev Submit a batch of messages along with corresponding ephemeral public keys.
    */
  function submitMessageBatch(
    Message[] calldata _messages,
    PubKey[] calldata _encPubKeys
  )
    external
  {
    uint256 batchSize = _messages.length;
    for (uint8 i = 0; i < batchSize; i++) {
      maci.publishMessage(_messages[i], _encPubKeys[i]);
    }
    emit Voted(msg.sender);
  }

  /**
    * @dev Withdraw contributed funds for a list of contributors if the round has been cancelled.
    */
  function withdrawContributions(address[] memory _contributors)
    public
    returns (bool[] memory result)
  {
    require(isCancelled, 'FundingRound: Round not cancelled');

    result = new bool[](_contributors.length);
    // Reconstruction of exact contribution amount from VCs may not be possible due to a loss of precision
    for (uint256 i = 0; i < _contributors.length; i++) {
      address contributor = _contributors[i];
      uint256 amount = contributors[contributor].voiceCredits * voiceCreditFactor;
      if (amount > 0) {
        contributors[contributor].voiceCredits = 0;
        nativeToken.safeTransfer(contributor, amount);
        emit ContributionWithdrawn(contributor);
        result[i] = true;
      } else {
        result[i] = false;
      }
    }
  }

  /**
    * @dev Withdraw contributed funds by the caller.
    */
  function withdrawContribution()
    external
  {
    address[] memory msgSender = new address[](1);
    msgSender[0] = msg.sender;

    bool[] memory results = withdrawContributions(msgSender);
    require(results[0], 'FundingRound: Nothing to withdraw');
  }

  /**
    * @dev Publish the IPFS hash of the vote tally. Only coordinator can publish.
    * @param _tallyHash IPFS hash of the vote tally.
    */
  function publishTallyHash(string calldata _tallyHash)
    external
  {
    require(msg.sender == coordinator, 'FundingRound: Sender is not the coordinator');
    require(!isFinalized, 'FundingRound: Round finalized');
    require(bytes(_tallyHash).length != 0, 'FundingRound: Tally hash is empty string');
    tallyHash = _tallyHash;
    emit TallyPublished(_tallyHash);
  }

  /**
    * @dev Calculate the alpha for the capital constrained quadratic formula
    *  in page 17 of https://arxiv.org/pdf/1809.06421.pdf
    * @param _budget Total budget of the round to be distributed
    * @param _totalVotesSquares Total of the squares of votes
    * @param _totalSpent Total amount of spent voice credits
   */
  function calcAlpha(
    uint256 _budget,
    uint256 _totalVotesSquares,
    uint256 _totalSpent
  )
    public
    view
    returns (uint256 _alpha)
  {
    // make sure budget = contributions + matching pool
    uint256 contributions = _totalSpent * voiceCreditFactor;
    require(_budget >= contributions, 'FundingRound: Invalid budget');

    // guard against division by zero when fewer than 1 contributor for each project
    require(_totalVotesSquares > _totalSpent, "FundingRound: Total quadratic votes must be greater than total spent voice credits");

    return  (_budget - contributions) * ALPHA_PRECISION /
            (voiceCreditFactor * (_totalVotesSquares - _totalSpent));
  }

  /**
    * @dev Get the total amount of votes from MACI,
    * verify the total amount of spent voice credits across all recipients,
    * calculate the quadratic alpha value,
    * and allow recipients to claim funds.
    * @param _totalSpent Total amount of spent voice credits.
    * @param _totalSpentSalt The salt.
    */
  function finalize(
    uint256 _totalSpent,
    uint256 _totalSpentSalt
  )
    external
    onlyOwner
  {
    require(!isFinalized, 'FundingRound: Already finalized');
    require(address(maci) != address(0), 'FundingRound: MACI not deployed');
    require(maci.calcVotingDeadline() < block.timestamp, 'FundingRound: Voting has not been finished');
    require(!maci.hasUntalliedStateLeaves(), 'FundingRound: Votes has not been tallied');
    require(bytes(tallyHash).length != 0, 'FundingRound: Tally hash has not been published');

    // make sure we have received all the tally results
    (,, uint8 voteOptionTreeDepth) = maci.treeDepths();
    uint256 totalResults = uint256(LEAVES_PER_NODE) ** uint256(voteOptionTreeDepth);
    require(totalTallyResults == totalResults, 'FundingRound: Incomplete tally results');

    totalVotes = maci.totalVotes();
    // If nobody voted, the round should be cancelled to avoid locking of matching funds
    require(totalVotes > 0, 'FundingRound: No votes');
    bool verified = maci.verifySpentVoiceCredits(_totalSpent, _totalSpentSalt);
    require(verified, 'FundingRound: Incorrect total amount of spent voice credits');
    totalSpent = _totalSpent;
    // Total amount of spent voice credits is the size of the pool of direct rewards.
    // Everything else, including unspent voice credits and downscaling error,
    // is considered a part of the matching pool
    uint256 budget = nativeToken.balanceOf(address(this));
    matchingPoolSize = budget - totalSpent * voiceCreditFactor;

    // TODO: need to check/verify totalVotesSquares
    alpha = calcAlpha(budget, totalVotesSquares, _totalSpent);

    isFinalized = true;
  }

  /**
    * @dev Cancel funding round.
    */
  function cancel()
    external
    onlyOwner
  {
    require(!isFinalized, 'FundingRound: Already finalized');
    isFinalized = true;
    isCancelled = true;
  }

  /**
    * @dev Get allocated token amount (without verification).
    * @param _tallyResult The result of vote tally for the recipient.
    * @param _spent The amount of voice credits spent on the recipient.
    */
  function getAllocatedAmount(
    uint256 _tallyResult,
    uint256 _spent
  )
    public
    view
    returns (uint256)
  {
    // amount = ( alpha * (quadratic votes)^2 + (precision - alpha) * totalSpent ) / precision
    uint256 quadratic = alpha * voiceCreditFactor * _tallyResult * _tallyResult;
    uint256 linear = (ALPHA_PRECISION - alpha) * voiceCreditFactor * _spent;
    return (quadratic + linear) / ALPHA_PRECISION;
  }

  /**
    * @dev Claim allocated tokens.
    * @param _voteOptionIndex Vote option index.
    * @param _spent The amount of voice credits spent on the recipients.
    * @param _spentProof Proof of correctness for the amount of spent credits.
    * @param _spentSalt Salt.
    */
  function claimFunds(
    uint256 _voteOptionIndex,
    uint256 _spent,
    uint256[][] calldata _spentProof,
    uint256 _spentSalt
  )
    external
  {
    require(isFinalized, 'FundingRound: Round not finalized');
    require(!isCancelled, 'FundingRound: Round has been cancelled');
    require(!recipients[_voteOptionIndex].fundsClaimed, 'FundingRound: Funds already claimed');
    recipients[_voteOptionIndex].fundsClaimed = true;

    {
      // create scope to avoid 'stack too deep' error
      (,, uint8 voteOptionTreeDepth) = maci.treeDepths();
      bool spentVerified = maci.verifyPerVOSpentVoiceCredits(
        voteOptionTreeDepth,
        _voteOptionIndex,
        _spent,
        _spentProof,
        _spentSalt
      );
      require(spentVerified, 'FundingRound: Incorrect amount of spent voice credits');
    }

    uint256 startTime = maci.signUpTimestamp();
    address recipient = recipientRegistry.getRecipientAddress(
      _voteOptionIndex,
      startTime,
      startTime + maci.signUpDurationSeconds() + maci.votingDurationSeconds()
    );
    if (recipient == address(0)) {
      // Send funds back to the matching pool
      recipient = owner();
    }
    uint256 tallyResult = recipients[_voteOptionIndex].tallyResult;
    uint256 allocatedAmount = getAllocatedAmount(tallyResult, _spent);
    nativeToken.safeTransfer(recipient, allocatedAmount);
    emit FundsClaimed(_voteOptionIndex, recipient, allocatedAmount);
  }

  /**
    * @dev Add and verify tally votes and calculate sum of tally squares for alpha calculation.
    * @param _voteOptionIndex Vote option index.
    * @param _tallyResult The results of vote tally for the recipients.
    * @param _tallyResultProof Proofs of correctness of the vote tally results.
    * @param _tallyResultSalt Salt.
    */
  function _addTallyResults(
    uint256 _voteOptionIndex,
    uint256 _tallyResult,
    uint256[][] calldata _tallyResultProof,
    uint256 _tallyResultSalt
  )
    private
  {
    RecipientStatus storage recipient = recipients[_voteOptionIndex];
    require(!recipient.resultsVerified, 'FundingRound: Vote results already verified');

    {
      // create scope to avoid 'stack too deep' error
      (,, uint8 voteOptionTreeDepth) = maci.treeDepths();
      bool resultVerified = maci.verifyTallyResult(
        voteOptionTreeDepth,
        _voteOptionIndex,
        _tallyResult,
        _tallyResultProof,
        _tallyResultSalt
      );
      require(resultVerified, 'FundingRound: Incorrect tally result');
    }

    recipient.resultsVerified = true;
    recipient.tallyResult = _tallyResult;
    totalVotesSquares = totalVotesSquares + (_tallyResult * _tallyResult);
    totalTallyResults++;
    emit TallyResultsAdded(_voteOptionIndex, _tallyResult);
  }

  /**
    * @dev Add and verify a tally result.
    * @param _voteOptionIndex Vote option index.
    * @param _tallyResult The results of vote tally for the recipients.
    * @param _tallyResultProof Proofs of correctness of the vote tally results.
    * @param _tallyResultSalt Salt.
    */
  function addTallyResults(
    uint256 _voteOptionIndex,
    uint256 _tallyResult,
    uint256[][] calldata _tallyResultProof,
    uint256 _tallyResultSalt
  )
    external
  {
    require(msg.sender == coordinator, 'FundingRound: Sender is not the coordinator');
    require(!maci.hasUntalliedStateLeaves(), 'FundingRound: Votes have not been tallied');
    require(!isFinalized, 'FundingRound: Already finalized');
    _addTallyResults(
      _voteOptionIndex,
      _tallyResult,
      _tallyResultProof,
      _tallyResultSalt
    );
}

  /**
    * @dev Add and verify tally results by batch.
    * @param _voteOptionIndices Vote option index.
    * @param _tallyResults The results of vote tally for the recipients.
    * @param _tallyResultProofs Proofs of correctness of the vote tally results.
    * @param _tallyResultSalt Salt.
    */
  function addTallyResultsBatch(
    uint256[] calldata _voteOptionIndices,
    uint256[] calldata _tallyResults,
    uint256[][][] calldata _tallyResultProofs,
    uint256 _tallyResultSalt
  )
    external
  {
    require(msg.sender == coordinator, 'FundingRound: Sender is not the coordinator');
    require(!maci.hasUntalliedStateLeaves(), 'FundingRound: Votes have not been tallied');
    require(!isFinalized, 'FundingRound: Already finalized');

    for (uint256 i = 0; i < _voteOptionIndices.length; i++) {
      _addTallyResults(
        _voteOptionIndices[i],
        _tallyResults[i],
        _tallyResultProofs[i],
        _tallyResultSalt
      );
    }
  }

}

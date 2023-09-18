// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.10;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

import {DomainObjs} from 'maci-contracts/contracts/DomainObjs.sol';
import {MACI} from 'maci-contracts/contracts/MACI.sol';
import {Poll,PollProcessorAndTallyer} from 'maci-contracts/contracts/Poll.sol';
import {SignUpGatekeeper} from "maci-contracts/contracts/gatekeepers/SignUpGatekeeper.sol";
import {InitialVoiceCreditProxy} from "maci-contracts/contracts/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol";

import './userRegistry/IUserRegistry.sol';
import './recipientRegistry/IRecipientRegistry.sol';

contract FundingRound is Ownable, SignUpGatekeeper, InitialVoiceCreditProxy, DomainObjs {
  using SafeERC20 for ERC20;
  error VOTING_PERIOD_NOT_PASSED();

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
    // Is the tally result verified
    bool tallyVerified;
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

  uint256 public pollId;
  Poll public poll;

  PollProcessorAndTallyer public tallyer;

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
  event PollSet(uint256 indexed _pollId, address indexed poll);
  event TallyerSet(address indexed tallyer);

  modifier onlyCoordinator() {
    require(msg.sender == coordinator, 'FundingRound: Sender is not the coordinator');
    _;
  }

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
  {
    nativeToken = _nativeToken;
    voiceCreditFactor = (MAX_CONTRIBUTION_AMOUNT * uint256(10) ** nativeToken.decimals()) / MAX_VOICE_CREDITS;
    voiceCreditFactor = voiceCreditFactor > 0 ? voiceCreditFactor : 1;
    userRegistry = _userRegistry;
    recipientRegistry = _recipientRegistry;
    coordinator = _coordinator;
  }

  /**
   * @dev Check if the voting period is over.
   */
  function isVotingOver() internal view returns (bool) {
    require(address(poll) != address(0), 'FundingRound: Poll not set');
    (uint256 deployTime, uint256 duration) = poll.getDeployTimeAndDuration();
    uint256 secondsPassed = block.timestamp - deployTime;
    return (secondsPassed >= duration);
  }

  /**
   * @dev Have the votes been tallied
   */
  function isTallied() internal view returns (bool) {
    require(address(tallyer) != address(0), 'FundingRound: Poll tallyer not set');

    (uint256 numSignUps, ) = poll.numSignUpsAndMessages();
    (, uint256 tallyBatchSize, ) = poll.batchSizes();
    uint256 tallyBatchNum = tallyer.tallyBatchNum();
    uint256 totalTallied = tallyBatchNum * tallyBatchSize;

    return totalTallied > numSignUps;
  }

  /**
    * @dev Set the MACI poll
    * @param _pollId The poll id.
    */
  function setPoll(uint256 _pollId)
    external
    onlyOwner
  {
    poll = maci.getPoll(_pollId);
    require(address(poll) != address(0), 'FundingRound: Poll not found');

    pollId = _pollId;
    emit PollSet(pollId, address(poll));
  }

  /**
    * @dev Set the poll tallyer
    * @param _tallyer The poll processor and tallyer contract address
    */
  function setTallyer(PollProcessorAndTallyer _tallyer)
    external
    onlyCoordinator
  {
    require(address(_tallyer) != address(0), 'FundingRound: PollProcessorAndTallyer cannot be zero');

    tallyer = _tallyer;

    emit TallyerSet(address(tallyer));
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
    require(!isFinalized, 'FundingRound: Round finalized');
    require(amount > 0, 'FundingRound: Contribution amount must be greater than zero');
    require(amount <= MAX_VOICE_CREDITS * voiceCreditFactor, 'FundingRound: Contribution amount is too large');
    uint256 voiceCredits = amount / voiceCreditFactor;
    uint256 currentVoiceCredits = contributors[msg.sender].voiceCredits;
    contributors[msg.sender] = ContributorStatus(voiceCredits + currentVoiceCredits);
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
    require(address(poll) != address(0), 'FundingRound: Poll not set');

    uint256 batchSize = _messages.length;
    for (uint8 i = 0; i < batchSize; i++) {
      poll.publishMessage(_messages[i], _encPubKeys[i]);
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
    * @dev Publish the IPFS hash of the vote tally and set the tally contract address. Only coordinator can publish.
    * @param _tallyHash IPFS hash of the vote tally.
    */
  function publishTallyHash(string calldata _tallyHash)
    external
    onlyCoordinator
  {
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
    require(isVotingOver(), 'FundingRound: Voting has not been finished');
    require(isTallied(), 'FundingRound: Votes has not been tallied');
    

    // make sure we have received all the tally results
   /* (,,, uint8 voteOptionTreeDepth) = poll.treeDepths();
    uint256 totalResults = uint256(LEAVES_PER_NODE) ** uint256(voteOptionTreeDepth);
    require(totalTallyResults == totalResults, 'FundingRound: Incomplete tally results');
   */
/* TODO how to check this in maci v1??
    totalVotes = maci.totalVotes();
    // If nobody voted, the round should be cancelled to avoid locking of matching funds
    require(totalVotes > 0, 'FundingRound: No votes');
*/

    bool verified = poll.verifySpentVoiceCredits(_totalSpent, _totalSpentSalt);
    require(verified, 'FundingRound: Incorrect total amount of spent voice credits');

    totalSpent = _totalSpent;
    // Total amount of spent voice credits is the size of the pool of direct rewards.
    // Everything else, including unspent voice credits and downscaling error,
    // is considered a part of the matching pool
    uint256 budget = nativeToken.balanceOf(address(this));
    matchingPoolSize = budget - totalSpent * voiceCreditFactor;

    alpha = calcAlpha(budget, totalVotesSquares, totalSpent);

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
      bool verified = poll.verifyPerVOSpentVoiceCredits(
        _voteOptionIndex,
        _spent,
        _spentProof,
        _spentSalt
      );

      require(verified, 'FundingRound: Incorrect amount of spent voice credits');
    }

    (uint256 startTime, uint256 duration) = poll.getDeployTimeAndDuration();
    address recipient = recipientRegistry.getRecipientAddress(
      _voteOptionIndex,
      startTime,
      startTime + duration
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
    * @param _voteOptionTreeDepth Vote option tree depth
    * @param _voteOptionIndex Vote option index.
    * @param _tallyResult The results of vote tally for the recipients.
    * @param _tallyResultProof Proofs of correctness of the vote tally results.
    */
  function _addTallyResult(
    uint8 _voteOptionTreeDepth,
    uint256 _voteOptionIndex,
    uint256 _tallyResult,
    uint256[][] calldata _tallyResultProof,
    uint256 _spentVoiceCreditsHash,
    uint256 _perVOSpentVoiceCreditsHash,
    uint256 _tallyCommitment
  )
    private
  {
    RecipientStatus storage recipient = recipients[_voteOptionIndex];
    require(!recipient.tallyVerified, 'FundingRound: Vote results already verified');

    bool resultVerified = poll.verifyTallyResult(
      _voteOptionIndex,
      _tallyResult,
      _tallyResultProof,
      _spentVoiceCreditsHash,
      _perVOSpentVoiceCreditsHash,
      _tallyCommitment
    );
    require(resultVerified, 'FundingRound: Incorrect tally result');

    recipient.tallyVerified = true;
    recipient.tallyResult = _tallyResult;
    totalVotesSquares = totalVotesSquares + (_tallyResult * _tallyResult);
    totalTallyResults++;
    emit TallyResultsAdded(_voteOptionIndex, _tallyResult);
  }

  /**
    * @dev Add and verify tally results by batch.
    * @param _voteOptionTreeDepth Vote option tree depth.
    * @param _voteOptionIndices Vote option index.
    * @param _tallyResults The results of vote tally for the recipients.
    * @param _tallyResultProofs Proofs of correctness of the vote tally results.
    */
  function addTallyResultsBatch(
    uint8 _voteOptionTreeDepth,
    uint256[] calldata _voteOptionIndices,
    uint256[] calldata _tallyResults,
    uint256[][][] calldata _tallyResultProofs,
    uint256[] calldata _spentVoiceCreditsHashes,
    uint256[] calldata _perVOSpentVoiceCreditsHash,
    uint256 _tallyCommitment
  )
    external
    onlyCoordinator
  {
    require(isTallied(), 'FundingRound: Votes have not been tallied');
    require(!isFinalized, 'FundingRound: Already finalized');

    for (uint256 i = 0; i < _voteOptionIndices.length; i++) {
      _addTallyResult(
        _voteOptionTreeDepth,
        _voteOptionIndices[i],
        _tallyResults[i],
        _tallyResultProofs[i],
        _spentVoiceCreditsHashes[i],
        _perVOSpentVoiceCreditsHash[i],
        _tallyCommitment
      );
    }
  }

}

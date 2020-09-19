pragma solidity ^0.5.8;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/ownership/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol';
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';

import 'maci-contracts/sol/MACI.sol';
import 'maci-contracts/sol/MACISharedObjs.sol';
import 'maci-contracts/sol/gatekeepers/SignUpGatekeeper.sol';
import 'maci-contracts/sol/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol';

import './IVerifiedUserRegistry.sol';
import './IRecipientRegistry.sol';

contract FundingRound is Ownable, MACISharedObjs, SignUpGatekeeper, InitialVoiceCreditProxy {
  using SafeERC20 for ERC20Detailed;

  // Constants
  uint256 private constant MAX_VOICE_CREDITS = 10 ** 9;  // MACI allows 2 ** 32 voice credits max
  uint256 private constant MAX_CONTRIBUTION_AMOUNT = 10 ** 4;  // In tokens

  // Structs
  struct ContributorStatus {
    uint256 voiceCredits;
    bool isRegistered;
  }

  // State
  uint256 public startTimestamp;
  uint256 public voiceCreditFactor;
  uint256 public contributorCount;
  uint256 public contributionDeadline;
  uint256 public matchingPoolSize;
  uint256 private adjustedMatchingPoolSize;
  uint256 public totalVotes;
  bool public isFinalized = false;
  bool public isCancelled = false;

  PubKey public coordinatorPubKey;
  MACI public maci;
  ERC20Detailed public nativeToken;
  IVerifiedUserRegistry public verifiedUserRegistry;
  IRecipientRegistry public recipientRegistry;

  mapping(uint256 => bool) private recipients;
  mapping(address => ContributorStatus) public contributors;

  // Events
  event Contribution(address indexed _sender, uint256 _amount);
  event ContributionWithdrawn(address indexed _contributor);
  event FundsClaimed(address indexed _recipient, uint256 _amount);

  /**
    * @dev Sets round parameters (they can only be set once during construction).
    * @param _nativeToken Address of a token which will be accepted for contributions.
    * @param _verifiedUserRegistry Address of the verified user registry.
    * @param _recipientRegistry Address of the recipient registry.
    * @param _duration Duration of the contribution period in seconds.
    * @param _coordinatorPubKey Coordinator's public key.
    */
  constructor(
    ERC20Detailed _nativeToken,
    IVerifiedUserRegistry _verifiedUserRegistry,
    IRecipientRegistry _recipientRegistry,
    uint256 _duration,
    PubKey memory _coordinatorPubKey
  )
    public
  {
    nativeToken = _nativeToken;
    voiceCreditFactor = (MAX_CONTRIBUTION_AMOUNT * uint256(10) ** nativeToken.decimals()) / MAX_VOICE_CREDITS;
    voiceCreditFactor = voiceCreditFactor > 0 ? voiceCreditFactor : 1;
    verifiedUserRegistry = _verifiedUserRegistry;
    recipientRegistry = _recipientRegistry;
    startTimestamp = now;
    contributionDeadline = now + _duration;
    coordinatorPubKey = _coordinatorPubKey;
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
      _maci.calcSignUpDeadline() >= contributionDeadline,
      'FundingRound: Signup stops earlier than contribution deadline'
    );
    maci = _maci;
  }

  /**
    * @dev Get voting deadline.
    */
  function votingDeadline()
    public
    view
    returns (uint256)
  {
    require(address(maci) != address(0), 'FundingRound: MACI not deployed');
    return maci.calcVotingDeadline();
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
    require(now < contributionDeadline, 'FundingRound: Contribution period ended');
    require(!isFinalized, 'FundingRound: Round finalized');
    require(amount > 0, 'FundingRound: Contribution amount must be greater than zero');
    require(amount <= MAX_VOICE_CREDITS * voiceCreditFactor, 'FundingRound: Contribution amount is too large');
    require(contributors[msg.sender].voiceCredits == 0, 'FundingRound: Already contributed');
    uint256 voiceCredits = amount / voiceCreditFactor;
    contributors[msg.sender] = ContributorStatus(voiceCredits, false);
    contributorCount += 1;
    bytes memory signUpGatekeeperData = abi.encode(msg.sender, voiceCredits);
    bytes memory initialVoiceCreditProxyData = abi.encode(msg.sender);
    nativeToken.transferFrom(msg.sender, address(this), amount);
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
    public
  {
    require(msg.sender == address(maci), 'FundingRound: Only MACI contract can register voters');
    address user = abi.decode(_data, (address));
    bool verified = verifiedUserRegistry.isVerifiedUser(user);
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
  }

  /**
    * @dev Withdraw contributed funds from the pool if the round has been cancelled.
    */
  function withdrawContribution()
    external
  {
    require(isCancelled, 'FundingRound: Round not cancelled');
    // Reconstruction of exact contribution amount from VCs may not be possible due to a loss of precision
    uint256 amount = contributors[msg.sender].voiceCredits * voiceCreditFactor;
    require(amount > 0, 'FundingRound: Nothing to withdraw');
    nativeToken.transfer(msg.sender, amount);
    emit ContributionWithdrawn(msg.sender);
  }

  /**
    * @dev Get the total amount of votes from MACI,
    * verify the total amount of spent voice credits across all recipients,
    * and allow recipients to claim funds.
    * @param _matchingPoolSize Total amount of matching funds transferred.
    * @param _totalSpent Total amount of spent voice credits.
    * @param _totalSpentSalt The salt.
    */
  function finalize(
    uint256 _matchingPoolSize,
    uint256 _totalSpent,
    uint256 _totalSpentSalt
  )
    external
    onlyOwner
  {
    require(!isFinalized, 'FundingRound: Already finalized');
    require(address(maci) != address(0), 'FundingRound: MACI not deployed');
    require(maci.calcVotingDeadline() < now, 'FundingRound: Voting has not been finished');
    require(!maci.hasUntalliedStateLeaves(), 'FundingRound: Votes has not been tallied');
    totalVotes = maci.totalVotes();
    // If nobody voted, the round should be cancelled to avoid locking of matching funds
    require(totalVotes > 0, 'FundingRound: No votes');
    bool verified = maci.verifySpentVoiceCredits(_totalSpent, _totalSpentSalt);
    require(verified, 'FundingRound: Incorrect total amount of spent voice credits');
    // Initial size of the matching pool
    matchingPoolSize = _matchingPoolSize;
    // Total amount of spent voice credits is the size of the pool of direct rewards.
    // Everything else, including unspent voice credits and downscaling error,
    // is considered a part of the matching pool
    adjustedMatchingPoolSize = nativeToken.balanceOf(address(this)) - _totalSpent * voiceCreditFactor;
    assert(adjustedMatchingPoolSize >= matchingPoolSize);
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
    * @dev Claim allocated tokens.
    * @param _tallyResult The result of vote tally for the recipient.
    * @param _tallyResultProof Proof of correctness of the vote tally.
    * @param _tallyResultSalt Salt.
    * @param _spent The amount of voice credits spent on the recipient.
    * @param _spentProof Proof of correctness for the amount of spent credits.
    * @param _spentSalt Salt.
    */
  function claimFunds(
    address _recipient,
    uint256 _tallyResult,
    uint256[][] calldata _tallyResultProof,
    uint256 _tallyResultSalt,
    uint256 _spent,
    uint256[][] calldata _spentProof,
    uint256 _spentSalt
  )
    external
  {
    require(isFinalized, 'FundingRound: Round not finalized');
    require(!isCancelled, 'FundingRound: Round has been cancelled');
    uint256 voteOptionIndex = recipientRegistry.getRecipientIndex(_recipient, startTimestamp);
    require(voteOptionIndex > 0, 'FundingRound: Invalid recipient address');
    require(!recipients[voteOptionIndex], 'FundingRound: Funds already claimed');
    (,, uint8 voteOptionTreeDepth) = maci.treeDepths();
    bool resultVerified = maci.verifyTallyResult(
      voteOptionTreeDepth,
      voteOptionIndex,
      _tallyResult,
      _tallyResultProof,
      _tallyResultSalt
    );
    require(resultVerified, 'FundingRound: Incorrect tally result');
    bool spentVerified = maci.verifyPerVOSpentVoiceCredits(
      voteOptionTreeDepth,
      voteOptionIndex,
      _spent,
      _spentProof,
      _spentSalt
    );
    require(spentVerified, 'FundingRound: Incorrect amount of spent voice credits');
    recipients[voteOptionIndex] = true;
    uint256 claimableAmount = adjustedMatchingPoolSize * _tallyResult / totalVotes + _spent * voiceCreditFactor;
    nativeToken.transfer(_recipient, claimableAmount);
    emit FundsClaimed(_recipient, claimableAmount);
  }
}

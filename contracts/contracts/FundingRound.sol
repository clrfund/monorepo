pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';

import 'maci-contracts/sol/MACI.sol';
import 'maci-contracts/sol/MACISharedObjs.sol';
import 'maci-contracts/sol/gatekeepers/SignUpGatekeeper.sol';
import 'maci-contracts/sol/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol';

import './IVerifiedUserRegistry.sol';
import './IRecipientRegistry.sol';

contract FundingRound is Ownable, MACISharedObjs, SignUpGatekeeper, InitialVoiceCreditProxy {
  using SafeERC20 for IERC20;

  // Structs
  struct ContributorStatus {
    uint256 amount;
    bool isRegistered;
  }

  // State
  uint256 public contributorCount;
  uint256 public contributionDeadline;
  uint256 public poolSize;
  bool public isFinalized = false;
  bool public isCancelled = false;

  PubKey public coordinatorPubKey;
  MACI public maci;
  IERC20 public nativeToken;
  IVerifiedUserRegistry public verifiedUserRegistry;
  IRecipientRegistry public recipientRegistry;

  mapping(address => ContributorStatus) public contributors;

  // Events
  event FundsClaimed(address _recipient);
  event NewContribution(address indexed _sender, uint256 _amount);
  event FundsWithdrawn(address indexed _contributor);

  /**
    * @dev Sets round parameters (they can only be set once during construction).
    * @param _nativeToken Address of a token which will be accepted for contributions.
    * @param _verifiedUserRegistry Address of the verified user registry.
    * @param _recipientRegistry Address of the recipient registry.
    * @param _duration Duration of the contribution period in seconds.
    * @param _coordinatorPubKey Coordinator's public key.
    */
  constructor(
    IERC20 _nativeToken,
    IVerifiedUserRegistry _verifiedUserRegistry,
    IRecipientRegistry _recipientRegistry,
    uint256 _duration,
    PubKey memory _coordinatorPubKey
  )
    public
  {
    nativeToken = _nativeToken;
    verifiedUserRegistry = _verifiedUserRegistry;
    recipientRegistry = _recipientRegistry;
    contributionDeadline = now + _duration;
    coordinatorPubKey = _coordinatorPubKey;
  }

  /**
    * @dev Link MACI instance to this funding round.
    */
  function setMaci(
    MACI _maci
  )
    public
    onlyOwner
  {
    require(address(maci) == address(0), 'FundingRound: Already linked to MACI instance');
    require(
      _maci.calcSignUpDeadline() >= contributionDeadline,
      'FundingRound: MACI signup deadline must be greater than contribution deadline'
    );
    maci = _maci;
  }

  /**
    * @dev Claim allocated tokens.
    * @param _poolShare Share of votes, provided by coordinator.
    * @param _proof Proof of correctness.
    */
  function claimFunds(
    uint256 _poolShare,
    uint256[][] memory _proof
  )
    public
  {
    require(isFinalized, 'FundingRound: Round not finalized');
    // TODO: https://github.com/appliedzkp/maci/issues/108
    // bool verified = maci.verifyTallyResult(...);
    // TODO: do calculation properly; rounding
    uint256 finalAmount = _poolShare * poolSize / 100;
    nativeToken.transfer(msg.sender, finalAmount);
    emit FundsClaimed(msg.sender);
  }

  /**
    * @dev Contribute tokens to this funding round.
    * @param pubKey Contributor's public key.
    * @param amount Contribution amount.
    */
  function contribute(
    PubKey memory pubKey,
    uint256 amount
  ) public {
    require(address(maci) != address(0), 'FundingRound: MACI not deployed');
    require(contributorCount < maci.maxUsers(), 'FundingRound: Contributor limit reached');
    require(now < contributionDeadline, 'FundingRound: Contribution period ended');
    require(!isFinalized, 'FundingRound: Round finalized');
    require(amount > 0, 'FundingRound: Contribution amount must be greater than zero');
    require(contributors[msg.sender].amount == 0, 'FundingRound: Already contributed');
    contributors[msg.sender] = ContributorStatus(amount, false);
    contributorCount += 1;
    bytes memory signUpGatekeeperData = abi.encode(msg.sender, amount);
    bytes memory initialVoiceCreditProxyData = abi.encode(msg.sender);
    nativeToken.transferFrom(msg.sender, address(this), amount);
    maci.signUp(
      pubKey,
      signUpGatekeeperData,
      initialVoiceCreditProxyData
    );
    emit NewContribution(msg.sender, amount);
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
    require(contributors[user].amount > 0, 'FundingRound: User has not contributed');
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
    uint256 initialVoiceCredits = contributors[user].amount;
    require(initialVoiceCredits > 0, 'FundingRound: User does not have any voice credits');
    return initialVoiceCredits;
  }

  /**
    * @dev Submit a batch of messages along with corresponding ephemeral public keys.
    */
  function submitMessageBatch(
    Message[] memory _messages,
    PubKey[] memory _encPubKeys
  )
    public
  {
    uint256 batchSize = _messages.length;
    for (uint8 i = 0; i < batchSize; i++) {
      maci.publishMessage(_messages[i], _encPubKeys[i]);
    }
  }

  /**
    * @dev Withdraw contributed funds from the pool.
    */
  function withdraw()
    public
  {
    require(isCancelled, 'FundingRound: Round not cancelled');
    uint256 amount = contributors[msg.sender].amount;
    require(amount > 0, 'FundingRound: Nothing to withdraw');
    nativeToken.transfer(msg.sender, amount);
    emit FundsWithdrawn(msg.sender);
  }

  /**
    * @dev Allow recipients to claim funds after vote tally was done.
    */
  function finalize()
    public
    onlyOwner
  {
    require(!isFinalized, 'FundingRound: Already finalized');
    require(address(maci) != address(0), 'FundingRound: MACI not deployed');
    require(maci.calcVotingDeadline() < now, 'FundingRound: Voting has not been finished');
    require(maci.numSignUps() == 0 || !maci.hasUntalliedStateLeaves(), 'FundingRound: Votes has not been tallied');
    isFinalized = true;
    poolSize = nativeToken.balanceOf(address(this));
  }

  /**
    * @dev Cancel funding round.
    */
  function cancel()
    public
    onlyOwner
  {
    require(!isFinalized, 'FundingRound: Already finalized');
    isFinalized = true;
    isCancelled = true;
  }
}

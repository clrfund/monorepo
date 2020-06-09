pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import '@nomiclabs/buidler/console.sol';

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';

import 'maci/contracts/sol/MACI.sol';
import 'maci/contracts/sol/MACIPubKey.sol';

import './FundingRoundFactory.sol';

contract FundingRound is MACIPubKey {
  using SafeERC20 for IERC20;

  // ERC20 token being used
  IERC20 public nativeToken;
  uint256 public contributionDeadline;
  PubKey public coordinatorPubKey;
  MACI public maci;
  bool public isFinalized = false;
  uint256 public poolSize;

  FundingRoundFactory private parent;

  event FundsClaimed(address _recipient);
  event NewContribution(address indexed _sender, uint256 amount);

  uint256 public counter;

  constructor(
    FundingRoundFactory _parent,
    IERC20 _nativeToken,
    uint256 _duration,
    PubKey memory _coordinatorPubKey
  )
    public
  {
    parent = _parent;
    nativeToken = _nativeToken;
    contributionDeadline = now + _duration;
    coordinatorPubKey = _coordinatorPubKey;
  }

  modifier onlyFactory() {
    require(msg.sender == address(parent), 'Funding Round: Sender is not the factory');
    _;
  }

  /**
    * @dev Link MACI instance to this funding round.
    */
  function setMaci(
    MACI _maci
  )
    public
    onlyFactory
  {
    assert(address(maci) == address(0));
    // Ensure that signup is not going to be blocked
    assert(_maci.calcSignUpDeadline() >= contributionDeadline);
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
    require(isFinalized, 'Funding Round: Round not finalized');
    // TODO: https://github.com/appliedzkp/maci/issues/108
    // bool verified = maci.verifyTallyResult(...);
    // TODO: do calculation properly; rounding
    uint256 finalAmount = _poolShare * poolSize / 100;
    nativeToken.transferFrom(address(this), msg.sender, finalAmount);
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
    require(counter < maci.maxUsers(), 'FundingRound: Contributor limit reached');
    require(now < contributionDeadline, 'FundingRound: Contribution period ended');
    require(isFinalized == false, 'FundingRound: Round finalized');
    // TODO: check BrightID verification
    bytes memory signUpGatekeeperData = '';
    bytes memory initialVoiceCreditProxyData = abi.encode(amount);
    nativeToken.transferFrom(msg.sender, address(this), amount);
    maci.signUp(
      pubKey,
      signUpGatekeeperData,
      initialVoiceCreditProxyData
    );
    counter += 1;
    emit NewContribution(msg.sender, amount);
  }

  /**
    * @dev Allow recipients to claim funds.
    */
  function finalize()
    public
    onlyFactory
  {
    isFinalized = true;
    poolSize = nativeToken.balanceOf(address(this));
  }
}

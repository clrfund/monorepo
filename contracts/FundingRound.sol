pragma solidity ^0.6.2;

import '@nomiclabs/buidler/console.sol';

import './FundingRoundFactory.sol';

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';


contract FundingRound {
  using SafeERC20 for IERC20;

  // ERC20 token being used
  IERC20 public nativeToken;

  mapping(address => uint256[]) private encryptedVote;
  mapping(address => uint256) private totalAmountOfDAI;
  FundingRoundFactory private parent;

  event FundsClaimed(address _recipient);
  event NewContribution(address indexed _sender, uint256 amount);

  constructor(FundingRoundFactory _parent, address _nativeToken) public {
    parent = _parent;
    nativeToken = IERC20(_nativeToken);
  }

  function claimFunds(address recipient) public {
    emit FundsClaimed(recipient);
    // TODO: Implement me
    // Send relative percentage of DAI balance to recipient
  }

  function contribute(
    uint256[] memory message,
    uint256[] memory encPubKey,
    uint256 amount
  ) public {
    // message: encrypted message to be sent to MACI. This is generated using the Command class and Command.encrypt .  More information on using Command here.
    // encPubKey: encrypted public key. Use Keypair to create a keypair, then use Keypair.genEcdhSharedKey and supply the private key from the current keypair

    // Both parameters are created using functions from this maci javascript library.

    // FundingRound thisContract = FundingRound(this);
    address thisContract = address(this);
    // FundingRound currentRound = parent.getCurrentRound();
    address currentRound = address(parent.getCurrentRound());
    // console.log(thisContract);

    // TODO: Also revert if msg.sender isn't BrightID verified
    if (thisContract != currentRound) {
      // revert if it's the previous round
      // if this is not the current round
      revert("This round isn't the current round");
    }

    // DAI is transferred here
    // Transfer the nativeToken as an internal tx if ERC20 approved
    _deliverTokens(msg.sender, address(this), amount);
    emit NewContribution(msg.sender, amount);
  }

  // Question: This should be public, right?
  function getMessage(address _participant)
    public
    returns (uint256[] memory _message)
  {
    // TODO: Get the message from storage
    uint256[] memory message;
    return message; // returns encrypted message for participant
  }

  function _deliverTokens(address from, address to, uint256 tokenAmount)
    internal
  {
    nativeToken.transferFrom(from, to, tokenAmount);
  }
}

pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import '@nomiclabs/buidler/console.sol';

import '@openzeppelin/contracts/ownership/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';

import 'maci/contracts/sol/MACI.sol';
import 'maci/contracts/sol/MACIPubKey.sol';

import './MACIFactory.sol';
import './FundingRound.sol';

// TODO: Import SafeMath

contract FundingRoundFactory is Ownable, MACIPubKey {
  using SafeERC20 for IERC20;

  // State
  mapping(address => string) public recipients;
  uint256 private recipientCount = 0;

  MACIFactory public maciFactory;
  address public coordinator;
  PubKey public coordinatorPubKey;
  IERC20 public nativeToken;

  FundingRound[] private rounds;

  // Events
  event NewContribution(address indexed _sender, uint256 _amount);
  event RecipientAdded(address indexed _fundingAddress, string _name);
  event NewToken(address _token);
  event NewRound(address _round);
  event CoordinatorTransferred(address _newCoordinator);
  event RoundFinalized(address _round);

  constructor(
    MACIFactory _maciFactory
  )
    public
  {
    maciFactory = _maciFactory;
  }

  /**
    * @dev Contribute tokens to the matching pool.
    */
  function contribute(uint256 _amount)
    public
  {
    require(address(nativeToken) != address(0), 'Factory: Native token is not set');
    nativeToken.transferFrom(msg.sender, address(this), _amount);
    emit NewContribution(msg.sender, _amount);
  }

  function addRecipient(address _fundingAddress, string memory _name)
    public
    onlyOwner
  {
    require(_fundingAddress != address(0), 'Factory: Recipient address is zero');
    require(bytes(_name).length != 0, 'Factory: Recipient name is empty string');
    require(bytes(recipients[_fundingAddress]).length == 0, 'Factory: Recipient already registered');
    require(recipientCount < maciFactory.maxVoteOptions(), 'Factory: Recipient limit reached');
    recipients[_fundingAddress] = _name;
    recipientCount += 1;
    emit RecipientAdded(_fundingAddress, _name);
  }

  function getCurrentRound()
    public
    view
    returns (FundingRound _currentRound)
  {
    if (rounds.length == 0) {
      return FundingRound(address(0));
    }
    return rounds[rounds.length - 1];
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
    FundingRound currentRound = getCurrentRound();
    require(
      address(currentRound) == address(0) || address(currentRound.maci()) != address(0),
      'Factory: Waiting for MACI deployment'
    );
    maciFactory.setMaciParameters(
      _stateTreeDepth,
      _messageTreeDepth,
      _voteOptionTreeDepth,
      _tallyBatchSize,
      _messageBatchSize,
      _signUpDuration,
      _votingDuration
    );
  }

  /**
    * @dev Deploy new funding round.
    */
  function deployNewRound()
    public
    onlyOwner
    returns (FundingRound _newRound)
  {
    require(maciFactory.owner() == address(this), 'Factory: MACI factory is not owned by FR factory');
    require(address(nativeToken) != address(0), 'Factory: Native token is not set');
    require(coordinator != address(0), 'Factory: No coordinator');
    FundingRound currentRound = getCurrentRound();
    require(
      address(currentRound) == address(0) || currentRound.isFinalized(),
      'Factory: Current round is not finalized'
    );
    uint256 signUpDuration = maciFactory.signUpDuration();
    FundingRound newRound = new FundingRound(
      nativeToken,
      signUpDuration,
      coordinatorPubKey
    );
    rounds.push(newRound);
    emit NewRound(address(newRound));
    return newRound;
  }

  /**
    * @dev Deploy MACI instance and link it to the current round.
    */
  function deployMaci()
    public
    onlyOwner
  {
    FundingRound currentRound = getCurrentRound();
    require(address(currentRound) != address(0), 'Factory: Funding round has not been deployed');
    require(address(currentRound.maci()) == address(0), 'Factory: MACI already deployed');
    (uint256 x, uint256 y) = currentRound.coordinatorPubKey();
    PubKey memory roundCoordinatorPubKey = PubKey(x, y);
    MACI maci = maciFactory.deployMaci(roundCoordinatorPubKey);
    currentRound.setMaci(maci);
  }

  /**
    * @dev Transfer funds from matching pool to funding round and finalize it.
    */
  function transferMatchingFunds()
    public
    onlyOwner
  {
    FundingRound currentRound = getCurrentRound();
    uint256 amount = currentRound.nativeToken().balanceOf(address(this));
    nativeToken.transferFrom(address(this), address(currentRound), amount);
    currentRound.finalize();
    emit RoundFinalized(address(currentRound));
  }

  function setToken(address _token) public onlyOwner {
    nativeToken = IERC20(_token);
    emit NewToken(_token);
  }

  /**
    * @dev Set coordinator's address and public key.
    * @param _coordinator Coordinator's address.
    * @param _coordinatorPubKey Coordinator's public key.
    */
  function setCoordinator(
    address _coordinator,
    PubKey memory _coordinatorPubKey
  )
    public
    onlyOwner
  {
    coordinator = _coordinator;
    coordinatorPubKey = _coordinatorPubKey;
    emit CoordinatorTransferred(_coordinator);
    // TODO: cancel current funding round
  }

  function coordinatorQuit() public onlyCoordinator {
    coordinator = address(0);
    // The fact that they quit is obvious from
    // the address being 0x0
    emit CoordinatorTransferred(coordinator);
  }

  modifier onlyCoordinator() {
    // Enhancement: Get fancy to handle meta-tx
    // like how OpenZeppelin Ownable does via GSN/Context
    require(msg.sender == coordinator, 'Sender is not the coordinator');
    _;
  }
}

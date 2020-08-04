pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/ownership/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';

import 'maci-contracts/sol/MACI.sol';
import 'maci-contracts/sol/MACISharedObjs.sol';
import 'maci-contracts/sol/gatekeepers/SignUpGatekeeper.sol';
import 'maci-contracts/sol/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol';

import './IVerifiedUserRegistry.sol';
import './IRecipientRegistry.sol';
import './MACIFactory.sol';
import './FundingRound.sol';

contract FundingRoundFactory is Ownable, MACISharedObjs, IVerifiedUserRegistry, IRecipientRegistry {
  using SafeERC20 for IERC20;

  // State
  uint256 private recipientCount = 0;
  address public coordinator;

  IERC20 public nativeToken;
  MACIFactory public maciFactory;
  PubKey public coordinatorPubKey;

  FundingRound[] private rounds;

  mapping(address => bool) private users;
  mapping(address => bool) private recipients;
  mapping(address => uint256) private recipientIndex;

  // Events
  event NewContribution(address indexed _sender, uint256 _amount);
  event UserAdded(address indexed _user);
  event UserRemoved(address indexed _user);
  event RecipientAdded(address indexed _fundingAddress, string _metadata, uint256 _index);
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

  /**
    * @dev Add verified unique user to the registry.
    */
  function addUser(address _user)
    external
    onlyOwner
  {
    require(_user != address(0), 'Factory: User address is zero');
    require(!users[_user], 'Factory: User already verified');
    users[_user] = true;
    emit UserAdded(_user);
  }

  /**
    * @dev Remove user from the registry.
    */
  function removeUser(address _user)
    external
    onlyOwner
  {
    require(users[_user], 'Factory: User is not in the registry');
    delete users[_user];
    emit UserRemoved(_user);
  }

  /**
    * @dev Check if the user is verified.
    */
  function isVerifiedUser(address _user)
    external
    view
    returns (bool)
  {
    return users[_user];
  }

  /**
    * @dev Register recipient as eligible for funding allocation.
    * @param _fundingAddress The address that receives funds.
    * @param _metadata The metadata info of the recipient.
    */
  function addRecipient(address _fundingAddress, string calldata _metadata)
    external
    onlyOwner
  {
    // TODO: verify address and get recipient info from the recipient registry
    require(_fundingAddress != address(0), 'Factory: Recipient address is zero');
    require(bytes(_metadata).length != 0, 'Factory: Metadata info is empty string');
    require(recipients[_fundingAddress] == false, 'Factory: Recipient already registered');
    // TODO: implement mechanism for replacing registrants
    require(recipientCount < maciFactory.maxVoteOptions(), 'Factory: Recipient limit reached');
    recipientCount += 1;
    recipients[_fundingAddress] = true;
    recipientIndex[_fundingAddress] = recipientCount;  // Starts with 1
    emit RecipientAdded(_fundingAddress, _metadata, recipientCount);
  }

  function getRecipients(
    address _recipient
  )
    external
    view
    returns (bool)
  {
    return recipients[_recipient];
  }

  function getRecipientIndex(
    address _recipient
  )
    external
    view
    returns (uint256)
  {
    return recipientIndex[_recipient];
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
      this,
      this,
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
    MACI maci = maciFactory.deployMaci(
      SignUpGatekeeper(currentRound),
      InitialVoiceCreditProxy(currentRound),
      roundCoordinatorPubKey
    );
    currentRound.setMaci(maci);
  }

  /**
    * @dev Transfer funds from matching pool to current funding round and finalize it.
    */
  function transferMatchingFunds()
    public
    onlyOwner
  {
    FundingRound currentRound = getCurrentRound();
    require(address(currentRound) != address(0), 'Factory: Funding round has not been deployed');
    uint256 amount = currentRound.nativeToken().balanceOf(address(this));
    if (amount > 0) {
      nativeToken.transfer(address(currentRound), amount);
    }
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
  function _setCoordinator(
    address _coordinator,
    PubKey memory _coordinatorPubKey
  )
    internal
  {
    coordinator = _coordinator;
    coordinatorPubKey = _coordinatorPubKey;
    FundingRound currentRound = getCurrentRound();
    if (address(currentRound) != address(0) && !currentRound.isFinalized()) {
      currentRound.cancel();
      emit RoundFinalized(address(currentRound));
    }
    emit CoordinatorTransferred(_coordinator);
  }

  function setCoordinator(
    address _coordinator,
    PubKey memory _coordinatorPubKey
  )
    public
    onlyOwner
  {
    _setCoordinator(_coordinator, _coordinatorPubKey);
  }

  function coordinatorQuit() public onlyCoordinator {
    // The fact that they quit is obvious from
    // the address being 0x0
    _setCoordinator(address(0), PubKey(0, 0));
  }

  modifier onlyCoordinator() {
    // Enhancement: Get fancy to handle meta-tx
    // like how OpenZeppelin Ownable does via GSN/Context
    require(msg.sender == coordinator, 'Sender is not the coordinator');
    _;
  }
}

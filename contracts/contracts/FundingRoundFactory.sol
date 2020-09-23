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
import './MACIFactory.sol';
import './FundingRound.sol';

contract FundingRoundFactory is Ownable, MACISharedObjs, IVerifiedUserRegistry, IRecipientRegistry {
  using SafeERC20 for ERC20Detailed;

  // Structs
  struct Recipient {
    uint256 index;
    uint256 addedAt;
    uint256 removedAt;
  }

  // State
  uint256 private nextRecipientIndex = 1;
  address public coordinator;

  ERC20Detailed public nativeToken;
  MACIFactory public maciFactory;
  PubKey public coordinatorPubKey;

  FundingRound[] private rounds;

  mapping(address => bool) private users;
  mapping(address => Recipient) private recipients;
  uint256[] private vacantRecipientIndexes;

  // Events
  event MatchingPoolContribution(address indexed _sender, uint256 _amount);
  event UserAdded(address indexed _user);
  event UserRemoved(address indexed _user);
  event RecipientAdded(address indexed _recipient, string _metadata, uint256 _index);
  event RecipientRemoved(address indexed _recipient);
  event RoundStarted(address _round);
  event RoundFinalized(address _round);
  event TokenChanged(address _token);
  event CoordinatorChanged(address _coordinator);

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
  function contributeMatchingFunds(uint256 _amount)
    external
  {
    require(address(nativeToken) != address(0), 'Factory: Native token is not set');
    nativeToken.transferFrom(msg.sender, address(this), _amount);
    emit MatchingPoolContribution(msg.sender, _amount);
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
    * @param _recipient The address that receives funds.
    * @param _metadata The metadata info of the recipient.
    */
  function addRecipient(address _recipient, string calldata _metadata)
    external
    onlyOwner
  {
    // TODO: verify address and get recipient info from the recipient registry
    require(_recipient != address(0), 'Factory: Recipient address is zero');
    require(bytes(_metadata).length != 0, 'Factory: Metadata info is empty string');
    require(recipients[_recipient].index == 0, 'Factory: Recipient already registered');
    uint256 recipientIndex;
    if (vacantRecipientIndexes.length == 0) {
      // Assign next index in sequence
      (,, uint256 maxVoteOptions) = maciFactory.maxValues();
      require(nextRecipientIndex <= maxVoteOptions, 'Factory: Recipient limit reached');
      recipientIndex = nextRecipientIndex;
      nextRecipientIndex += 1;
    } else {
      // Assign one of the vacant recipient indexes
      recipientIndex = vacantRecipientIndexes[vacantRecipientIndexes.length - 1];
      vacantRecipientIndexes.pop();
    }
    recipients[_recipient] = Recipient(recipientIndex, block.number, 0);
    emit RecipientAdded(_recipient, _metadata, recipientIndex);
  }

  /**
    * @dev Remove recipient from the registry.
    * @param _recipient The address that receives funds.
    */
  function removeRecipient(address _recipient)
    external
    onlyOwner
  {
    require(recipients[_recipient].index != 0, 'Factory: Recipient is not in the registry');
    require(recipients[_recipient].removedAt == 0, 'Factory: Recipient already removed');
    recipients[_recipient].removedAt = block.number;
    vacantRecipientIndexes.push(recipients[_recipient].index);
    emit RecipientRemoved(_recipient);
  }

  function getRecipientIndex(
    address _recipient,
    uint256 _timestamp
  )
    external
    view
    returns (uint256)
  {
    Recipient memory recipient = recipients[_recipient];
    if (recipient.index == 0 || recipient.addedAt > _timestamp || (recipient.removedAt != 0 && recipient.removedAt <= _timestamp)) {
      // Return 0 if recipient is not in the registry
      // or added after a given time
      // or had been already removed by a given time
      return 0;
    } else {
      return recipient.index;
    }
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
    SnarkVerifier _batchUstVerifier,
    SnarkVerifier _qvtVerifier,
    uint256 _signUpDuration,
    uint256 _votingDuration
  )
    external
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
      _batchUstVerifier,
      _qvtVerifier,
      _signUpDuration,
      _votingDuration
    );
  }

  /**
    * @dev Deploy new funding round.
    */
  function deployNewRound()
    external
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
      coordinator,
      coordinatorPubKey
    );
    rounds.push(newRound);
    emit RoundStarted(address(newRound));
    return newRound;
  }

  /**
    * @dev Deploy MACI instance and link it to the current round.
    */
  function deployMaci()
    external
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
    * @param _totalSpent Total amount of spent voice credits.
    * @param _totalSpentSalt The salt.
    */
  function transferMatchingFunds(
    uint256 _totalSpent,
    uint256 _totalSpentSalt
  )
    external
    onlyOwner
  {
    FundingRound currentRound = getCurrentRound();
    require(address(currentRound) != address(0), 'Factory: Funding round has not been deployed');
    uint256 matchingPoolSize = currentRound.nativeToken().balanceOf(address(this));
    if (matchingPoolSize > 0) {
      nativeToken.transfer(address(currentRound), matchingPoolSize);
    }
    currentRound.finalize(matchingPoolSize, _totalSpent, _totalSpentSalt);
    emit RoundFinalized(address(currentRound));
  }

  /**
    * @dev Set token in which contributions are accepted.
    * @param _token Address of the token contract.
    */
  function setToken(address _token)
    external
    onlyOwner
  {
    nativeToken = ERC20Detailed(_token);
    emit TokenChanged(_token);
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
    emit CoordinatorChanged(_coordinator);
  }

  function setCoordinator(
    address _coordinator,
    PubKey calldata _coordinatorPubKey
  )
    external
    onlyOwner
  {
    _setCoordinator(_coordinator, _coordinatorPubKey);
  }

  function coordinatorQuit()
    external
    onlyCoordinator
  {
    // The fact that they quit is obvious from
    // the address being 0x0
    _setCoordinator(address(0), PubKey(0, 0));
  }

  modifier onlyCoordinator() {
    require(msg.sender == coordinator, 'Sender is not the coordinator');
    _;
  }
}

pragma solidity ^0.5.8;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/ownership/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol';
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';

import 'maci-contracts/sol/MACI.sol';
import 'maci-contracts/sol/MACISharedObjs.sol';
import 'maci-contracts/sol/gatekeepers/SignUpGatekeeper.sol';
import 'maci-contracts/sol/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol';

import './verifiedUserRegistry/IVerifiedUserRegistry.sol';
import './IRecipientRegistry.sol';
import './MACIFactory.sol';
import './FundingRound.sol';

contract FundingRoundFactory is Ownable, MACISharedObjs, IRecipientRegistry {
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
  IVerifiedUserRegistry public verifiedUserRegistry;
  PubKey public coordinatorPubKey;

  FundingRound[] private rounds;

  mapping(address => Recipient) private recipients;
  uint256[] private vacantRecipientIndexes;

  // Events
  event MatchingPoolContribution(address indexed _sender, uint256 _amount);
  event RecipientAdded(address indexed _recipient, string _metadata, uint256 _index);
  event RecipientRemoved(address indexed _recipient);
  event RoundStarted(address _round);
  event RoundFinalized(address _round);
  event TokenChanged(address _token);
  event CoordinatorChanged(address _coordinator);

  constructor(
    MACIFactory _maciFactory,
    IVerifiedUserRegistry _verifiedUserRegistry
  )
    public
  {
    maciFactory = _maciFactory;
    verifiedUserRegistry = _verifiedUserRegistry;
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
    uint256 _atBlock
  )
    external
    view
    returns (uint256)
  {
    Recipient memory recipient = recipients[_recipient];
    if (recipient.index == 0 || recipient.addedAt > _atBlock || (recipient.removedAt != 0 && recipient.removedAt <= _atBlock)) {
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
  {
    require(maciFactory.owner() == address(this), 'Factory: MACI factory is not owned by FR factory');
    require(address(nativeToken) != address(0), 'Factory: Native token is not set');
    require(coordinator != address(0), 'Factory: No coordinator');
    FundingRound currentRound = getCurrentRound();
    require(
      address(currentRound) == address(0) || currentRound.isFinalized(),
      'Factory: Current round is not finalized'
    );
    FundingRound newRound = new FundingRound(
      nativeToken,
      verifiedUserRegistry,
      this,
      coordinator
    );
    rounds.push(newRound);
    MACI maci = maciFactory.deployMaci(
      SignUpGatekeeper(newRound),
      InitialVoiceCreditProxy(newRound),
      coordinatorPubKey
    );
    newRound.setMaci(maci);
    emit RoundStarted(address(newRound));
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

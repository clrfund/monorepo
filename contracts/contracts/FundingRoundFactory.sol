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

import './verifiedUserRegistry/IVerifiedUserRegistry.sol';
import './recipientRegistry/IRecipientRegistry.sol';
import './MACIFactory.sol';
import './FundingRound.sol';

contract FundingRoundFactory is Ownable, MACISharedObjs {
  using SafeERC20 for ERC20;

  // State
  address public coordinator;

  ERC20 public nativeToken;
  MACIFactory public maciFactory;
  IVerifiedUserRegistry public verifiedUserRegistry;
  IRecipientRegistry public recipientRegistry;
  PubKey public coordinatorPubKey;

  FundingRound[] private rounds;

  // Events
  event MatchingPoolContribution(address indexed _sender, uint256 _amount);
  event RoundStarted(address _round);
  event RoundFinalized(address _round);
  event TokenChanged(address _token);
  event CoordinatorChanged(address _coordinator);

  constructor(
    MACIFactory _maciFactory,
    IVerifiedUserRegistry _verifiedUserRegistry,
    IRecipientRegistry _recipientRegistry
  )
    public
  {
    maciFactory = _maciFactory;
    verifiedUserRegistry = _verifiedUserRegistry;
    recipientRegistry = _recipientRegistry;
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
      recipientRegistry,
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
    currentRound.finalize(_totalSpent, _totalSpentSalt);
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
    nativeToken = ERC20(_token);
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

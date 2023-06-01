// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.10;

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import {EnumerableSet} from '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';

// Import ownable from OpenZeppelin contracts

import {MACI} from 'maci-contracts/contracts/MACI.sol';
import {SignUpGatekeeper} from 'maci-contracts/contracts/gatekeepers/SignUpGatekeeper.sol';
import {InitialVoiceCreditProxy} from 'maci-contracts/contracts/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol';
import {VkRegistry} from "maci-contracts/contracts/VkRegistry.sol";
import {TopupCredit} from "maci-contracts/contracts/TopupCredit.sol";
import {Params} from 'maci-contracts/contracts/Params.sol';

import './userRegistry/IUserRegistry.sol';
import './recipientRegistry/IRecipientRegistry.sol';
import './MACIFactory.sol';
import './FundingRound.sol';
import "./OwnableUpgradeable.sol";

contract ClrFund is OwnableUpgradeable, DomainObjs, Params, SignUpGatekeeper, InitialVoiceCreditProxy {
  using EnumerableSet for EnumerableSet.AddressSet;
  using SafeERC20 for ERC20;

  // State
  address public coordinator;

  ERC20 public nativeToken;
  MACI public maci;

  IUserRegistry public userRegistry;
  IRecipientRegistry public recipientRegistry;
  PubKey public coordinatorPubKey;

  EnumerableSet.AddressSet private fundingSources;
  FundingRound[] private rounds;
  mapping(address => bool) public contributors;

  // Events
  event FundingSourceAdded(address _source);
  event FundingSourceRemoved(address _source);
  event RoundStarted(address _round);
  event RoundFinalized(address _round);
  event TokenChanged(address _token);
  event CoordinatorChanged(address _coordinator);

  function init(
    MACI _maci,
    VkRegistry vkRegistry,
    MessageAqFactory messageAqFactory,
    TopupCredit topupCredit
  ) 
    external
  {
    __Ownable_init();
    maci = _maci;
    maci.init(vkRegistry, messageAqFactory, topupCredit);
  }

  /**
    * @dev Set registry of verified users.
    * @param _userRegistry Address of a user registry.
    */
  function setUserRegistry(IUserRegistry _userRegistry)
    external
    onlyOwner
  {
    userRegistry = _userRegistry;
  }

  /**
    * @dev Set recipient registry.
    * @param _recipientRegistry Address of a recipient registry.
    * @param maxVoteOptions Maximum number of recipients to accept
    */
  function setRecipientRegistry(IRecipientRegistry _recipientRegistry, uint256 maxVoteOptions)
    external
    onlyOwner
  {
    recipientRegistry = _recipientRegistry;
    recipientRegistry.setMaxRecipients(maxVoteOptions);
  }

  /**
    * @dev Add matching funds source.
    * @param _source Address of a funding source.
    */
  function addFundingSource(address _source)
    external
    onlyOwner
  {
    bool result = fundingSources.add(_source);
    require(result, 'Factory: Funding source already added');
    emit FundingSourceAdded(_source);
  }

  /**
    * @dev Remove matching funds source.
    * @param _source Address of the funding source.
    */
  function removeFundingSource(address _source)
    external
    onlyOwner
  {
    bool result = fundingSources.remove(_source);
    require(result, 'Factory: Funding source not found');
    emit FundingSourceRemoved(_source);
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

/* TODO - init vkRegistry here..
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
*/

  /**
    * @dev Deploy new funding round.
    */
  function deployNewRound(
    uint256 maxVoteOptions,
    uint256 duration,
    MaxValues memory maxValues,
    TreeDepths memory treeDepths
  )
    external
    onlyOwner
  {
    require(address(maci) != address(0), 'Factory: MACI not deployed');
    require(address(userRegistry) != address(0), 'Factory: User registry is not set');
    require(address(recipientRegistry) != address(0), 'Factory: Recipient registry is not set');
    require(address(nativeToken) != address(0), 'Factory: Native token is not set');
    require(coordinator != address(0), 'Factory: No coordinator');
    FundingRound currentRound = getCurrentRound();
    require(
      address(currentRound) == address(0) || currentRound.isFinalized(),
      'Factory: Current round is not finalized'
    );
    // Make sure that the max number of recipients is set correctly
    recipientRegistry.setMaxRecipients(maxVoteOptions);

    // deploy a new poll in MACI
    // TODO set the poll later after retrieving the address from the event
    maci.deployPoll(
      duration,
      maxValues,
      treeDepths,
      coordinatorPubKey
    );

    // Deploy funding round
    FundingRound newRound = new FundingRound(
      nativeToken,
      userRegistry,
      recipientRegistry,
      coordinator
    );
    rounds.push(newRound);
    emit RoundStarted(address(newRound));
  }

  /**
    * @dev Get total amount of matching funds.
    */
  function getMatchingFunds(ERC20 token)
    external
    view
    returns (uint256)
  {
    uint256 matchingPoolSize = token.balanceOf(address(this));
    for (uint256 index = 0; index < fundingSources.length(); index++) {
      address fundingSource = fundingSources.at(index);
      uint256 allowance = token.allowance(fundingSource, address(this));
      uint256 balance = token.balanceOf(fundingSource);
      uint256 contribution = allowance < balance ? allowance : balance;
      matchingPoolSize += contribution;
    }
    return matchingPoolSize;
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
    ERC20 roundToken = currentRound.nativeToken();
    // Factory contract is the default funding source
    uint256 matchingPoolSize = roundToken.balanceOf(address(this));
    if (matchingPoolSize > 0) {
      roundToken.safeTransfer(address(currentRound), matchingPoolSize);
    }
    // Pull funds from other funding sources
    for (uint256 index = 0; index < fundingSources.length(); index++) {
      address fundingSource = fundingSources.at(index);
      uint256 allowance = roundToken.allowance(fundingSource, address(this));
      uint256 balance = roundToken.balanceOf(fundingSource);
      uint256 contribution = allowance < balance ? allowance : balance;
      if (contribution > 0) {
        roundToken.safeTransferFrom(fundingSource, address(currentRound), contribution);
      }
    }
    currentRound.finalize(_totalSpent, _totalSpentSalt);
    emit RoundFinalized(address(currentRound));
  }

  /**
    * @dev Cancel current round.
    */
   function cancelCurrentRound()
    external
    onlyOwner
  {
    FundingRound currentRound = getCurrentRound();
    require(address(currentRound) != address(0), 'Factory: Funding round has not been deployed');
    require(!currentRound.isFinalized(), 'Factory: Current round is finalized');
    currentRound.cancel();
    emit RoundFinalized(address(currentRound));
  }

  /**
    * @dev Set token in which contributions are accepted.
    * @param _token Address of the token contract.
    */
  function setToken(address _token)
    internal
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
  function setCoordinator(
    address _coordinator,
    PubKey memory _coordinatorPubKey
  )
    external
    onlyOwner
  {
    coordinator = _coordinator;
    coordinatorPubKey = _coordinatorPubKey;
    emit CoordinatorChanged(_coordinator);
  }

  function coordinatorQuit()
    external
    onlyCoordinator
  {
    // The fact that they quit is obvious from
    // the address being 0x0
    coordinator = address(0);
    coordinatorPubKey = PubKey(0, 0);
    FundingRound currentRound = getCurrentRound();
    if (address(currentRound) != address(0) && !currentRound.isFinalized()) {
      currentRound.cancel();
      emit RoundFinalized(address(currentRound));
    }
    emit CoordinatorChanged(address(0));
  }

  modifier onlyCoordinator() {
    require(msg.sender == coordinator, 'Factory: Sender is not the coordinator');
    _;
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
    override
  {
    require(address(userRegistry) != address(0), 'FundingRound: User registry not deployed');
    require(msg.sender == address(maci), 'FundingRound: Only MACI contract can register voters');
    address user = abi.decode(_data, (address));
    bool verified = userRegistry.isVerifiedUser(user);
    require(verified, 'FundingRound: User has not been verified');
    require(!contributors[user], 'FundingRound: User already registered');
    contributors[user] = true;
    // maci.signup();
  }

    /**
    * @dev Get the amount of voice credits for a given address.
    * This function is a part of the InitialVoiceCreditProxy interface.
    *
    */
  function getVoiceCredits(
    address /* _caller */,
    bytes memory /* _data // Encoded address of contributor */
  )
    public
    override
    pure
    returns (uint256)
  {
    // always zero as users do not contribute on signup.
    // They only contribute during a funding round when they are ready to vote,
    // via the MACI topup function
    return 0;
  }
}

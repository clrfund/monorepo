// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.10;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';

// Import ownable from OpenZeppelin contracts

import {MACI} from 'maci-contracts/contracts/MACI.sol';
import {SnarkCommon} from 'maci-contracts/contracts/crypto/SnarkCommon.sol';
import {SignUpGatekeeper} from "maci-contracts/contracts/gatekeepers/SignUpGatekeeper.sol";
import {InitialVoiceCreditProxy} from "maci-contracts/contracts/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol";
import {Params} from 'maci-contracts/contracts/Params.sol';
import {PollFactory} from 'maci-contracts/contracts/Poll.sol';
import {DomainObjs} from 'maci-contracts/contracts/DomainObjs.sol';

import './userRegistry/IUserRegistry.sol';
import './recipientRegistry/IRecipientRegistry.sol';
import './MACIFactory.sol';
import './FundingRound.sol';
import './OwnableUpgradeable.sol';

contract ClrFund is OwnableUpgradeable, SnarkCommon, Params, DomainObjs {
  using EnumerableSet for EnumerableSet.AddressSet;
  using SafeERC20 for ERC20;

  // State
  address public coordinator;

  ERC20 public nativeToken;
  MACIFactory public maciFactory;
  IUserRegistry public userRegistry;
  IRecipientRegistry public recipientRegistry;
  PubKey public coordinatorPubKey;

  EnumerableSet.AddressSet private fundingSources;
  FundingRound[] private rounds;

  // Events
  event FundingSourceAdded(address _source);
  event FundingSourceRemoved(address _source);
  event RoundStarted(address _round);
  event RoundFinalized(address _round);
  event TokenChanged(address _token);
  event CoordinatorChanged(address _coordinator);

  function init(
    MACIFactory _maciFactory
  ) 
    external
  {
    __Ownable_init();
    maciFactory = _maciFactory;
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
    */
  function setRecipientRegistry(IRecipientRegistry _recipientRegistry)
    external
    onlyOwner
  {
    recipientRegistry = _recipientRegistry;
    (, uint256 maxVoteOptions) = maciFactory.maxValues();
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

  function setMaciParameters(
    uint8 _messageTreeDepth,
    uint8 _voteOptionTreeDepth
    )
    external
    onlyOwner
  {
    maciFactory.setMaciParameters(
      _messageTreeDepth,
      _voteOptionTreeDepth
    );
  }

  /**
    * @dev Deploy new funding round.
    * @param duration The poll duration in seconds
    * @param vkRegistry The VkRegistry contract address
    */
  function deployNewRound(uint256 duration, address vkRegistry, address pollFactory, TreeDepths calldata treeDepths)
    external
    onlyOwner
  {
    require(maciFactory.owner() == address(this), 'Factory: MACI factory is not owned by FR factory');
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
    (uint256 maxMessages, uint256 maxVoteOptions) = maciFactory.maxValues();
    recipientRegistry.setMaxRecipients(maxVoteOptions);
    // Deploy funding round and MACI contracts
    FundingRound newRound = new FundingRound(
      nativeToken,
      userRegistry,
      recipientRegistry,
      coordinator
    );
    rounds.push(newRound);
    MACI maci = maciFactory.deployMaci(
      SignUpGatekeeper(newRound),
      InitialVoiceCreditProxy(newRound),
      vkRegistry,
      pollFactory,
      address(nativeToken)
    );

    MaxValues memory maxValues = MaxValues(maxMessages, maxVoteOptions);
    maci.deployPoll(duration, maxValues, treeDepths, coordinatorPubKey);
    newRound.setMaci(maci);

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
}

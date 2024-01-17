// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.10;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';

import {Params} from 'maci-contracts/contracts/utilities/Params.sol';
import {DomainObjs} from 'maci-contracts/contracts/utilities/DomainObjs.sol';

import {IMACIFactory} from './interfaces/IMACIFactory.sol';
import './userRegistry/IUserRegistry.sol';
import './recipientRegistry/IRecipientRegistry.sol';
import {IFundingRound} from './interfaces/IFundingRound.sol';
import {OwnableUpgradeable} from './OwnableUpgradeable.sol';
import {IFundingRoundFactory} from './interfaces/IFundingRoundFactory.sol';
import {TopupToken} from './TopupToken.sol';

contract ClrFund is OwnableUpgradeable, DomainObjs, Params {
  using EnumerableSet for EnumerableSet.AddressSet;
  using SafeERC20 for ERC20;

  // State
  address public coordinator;

  ERC20 public nativeToken;
  IMACIFactory public maciFactory;
  IUserRegistry public userRegistry;
  IRecipientRegistry public recipientRegistry;
  PubKey public coordinatorPubKey;

  EnumerableSet.AddressSet private fundingSources;
  IFundingRound[] private rounds;

  IFundingRoundFactory public roundFactory;

  // Events
  event FundingSourceAdded(address _source);
  event FundingSourceRemoved(address _source);
  event RoundStarted(address _round);
  event RoundFinalized(address _round);
  event TokenChanged(address _token);
  event CoordinatorChanged(address _coordinator);
  event Initialized();
  event UserRegistrySet();
  event RecipientRegistrySet();
  event FundingRoundTemplateChanged();
  event FundingRoundFactorySet(address _roundFactory);
  event MaciFactorySet(address _maciFactory);

  // errors
  error FundingSourceAlreadyAdded();
  error FundingSourceNotFound();
  error AlreadyFinalized();
  error NotFinalized();
  error NotAuthorized();
  error NoCurrentRound();
  error NotOwnerOfMaciFactory();
  error InvalidFundingRoundFactory();
  error InvalidMaciFactory();
  error RecipientRegistryNotSet();

  /**
  * @dev Initialize clrfund instance with MACI factory and new round templates
   */
  function init(
    address _maciFactory,
    address _roundFactory
  ) 
    external
  {
    __Ownable_init();
    _setMaciFactory(_maciFactory);
    _setFundingRoundFactory(_roundFactory);

    emit Initialized();
  }

  /**
    * @dev Set MACI factory.
    * @param _maciFactory Address of a MACI factory.
    */
  function _setMaciFactory(address _maciFactory) private
  {
    if (_maciFactory == address(0)) revert InvalidMaciFactory();

    maciFactory = IMACIFactory(_maciFactory);

    emit MaciFactorySet(address(_maciFactory));
  }

  /**
    * @dev Set MACI factory.
    * @param _maciFactory Address of a MACI factory.
    */
  function setMaciFactory(address _maciFactory)
    external
    onlyOwner
  {
    _setMaciFactory(_maciFactory);
  }

  /**
  * @dev Set Funding found factory.
  * @param _roundFactory Factory Address of a funding round factory.
  */
  function _setFundingRoundFactory(address _roundFactory) private
  {
    if (_roundFactory == address(0)) revert InvalidFundingRoundFactory();

    roundFactory = IFundingRoundFactory(_roundFactory);

    emit FundingRoundFactorySet(address(roundFactory));
  }

  /**
  * @dev Set Funding found factory.
  * @param _roundFactory Factory Address of a funding round factory.
  */
  function setFundingRoundFactory(address _roundFactory)
  public
  onlyOwner
  {
    _setFundingRoundFactory(_roundFactory);
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

    emit UserRegistrySet();
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
    MaxValues memory maxValues = maciFactory.maxValues();
    recipientRegistry.setMaxRecipients(maxValues.maxVoteOptions);

    emit RecipientRegistrySet();
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
    if (!result) {
      revert FundingSourceAlreadyAdded();
    }
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
    if (!result) {
      revert FundingSourceNotFound();
    }
    emit FundingSourceRemoved(_source);
  }

  function getCurrentRound()
    public
    view
    returns (IFundingRound _currentRound)
  {
    if (rounds.length == 0) {
      return IFundingRound(address(0));
    }
    return rounds[rounds.length - 1];
  }

   /**
    * @dev Deploy new funding round.
    * @param duration The poll duration in seconds
    */
  function deployNewRound(
    uint256 duration
  )
    external
    onlyOwner
  {
    IFundingRound currentRound = getCurrentRound();
    if (address(currentRound) != address(0) && !currentRound.isFinalized()) {
      revert NotFinalized();
    }

    if (address(recipientRegistry) == address(0)) revert RecipientRegistryNotSet();

    // Make sure that the max number of recipients is set correctly
    MaxValues memory maxValues = maciFactory.maxValues();
    recipientRegistry.setMaxRecipients(maxValues.maxVoteOptions);

    // Deploy funding round and MACI contracts
    address newRound = roundFactory.deploy(duration, address(this));
    rounds.push(IFundingRound(newRound));

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
    uint256 _totalSpentSalt,
    uint256 _newResultCommitment,
    uint256 _perVOSpentVoiceCreditsHash
  )
    external
    onlyOwner
  {
    IFundingRound currentRound = getCurrentRound();
    requireCurrentRound(currentRound);

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
    currentRound.finalize(_totalSpent, _totalSpentSalt, _newResultCommitment, _perVOSpentVoiceCreditsHash);
    emit RoundFinalized(address(currentRound));
  }

  /**
    * @dev Cancel current round.
    */
   function cancelCurrentRound()
    external
    onlyOwner
  {
    IFundingRound currentRound = getCurrentRound();
    requireCurrentRound(currentRound);

    if (currentRound.isFinalized()) {
      revert AlreadyFinalized();
    }

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
    IFundingRound currentRound = getCurrentRound();
    if (address(currentRound) != address(0) && !currentRound.isFinalized()) {
      currentRound.cancel();
      emit RoundFinalized(address(currentRound));
    }
    emit CoordinatorChanged(address(0));
  }

  modifier onlyCoordinator() {
    if (msg.sender != coordinator) {
      revert NotAuthorized();
    }
    _;
  }

  function requireCurrentRound(IFundingRound currentRound) private pure {
    if (address(currentRound) == address(0)) {
      revert NoCurrentRound();
    }
  }
}

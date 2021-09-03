// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import '@openzeppelin/contracts/utils/EnumerableSet.sol';
import "@openzeppelin/contracts/utils/Create2.sol";

import 'maci-contracts/sol/MACI.sol';
import 'maci-contracts/sol/MACISharedObjs.sol';
import 'maci-contracts/sol/gatekeepers/SignUpGatekeeper.sol';
import 'maci-contracts/sol/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol';

import './userRegistry/IUserRegistry.sol';
import './recipientRegistry/IRecipientRegistry.sol';
import './MACIFactory.sol';
import './FundingRound.sol';
import './proxies/FundingRoundProxy.sol';

contract FundingRoundFactory is Ownable, MACISharedObjs {
  using EnumerableSet for EnumerableSet.AddressSet;
  using SafeERC20 for ERC20;

  // State
  address public coordinator;

  ERC20 public nativeToken;
  MACIFactory public maciFactory;
  IUserRegistry public userRegistry;
  IRecipientRegistry public recipientRegistry;
  PubKey public coordinatorPubKey;
  FundingRound singleton;


  EnumerableSet.AddressSet private fundingSources;
  address[] private rounds;

  // Events
  event FundingSourceAdded(address _source);
  event FundingSourceRemoved(address _source);
  event RoundStarted(address _round);
  event RoundFinalized(address _round);
  event TokenChanged(address _token);
  event CoordinatorChanged(address _coordinator);

  constructor(
    MACIFactory _maciFactory,
    FundingRound _singleton
  )
    public
  {
    maciFactory = _maciFactory;
    singleton = _singleton;
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
    (,, uint256 maxVoteOptions) = maciFactory.maxValues();
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
    returns (address _currentRound)
  {
    if (rounds.length == 0) {
      return address(0);
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
    require(address(userRegistry) != address(0), 'Factory: User registry is not set');
    require(address(recipientRegistry) != address(0), 'Factory: Recipient registry is not set');
    require(address(nativeToken) != address(0), 'Factory: Native token is not set');
    require(coordinator != address(0), 'Factory: No coordinator');
    address currentRound = getCurrentRound();
    (bool success, bytes memory result) = currentRound.call(abi.encodeWithSignature("isFinalized()"));
    require(success, "Factory: Delegate Proxy Call Failed");
    require(
      address(currentRound) == address(0) || abi.decode(result, (bool)),
      'Factory: Current round is not finalized'
    );
    // Make sure that the max number of recipients is set correctly
    (,, uint256 maxVoteOptions) = maciFactory.maxValues();
    recipientRegistry.setMaxRecipients(maxVoteOptions);
    // Deploy funding round and MACI contracts
    // If the initializer changes the proxy address should change too. Hashing the initializer data is cheaper than just concatinating it
    bytes memory deploymentData = abi.encodePacked(type(FundingRoundProxy).creationCode, abi.encode(address(singleton)));
    // solhint-disable-next-line no-inline-assembly
    address minimalProxy = Create2.deploy(
            0,
            keccak256(abi.encodePacked(block.timestamp)),
            deploymentData
    );
    rounds.push(minimalProxy);
    (success, ) = minimalProxy.call(abi.encodeWithSignature(
                "init(address)",
                address(nativeToken),
                address(userRegistry),
                address(recipientRegistry),
                address(coordinator)
      ));
    require(success, "Factory: Delegate Proxy Call Failed");
    MACI maci = maciFactory.deployMaci(
      SignUpGatekeeper(singleton),
      InitialVoiceCreditProxy(singleton),
      coordinator,
      coordinatorPubKey
    );
    singleton.setMaci(maci);
    emit RoundStarted(address(singleton));
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
    address currentRound = getCurrentRound();
    require(address(currentRound) != address(0), 'Factory: Funding round has not been deployed');
    (bool success, bytes memory result) = currentRound.call(abi.encodeWithSignature("nativeToken()"));
    ERC20 roundToken = ERC20(abi.decode(result, (address)));
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
    (success, ) = currentRound.call(abi.encodeWithSignature("finalize(uint256, uint256)", _totalSpent, _totalSpentSalt));
    require(success, "Factory: Delegate Proxy Call Failed");
    emit RoundFinalized(address(currentRound));
  }

  /**
    * @dev Cancel current round.
    */
   function cancelCurrentRound()
    external
    onlyOwner
  {
    address currentRound = getCurrentRound();
    require(address(currentRound) != address(0), 'Factory: Funding round has not been deployed');
    (bool success, bytes memory result) = currentRound.call(abi.encodeWithSignature("isFinalized()"));
    require(success, "Factory: Delegate Proxy Call Failed");
    require(!abi.decode(result, (bool)), 'Factory: Current round is finalized');
    (success ,) = currentRound.call(abi.encodeWithSignature("cancel()"));
    require(success, "Factory: Delegate Proxy Call Failed");
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
    address currentRound = getCurrentRound();
    (bool success, bytes memory result) = currentRound.call(abi.encodeWithSignature("isFinalized()"));
    require(success, "Factory: Delegate Proxy Call Failed");
    if (address(currentRound) != address(0) && !abi.decode(result, (bool))) {
      (success, ) = currentRound.call(abi.encodeWithSignature("cancel()"));
      require(success, "Factory: Delegate Proxy Call Failed");
      emit RoundFinalized(address(currentRound));
    }
    emit CoordinatorChanged(address(0));
  }

  modifier onlyCoordinator() {
    require(msg.sender == coordinator, 'Factory: Sender is not the coordinator');
    _;
  }
}

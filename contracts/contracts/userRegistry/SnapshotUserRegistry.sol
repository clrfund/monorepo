// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.6.12;

import '@openzeppelin/contracts/access/Ownable.sol';

import './IUserRegistry.sol';

import {RLPReader} from "solidity-rlp/contracts/RLPReader.sol";
import {StateProofVerifier} from "./StateProofVerifier.sol";


/**
 * @dev A user registry based on a specific block snapshot
 */
contract SnapshotUserRegistry is Ownable, IUserRegistry {
  using RLPReader for RLPReader.RLPItem;
  using RLPReader for bytes;

  enum Status {
    Unverified,
    Verified,
    Rejected
  }

  // User must hold this token at a specific block to be added to this registry
  address public token;

  // 
  bytes32 public blockHash;

  // The storage root for the token at a specified block
  bytes32 public storageRoot;

  // The slot index for the token balance
  uint256 public storageSlot;

  // The minimum balance the user must hold to be verified 
  uint256 public minBalance = 1;

  mapping(address => Status) public users;
  
  // Events
  event UserAdded(address indexed _user);
  event UserRejected(address indexed _user);
  event UserReset(address indexed _user);
  event MinBalanceChanged(uint256 newBalance);

  /**
  * @dev Set the storage root for the token contract at a specific block
  * @param _tokenAddress Token address
  * @param _blockHash Block hash
  * @param _stateRoot Block state root
  * @param _slotIndex slot index of the token balances storage
  * @param _accountProofRlpBytes RLP encoded accountProof from eth_getProof
  */
  function setStorageRoot(
    address      _tokenAddress,
    bytes32      _blockHash,
    bytes32      _stateRoot,
    uint256      _slotIndex,
    bytes memory _accountProofRlpBytes
  )
    external
    onlyOwner
  {
    
    RLPReader.RLPItem[] memory proof = _accountProofRlpBytes.toRlpItem().toList();
    bytes32 addressHash = keccak256(abi.encodePacked(uint160(_tokenAddress)));

    StateProofVerifier.Account memory account = StateProofVerifier.extractAccountFromProof(
        addressHash,
        _stateRoot,
        proof
    );

    token = _tokenAddress;
    blockHash = _blockHash;
    storageRoot = account.storageRoot;
    storageSlot = _slotIndex;
  }

  /**
    * @dev Add a verified user to the registry.
    * @param _user user account address
    * @param storageProofRlpBytes RLP-encoded storage proof from eth_getProof
    */
  function addUser(
    address _user,
    bytes memory storageProofRlpBytes
  )
    external
  {
    require(storageRoot != bytes32(0), 'UserRegistry: Registry is not initialized');
    require(_user != address(0), 'UserRegistry: User address is zero');
    require(users[_user] == Status.Unverified, 'UserRegistry: User already added');

    RLPReader.RLPItem[] memory proof = storageProofRlpBytes.toRlpItem().toList();

    bytes32 userSlotHash = keccak256(abi.encodePacked(uint256(uint160(_user)), storageSlot));
    bytes32 proofPath = keccak256(abi.encodePacked(userSlotHash));
    StateProofVerifier.SlotValue memory slotValue = StateProofVerifier.extractSlotValueFromProof(proofPath, storageRoot, proof);
    require(slotValue.exists, 'UserRegistry: User not qualified as a contributor');
    require(slotValue.value >= minBalance , 'UserRegistry: User did not meet the minimum balance requirement');
    
    users[_user] = Status.Verified;
    emit UserAdded(_user);
  }

  /**
    * @dev Check if the user is verified.
    */
  function isVerifiedUser(address _user)
    override
    external
    view
    returns (bool)
  {
    return users[_user] == Status.Verified;
  }

  /**
   * @dev Change the minimum balance a user must hold to be verified
   * @param newMinBalance The new minimum balance
   */
  function setMinBalance(uint256 newMinBalance) external onlyOwner {
    require(newMinBalance > 0, 'The minimum balance must be greater than 0');
    
    minBalance = newMinBalance;

    emit MinBalanceChanged(minBalance);
  }

  /**
   * @dev Reject user
    * @param _user user account address
   */
  function rejectUser(address _user) external onlyOwner {
    users[_user] = Status.Rejected;
    emit UserRejected(_user);
  }

  /**
   * @dev Reset user status so that it can be added again
    * @param _user user account address
   */
  function resetUser(address _user) external onlyOwner {
    delete users[_user];
    emit UserReset(_user);
  }
}
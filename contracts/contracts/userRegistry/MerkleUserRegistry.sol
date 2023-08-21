// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.6.12;

import '@openzeppelin/contracts/access/Ownable.sol';

import './IUserRegistry.sol';
import {MerkleProof} from "../utils/cryptography/MerkleProof.sol";


/**
 * @dev A merkle user registry add users to the registry based on 
 * a successful verification against the merkle root set by
 * the funding round coordinator.
 */
contract MerkleUserRegistry is Ownable, IUserRegistry {
  mapping(address => bool) private users;
  bytes32 public merkleRoot;

  // Events
  event UserAdded(address indexed _user);
  event UserRemoved(address indexed _user);

  function setMerkleRoot(bytes32 root) external onlyOwner {
    require(root != bytes32(0), 'MerkleUserRegistry: Merkle root is zero');
    merkleRoot = root;
  }

  /**
    * @dev Add verified unique user to the registry.
    */
  function addUser(bytes32[] calldata proof, address _user)
    external
    onlyOwner
  {
    require(merkleRoot != bytes32(0), 'MerkleUserRegistry: Merkle root is not initialized');
    require(_user != address(0), 'MerkleUserRegistry: User address is zero');
    require(!users[_user], 'MerkleUserRegistry: User already verified');

    // verifies user against the merkle root
    bytes32 leaf = keccak256(abi.encodePacked(keccak256(abi.encode(_user))));
    bool verified = MerkleProof.verifyCalldata(proof, merkleRoot, leaf);
    require(verified, 'MerkleUserRegistry: User is not authorized');

    users[_user] = true;
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
    return users[_user];
  }
}

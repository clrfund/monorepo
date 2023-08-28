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

  // verified users grouped by merkleRoot
  // merkleRoot -> user -> status
  mapping(bytes32 => mapping(address => bool)) private users;

  // merkle root
  bytes32 public merkleRoot;

  // ipfs hash of the merkle tree file
  string public merkleHash;

  // Events
  event UserAdded(address indexed _user, bytes32 indexed merkleRoot);
  event MerkleRootChanged(bytes32 indexed root, string ipfsHash);

  /**
    * @dev Set the merkle root used to verify users
    * @param root Merkle root
    * @param ipfsHash The IPFS hash of the merkle tree file
   */
  function setMerkleRoot(bytes32 root, string calldata ipfsHash) external onlyOwner {
    require(root != bytes32(0), 'MerkleUserRegistry: Merkle root is zero');
    require(bytes(ipfsHash).length != 0, 'MerkleUserRegistry: Merkle hash is empty string');

    merkleRoot = root;
    merkleHash = ipfsHash;

    emit MerkleRootChanged(root, ipfsHash);
  }

  /**
    * @dev Add verified unique user to the registry.
    */
  function addUser(address _user, bytes32[] calldata proof)
    external
  {
    require(merkleRoot != bytes32(0), 'MerkleUserRegistry: Merkle root is not initialized');
    require(_user != address(0), 'MerkleUserRegistry: User address is zero');
    require(!users[merkleRoot][_user], 'MerkleUserRegistry: User already verified');

    // verifies user against the merkle root
    bytes32 leaf = keccak256(abi.encodePacked(keccak256(abi.encode(_user))));
    bool verified = MerkleProof.verifyCalldata(proof, merkleRoot, leaf);
    require(verified, 'MerkleUserRegistry: User is not authorized');

    users[merkleRoot][_user] = true;
    emit UserAdded(_user, merkleRoot);
    
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
    return users[merkleRoot][_user];
  }
}

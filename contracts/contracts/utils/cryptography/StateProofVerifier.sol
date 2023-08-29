// SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

import {RLPReader} from 'solidity-rlp/contracts/RLPReader.sol';
import {MerklePatriciaProofVerifier} from './MerklePatriciaProofVerifier.sol';

/**
 * @title A helper library for verification of Merkle Patricia account and state proofs.
 *
 * Modified from https://github.com/lidofinance/curve-merkle-oracle/blob/main/contracts/StateProofVerifier.sol
 * git commit hash 1033b3e84142317ffd8f366b52e489d5eb49c73f
 *
 */
library StateProofVerifier {
    using RLPReader for RLPReader.RLPItem;
    using RLPReader for bytes;

    struct Account {
        bool exists;
        uint256 nonce;
        uint256 balance;
        bytes32 storageRoot;
        bytes32 codeHash;
    }

    struct SlotValue {
        bool exists;
        uint256 value;
    }

    /**
     * @notice Verifies Merkle Patricia proof of an account and extracts the account fields.
     *
     * @param _addressHash Keccak256 hash of the address corresponding to the account.
     * @param _stateRootHash MPT root hash of the Ethereum state trie.
     */
    function extractAccountFromProof(
        bytes32 _addressHash, // keccak256(abi.encodePacked(address))
        bytes32 _stateRootHash,
        RLPReader.RLPItem[] memory _proof
    )
        internal pure returns (Account memory)
    {
        bytes memory acctRlpBytes = MerklePatriciaProofVerifier.extractProofValue(
            _stateRootHash,
            abi.encodePacked(_addressHash),
            _proof
        );

        Account memory account;

        if (acctRlpBytes.length == 0) {
            return account;
        }

        RLPReader.RLPItem[] memory acctFields = acctRlpBytes.toRlpItem().toList();
        require(acctFields.length == 4, 'ProofVerifier: Invalid account length');

        account.exists = true;
        account.nonce = acctFields[0].toUint();
        account.balance = acctFields[1].toUint();
        account.storageRoot = bytes32(acctFields[2].toUint());
        account.codeHash = bytes32(acctFields[3].toUint());

        return account;
    }


    /**
     * @notice Verifies Merkle Patricia proof of a slot and extracts the slot's value.
     *
     * @param _slotHash Keccak256 hash of the slot position.
     * @param _storageRootHash MPT root hash of the account's storage trie.
     */
    function extractSlotValueFromProof(
        bytes32 _slotHash,
        bytes32 _storageRootHash,
        RLPReader.RLPItem[] memory _proof
    )
        internal pure returns (SlotValue memory)
    {
        bytes memory valueRlpBytes = MerklePatriciaProofVerifier.extractProofValue(
            _storageRootHash,
            abi.encodePacked(_slotHash),
            _proof
        );

        SlotValue memory value;

        if (valueRlpBytes.length != 0) {
            value.exists = true;
            value.value = valueRlpBytes.toRlpItem().toUint();
        }

        return value;
    }

}

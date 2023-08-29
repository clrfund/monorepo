## Description

### BrightIdUserRegistry

This is a contract to register verified users context ids by BrightID node's verification data, and be able to query a user verification.
This contract consist of:

- Set BrightID settings <br />`function setSettings(bytes32 _context, address _verifier) external onlyOwner;`
- Check a user is verified or not <br />`function isVerifiedUser(address _user) override external view returns (bool);`
- Register a user by BrightID node's verification data <br />`function register(bytes32 _context, address[] calldata _addrs, uint _timestamp, uint8 _v, bytes32 _r, bytes32 _s external;`


### SnapshotUserRegistry

This is a contract to register verified users by the proof that the users held the minimum amount of tokens at a given block.

The main functions:

- Set storage root <br />`function setStorageRoot(address tokenAddress, bytes32 stateRoot uint256 slotIndex, bytes memory accountProofRlpBytes) external onlyOwner;`
- Check a user is verified or not <br />`function isVerifiedUser(address _user) override external view returns (bool);`
- Add a user with the proof from eth_getProof <br />`function addUser(address _user, bytes memory storageProofRlpBytes) external;`

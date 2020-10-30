## Description 
This is a contract to register verified users context ids by BrightID node's verification data, and be able to query a user verification.
This contract consist of:
-  Set BrightID settings  <br />`function setSettings(bytes32 _context, address _verifier) external onlyOwner;`
- Check a user is verified or not  <br />`function isVerifiedUser(address _user) override external view returns (bool);`
- Register a user by BrightID node's verification data <br />`function register(bytes32 _context, address[] calldata _addrs, uint _timestamp, uint8 _v, bytes32 _r, bytes32 _s external;`

## Demonstration
[Demo contract on the Rinkeby](https://rinkeby.etherscan.io/address/0xf99e2173db1f341a947ce9bd7779af2245309f91)
Sample of Registered Data:
```
{
  "data": {
    "unique": true,
    "context": "clr.fund",
    "contextIds": [
      "0xb1775295f3b250c2849366801149479471fa7362",
      "0x9ed6d9086f5ee9edc14dd2caca44d65ee8cabdde",
      "0x79af508c9698076bc1c2dfa224f7829e9768b11e"
    ],
    "sig": {
      "r": "ec6a9c3e10f238acb757ceea5507cf33366acd05356d513ca80cd1148297d079",
      "s": "0e918c709ea7a458f7c95769145f475df94c01f3bc9e9ededf38153aa5b9041b",
      "v": 28
    },
    "timestamp": 1602353670884,
    "publicKey": "03ab573225151072be57d4808861e0f706595fb143c71630e188051fe4a6bda594"
  }
}
```
You can see the contract settings [here](https://rinkeby.etherscan.io/address/0xf99e2173db1f341a947ce9bd7779af2245309f91#readContract)

You can update the BrightID settings and test register [here](https://rinkeby.etherscan.io/address/0xf99e2173db1f341a947ce9bd7779af2245309f91#writeContract)

 ## Deploy contract
This contract needs tow constructor arguments
- `context bytes32` <br /> BrightID context used for verifying users.

- `verifier address` <br /> BrightID verifier address that signs BrightID verifications.

## Points
We can simply use an ERC20 token as authorization for the verifiers to be able have multiple verifiers.

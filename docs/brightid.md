# BrightID setup

We use BrightID as part of the user verification and registration flow to become a contributor.

In order to enable BrightID in the app, follow these steps:

**#1 enable the BrightID user registry**

```.sh
# /vue-app/.env
VITE_USER_REGISTRY_TYPE=brightid

# /contracts/.env
USER_REGISTRY_TYPE=brightid
```

**#2 enable the BrightID context you want to use**

Available envs:

| Network/Env | Context |
| ----------- | ------- |
| arbitrum | clrfund-arbitrum |
| arbitrum rinkeby | clrfund-arbitrum-rinkeby |
| arbitrum sepolia | clrfund-arbitrum-goerli |
| goerli | clrfund-goerli |
| xdai | clrfund-gnosischain |

```.sh
# /vue-app/.env
VITE_BRIGHTID_CONTEXT={CONTEXT}

# /contracts/.env
BRIGHTID_CONTEXT={CONTEXT}
```

Note: the BrightID context is specific to the BrightID network - it's independent from the Ethereum network you choose to run the app on. It refers to the BrightID app context where you want to burn sponsorship tokens.

The BrightID context can be found here: https://apps.brightid.org/#nodes

[Learn more about context in the BrightID docs](https://dev.brightid.org/docs/guides/ZG9jOjQxNTE1NDU-basic-integration).

**#3 configure the BrightID verifier address and node url**
The BrightID verification status is signed by the BrightID node. When deploying the BrightIdUserRegistry contract, make sure the BRIGHTID_VERIFIER_ADDR is set to the verifier address of BrightID node that the clrfund app is configured to connect to. The verifier address can be updated after the BrightIdUserRegistry is deployed. The verifier address can be found from the node url. For example, the verifier address is the `ethSigningAddress` from https://brightid.clr.fund.

```.sh
# /vue-app/.env
VITE_BRIGHTID_NODE_URL=https://brightid.clr.fund/brightid/v6

# /contracts/.env
BRIGHTID_VERIFIER_ADDR=0xdbf0b2ee9887fe11934789644096028ed3febe9c
```

By default, the clrfund app will connect to the BrightId node run by clrfund, https://brightid.clr.fund.


## Troubleshooting linking failure
### General linking error
1. check for sponsorship status from clrfund's brightid node:
  - https://brightid.clr.fund/brightid/v6/sponsorships/WALLET_ADDRESS
2. check the clrfund's brightid node docker logs
  - look for sponsorship event listening error
  ```.sh
    docker logs --since 1440m brightid-node-docker-db-1
  ```
3. check for sponsorship token balance
  - for clrfund-arbitrum context: https://brightid.clr.fund/brightid/v6/apps/clrfund-arbitrum
### Signature is not valid
1. Check that the verifier address is correct, it is the `ethSigningAddress` from https://brightid.clr.fund
2. You can update the verifier address using `BrightIdUserRegistryContract.setSettings()`


## Resources

- [BrightID developer documentation](https://dev.brightid.org/)
- [BrightID smart contract templates](https://github.com/BrightID/BrightID-SmartContract)
- [BrightID Discord](https://discord.gg/8ECzHEAwug)
- [BrightID node installation guide](https://github.com/BrightID/BrightID-Node/wiki/Installation-Guide)
- [BrightID sponsorship guide](https://dev.brightid.org/docs/guides/8202f29b96fcf-sponsoring-users)

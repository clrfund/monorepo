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

| Network/Env | Context | Sponsor Contract |
| ----------- | ------- | ---------------- |
| arbitrum | clrfund-arbitrum |0x669A55Dd17a2f9F4dacC37C7eeB5Ed3e13f474f9|
| arbitrum rinkeby | clrfund-arbitrum-rinkeby | 0xC7c81634Dac2de4E7f2Ba407B638ff003ce4534C |
| goerli | clrfund-goerli | 0xF045234A776C87060DEEc5689056455A24a59c08 |
| xdai | clrfund-gnosischain |0x669A55Dd17a2f9F4dacC37C7eeB5Ed3e13f474f9|

```.sh
# /vue-app/.env
VITE_BRIGHTID_CONTEXT={CONTEXT}

# /contracts/.env
BRIGHTID_CONTEXT={CONTEXT}
```

Note: the BrightID context is specific to the BrightID network - it's independent from the Ethereum network you choose to run the app on. It refers to the BrightID app context where you want to burn sponsorship tokens.
The `Sponsor Contract` is the contract set up in the BrightID node to track the sponsorship event.


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


**#4 configure the BrightID sponsorship page**
By default, the clrfund app will sponsor the BrightId users using the smart contract event logging method. The `Sponsor` contract is listed in the step #2 above.

Alternatively, you can configure the clrfund app to use the BrightId sponsorship api to submit the sponsorship request directly by setting the following environment variables. Only one of VITE_BRIGHTID_SPONSOR_KEY_FOR_NETLIFY or VITE_BRIGHTID_SPONSOR_KEY needs to be set. If VITE_BRIGHTID_SPONSOR_KEY_FOR_NETLIFY is set, the clrfund app must be deployed to the netlify platform as it will use the netlify serverless function. The netlify option is used if you want to protect the BrightId sponsor key.

The BrightId sponsor key can be generated using the random Nacl keypair at [https://tweetnacl.js.org/#/sign](https://tweetnacl.js.org/#/sign).  Give the public key part to the BrightId folks to setup the context and put the private key part in VITE_BRIGHTID_SPONSOR_KEY or VITE_BRIGHTID_SPONSOR_KEY_FOR_NETLIFY.

```.sh
# /vue-app/.env
VITE_BRIGHTID_SPONSOR_API_URL=https://brightid.clr.fund/brightid/v6/operations
VITE_BRIGHTID_SPONSOR_KEY_FOR_NETLIFY=
VITE_BRIGHTID_SPONSOR_KEY=
```

**#5 netlify function setup**
See the [deployment guide](./deploymnet.md) for special setup to use the sponsor netlify function.

## Troubleshooting linking failure
### Sponsorship timeout
1. check for sponsorship status https://app.brightid.org/node/v6/sponsorships/WALLET_ADDRESS
2. check for sponsorship status from clrfund's brightid node:
  - https://brightid.clr.fund/brightid/v6/sponsorships/WALLET_ADDRESS
3. check the clrfund's brightid node docker logs
  - look for sponsorship event listening error
  ```.sh
    docker logs --since 1440m brightid-node-docker-db-1
  ```
4. check for sponsorship token balance
  - for clrfund-arbitrum context: https://brightid.clr.fund/brightid/v6/apps/clrfund-arbitrum


## Resources

- [BrightID developer documentation](https://dev.brightid.org/)
- [BrightID smart contract templates](https://github.com/BrightID/BrightID-SmartContract)
- [BrightID Discord](https://discord.gg/8ECzHEAwug)
- [BrightID node installation guide](https://github.com/BrightID/BrightID-Node/wiki/Installation-Guide)
- [BrightID sponsorship guide](https://dev.brightid.org/docs/guides/8202f29b96fcf-sponsoring-users)

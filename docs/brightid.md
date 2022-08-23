# BrightID setup

We use BrightID as part of the user verification and registration flow to become a contributor.

In order to enable BrightID in the app, follow these steps:

**#1 enable the BrightID user registry**

```.sh
# /vue-app/.env
VUE_APP_USER_REGISTRY_TYPE=brightid

# /contracts/.env
USER_REGISTRY_TYPE=brightid
```

**#2 enable the BrightID context you want to use**

Available envs:

| Network/Env | Context | sponsor contract |
| ----------- | ------- | ---------------- |
| goerli | clrfund-goerli | 0xF045234A776C87060DEEc5689056455A24a59c08 |
| xdai | clrfund-gnosis-chain ||
| Arbitrum | clrfund-arbitrum ||


```.sh
# /vue-app/.env
VUE_APP_BRIGHTID_CONTEXT={CONTEXT}

# /contracts/.env
BRIGHTID_CONTEXT={CONTEXT}
```

Note: the BrightID context is specific to the BrightID network - it's independent from the Ethereum network you choose to run the app on. It refers to the BrightID app context where you want to burn sponsorship tokens.

[Learn more about context in the BrightID docs](https://dev.brightid.org/docs/guides/ZG9jOjQxNTE1NDU-basic-integration).

## Resources

- [BrightID developer documentation](https://dev.brightid.org/)
- [BrightID smart contract templates](https://github.com/BrightID/BrightID-SmartContract)
- [BrightID Discord](https://discord.gg/8ECzHEAwug)

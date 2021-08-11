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

- Testing: `CLRFundTest`
- Production: `clr.fund`

```.sh
# /vue-app/.env
VUE_APP_BRIGHTID_CONTEXT={CONTEXT}

# /contracts/.env
BRIGHTID_CONTEXT={CONTEXT}
```

## Testing

The following tool provided by BrightID is used for manual linking, sponsoring, and verifying a contextId (in our case, the user wallet address).

https://acolytec3.github.io/brightid_test_app/

Required fields:

- Context: `CLRFundTest`
- Testing key: `55HhFtQvaHB0BJeR`
- ContextId: `{walletAddress}` you want to test

Note: this tool is only going to work with **testing** contexts, like `CLRFundTest`. Production contexts like `clr.fund` are not going to work.

## Resources

- [BrightID developer documentation](https://dev.brightid.org/)
- [BrightID smart contract templates](https://github.com/BrightID/BrightID-SmartContract)
- [BrightID Discord](https://discord.gg/8ECzHEAwug)

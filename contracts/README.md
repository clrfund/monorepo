# clr.fund contracts

## Scripts

### Deploy factory contract

```
yarn buidler run --network localhost scripts/deploy.ts
```

### Deploy test round

This includes:

- Deploying ERC20 token contract.
- Adding tokens to the matching pool.
- Adding recipients.
- Deploying funding round.
- Deploying MACI instance.

```
yarn buidler run --network localhost scripts/deployTestRound.ts
```

# How to use the CLR.fund app

## What you'll need
1. ETH
  
  > For testing,
  - Get Goerli ETH from [Unitap](https://unitap.app/gas-tap)
  - Use the [bridge](https://bridge.arbitrum.io/?l2ChainId=421613) to convert to Arbitrum Goerli ETH

2. Contribution tokens

  > For testing,the test DAI tokens can be minted using the `mint()` function from the [etherscan contract page](https://goerli.arbiscan.io//address/0x65bc8dd04808d99cf8aa6749f128d55c2051edde#writeContract) with the follow inputs:
  
  - usr (address): Your wallet address
  - wad (uint256): How many DAI tokens to mint, e.g. 20000000000000000000 is 20 DAI

Note, all the links provided below are from our test site for testing and illustration purposes only. For production, please replace https://clrfund-testnet.netlify.app with https://clr.fund

## How to add your project as a fund recipient
1. Submit your project
  - Goto https://clrfund-testnet.netlify.app/#/join to submit your application
  - Once your project is approved, it will show up on the project page and start receiving donations
  - To check your project status, goto https://clrfund-testnet.netlify.app/#/recipients

## How to contribute to projects
1. Register as a contributor
  - Verify with BrightID
  - Goto https://clrfund-testnet.netlify.app/#/verify to get registered

  ![](gifs/register.gif)

2. Contribute to projects
  - Goto https://clrfund-testnet.netlify.app/#/projects to contribute to projects

  ![](gifs/contribute.gif)

3. Reallocate contributions
  - Goto https://clrfund-testnet.netlify.app/#/projects to change your contribution allocations

  ![](gifs/reallocate.gif)

## Bug report
You can report any issues with one of the following ways:
1. Report any issues in the `support` channel of the [CLR.fund discord](https://discord.gg/ZnsYPV6dCv)
2. Open a github issue on https://github.com/clrfund/monorepo/issues


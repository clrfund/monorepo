# Providing matching funds

The funding source is an ethereum address from which clr.fund can receive matching funding using the [allowance mechanism](https://docs.openzeppelin.com/contracts/3.x/api/token/erc20#IERC20-allowance-address-address-). It could be an externally owned account or a contract (such as DAO).

To become a funding source the address should be added the list of funding sources by clr.fund administrator. At the end of each funding round clr.fund checks token allowance for the `FundingRoundFactory` contract address and transfers allowed amount of tokens to the matching pool.

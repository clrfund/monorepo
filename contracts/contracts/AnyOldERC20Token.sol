pragma solidity ^0.5.8;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol';


// Note: Probably won't need to create this token
// as long as the funds from EF arrive in time
contract AnyOldERC20Token is ERC20, ERC20Detailed {
  constructor(uint256 initialSupply)
    public
    ERC20Detailed('Any old ERC20 token', 'AOE', 18)
  {
    _mint(msg.sender, initialSupply);
  }
}

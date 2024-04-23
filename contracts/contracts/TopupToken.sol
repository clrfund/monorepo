// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.10;

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * TopupToken is used by MACI Poll contract to validate the topup credits of a user
 * In clrfund, this is only used as gateway to pass the topup amount to the Poll contract
 */
contract TopupToken is ERC20, Ownable {
  constructor() ERC20("TopupCredit", "TopupCredit") {}

  function airdrop(uint256 amount) public onlyOwner {
    _mint(msg.sender, amount);
  }
}

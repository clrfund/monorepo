// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.10;

import {MessageAqFactory} from 'maci-contracts/contracts/Poll.sol';

library MessageAqFactoryCreator {
   function create() public returns (MessageAqFactory factory) {
      factory = new MessageAqFactory();
   }
}
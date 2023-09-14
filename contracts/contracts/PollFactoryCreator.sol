// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.10;

import {PollFactory} from 'maci-contracts/contracts/Poll.sol';

library PollFactoryCreator {
   function create() external returns (PollFactory pollFactory) {
      pollFactory = new PollFactory();
   }
}
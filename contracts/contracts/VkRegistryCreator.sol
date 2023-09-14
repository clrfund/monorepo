// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.10;

import {VkRegistry} from 'maci-contracts/contracts/VkRegistry.sol';

library VkRegistryCreator {
   function create() public returns (VkRegistry vkRegistry) {
      vkRegistry = new VkRegistry();
   }
}
// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.10;

import 'maci-contracts/contracts/VkRegistry.sol';

contract VkRegistryDeployer {
  event VkRegistryDeployed(address _vkRegistry);

  /**
    * @dev Deploy new VkRegistry instance.
    */
  function deploy(address owner)
    external
    returns (VkRegistry _registry)
  {
    require(owner != address(0), 'Invalid owner');

    _registry = new VkRegistry();
    _registry.transferOwnership(owner);
    
    emit VkRegistryDeployed(address(_registry));
  }
}

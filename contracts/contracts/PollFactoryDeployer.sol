// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.10;

import {PollFactory} from 'maci-contracts/contracts/Poll.sol';

contract PollFactoryDeployer {
  event PollFactoryDeployed(address _pollFactory);

  /**
    * @dev Deploy new PollFactory instance.
    * @param owner Address of the owner for the new PollFactory instance
    */
  function deploy(address owner)
    external
    returns (PollFactory _pollFactory)
  {
    _pollFactory = new PollFactory();
    _pollFactory.transferOwnership(owner);

    emit PollFactoryDeployed(address(_pollFactory));
  }
}

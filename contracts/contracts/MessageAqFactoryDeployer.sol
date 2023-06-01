// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.10;

import {MessageAqFactory} from 'maci-contracts/contracts/Poll.sol';

contract MessageAqFactoryDeployer {
  event MessageAqFactoryDeployed(address _messageAqFactory);

  /**
    * @dev Deploy new MessageAqFactory instance.
    */
  function deploy(address owner)
    external
    returns (MessageAqFactory _messageAqFactory)
  {
    _messageAqFactory = new MessageAqFactory();
    _messageAqFactory.transferOwnership(owner);
    emit MessageAqFactoryDeployed(address(_messageAqFactory));
  }
}

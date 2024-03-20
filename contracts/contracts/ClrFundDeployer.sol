// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.10;

import {MACIFactory} from './MACIFactory.sol';
import {ClrFund} from './ClrFund.sol';
import {CloneFactory} from './CloneFactory.sol';
import {SignUpGatekeeper} from "maci-contracts/contracts/gatekeepers/SignUpGatekeeper.sol";
import {InitialVoiceCreditProxy} from "maci-contracts/contracts/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol";
import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';

contract ClrFundDeployer is CloneFactory, Ownable {
  address public clrfundTemplate;
  address public maciFactory;
  address public roundFactory;
  mapping (address => bool) public clrfunds;

  event NewInstance(address indexed clrfund);
  event Register(address indexed clrfund, string metadata);
  event NewFundingRoundTemplate(address newTemplate);
  event NewClrfundTemplate(address newTemplate);

  // errors
  error ClrFundAlreadyRegistered();
  error InvalidMaciFactory();
  error InvalidClrFundTemplate();
  error InvalidFundingRoundFactory();

  constructor(
    address _clrfundTemplate,
    address _maciFactory,
    address _roundFactory
  )
  {
    if (_clrfundTemplate == address(0)) revert InvalidClrFundTemplate();
    if (_maciFactory == address(0)) revert InvalidMaciFactory();
    if (_roundFactory == address(0)) revert InvalidFundingRoundFactory();

    clrfundTemplate = _clrfundTemplate;
    maciFactory = _maciFactory;
    roundFactory = _roundFactory;
  }

  /**
    * @dev Set a new clrfund template
    * @param _clrfundTemplate New template
    */
  function setClrFundTemplate(address _clrfundTemplate)
    external
    onlyOwner
  {
    if (_clrfundTemplate == address(0)) revert InvalidClrFundTemplate();

    clrfundTemplate = _clrfundTemplate;
    emit NewClrfundTemplate(_clrfundTemplate);
  }

  /**
    * @dev Deploy a new instance of ClrFund
    */
  function deployClrFund() public returns (address) {
    ClrFund clrfund = ClrFund(createClone(clrfundTemplate));
    clrfund.init(maciFactory, roundFactory);

    // clrfund.init() set the owner to us, now transfer to the caller
    clrfund.transferOwnership(msg.sender);

    emit NewInstance(address(clrfund));

    return address(clrfund);
  }
}

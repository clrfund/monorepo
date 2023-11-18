// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.10;

import './MACIFactory.sol';
import './ClrFund.sol';
import {CloneFactory} from './CloneFactory.sol';
import {SignUpGatekeeper} from "@clrfund/maci-contracts/contracts/gatekeepers/SignUpGatekeeper.sol";
import {InitialVoiceCreditProxy} from "@clrfund/maci-contracts/contracts/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol";

contract ClrFundDeployer is CloneFactory {

    address public template;
    mapping (address => bool) public clrfunds;

    constructor(address _template) {
        template = _template;
    }
    
    event NewInstance(address indexed clrfund);
    event Register(address indexed clrfund, string metadata);

    // errors
    error ClrFundAlreadyRegistered();

    function deployClrFund(MACIFactory _maciFactory) public returns (address) {

        ClrFund clrfund = ClrFund(createClone(template));
        clrfund.init(_maciFactory);
        emit NewInstance(address(clrfund));

        return address(clrfund);
    }
    
    function registerInstance(
        address _clrFundAddress,
        string memory _metadata
      ) public returns (bool) {

      if (clrfunds[_clrFundAddress] == true) revert ClrFundAlreadyRegistered();

      clrfunds[_clrFundAddress] = true;

      emit Register(_clrFundAddress, _metadata);
      return true;
    }
}

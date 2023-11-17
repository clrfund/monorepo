// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.10;

import './MACIFactory.sol';
import './ClrFund.sol';
import {CloneFactory} from './CloneFactory.sol';
import {SignUpGatekeeper} from "maci-contracts/contracts/gatekeepers/SignUpGatekeeper.sol";
import {InitialVoiceCreditProxy} from "maci-contracts/contracts/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol";

contract ClrFundParams {
    struct Templates {
        address clrfund;
        address pollFactory;
    }
}

contract ClrFundDeployer is CloneFactory, ClrFundParams {
    
    address public template;
    mapping (address => bool) public clrfunds;
    uint clrId = 0;
    ClrFund private clrfund; // funding factory contract
    
    constructor(address _template) {
        template = _template;
    }
    
    event NewInstance(address indexed clrfund);
    event Register(address indexed clrfund, string metadata);
     
    function deployClrFund(MACIFactory _maciFactory) public returns (address) {

        clrfund = ClrFund(createClone(template));
        clrfund.init(_maciFactory);
        emit NewInstance(address(clrfund));

        return address(clrfund);
    }
    
    function registerInstance(
        address _clrFundAddress,
        string memory _metadata
      ) public returns (bool) {

      clrfund = ClrFund(_clrFundAddress);

      require(clrfunds[_clrFundAddress] == false, 'ClrFund: metadata already registered');

      clrfunds[_clrFundAddress] = true;

      clrId = clrId + 1;
      emit Register(_clrFundAddress, _metadata);
      return true;
    }
    
}

/*
The MIT License (MIT)
Copyright (c) 2018 Murray Software, LLC.
Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:
The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

pragma solidity ^0.6.12;
import './MACIFactory.sol';
import './ClrFund.sol';

contract CloneFactory { // implementation of eip-1167 - see https://eips.ethereum.org/EIPS/eip-1167
    function createClone(address target) internal returns (address result) {
        bytes20 targetBytes = bytes20(target);
        assembly {
            let clone := mload(0x40)
            mstore(clone, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(add(clone, 0x14), targetBytes)
            mstore(add(clone, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
            result := create(0, clone, 0x37)
        }
    }
}

contract ClrFundDeployer is CloneFactory { 
    
    address public template;
    mapping (address => bool) public clrfunds;
    uint clrId = 0;
    ClrFund private clrfund; // funding factory contract
    
    constructor(address _template) public {
        template = _template;
    }
    
    event NewInstance(address indexed clrfund);
    event Register(address indexed clrfund, string metadata);
     
    function deployFund(
      MACIFactory _maciFactory
    ) public returns (address) {
        ClrFund clrfund = ClrFund(createClone(template));
        
        clrfund.init(
            _maciFactory
        );
       
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
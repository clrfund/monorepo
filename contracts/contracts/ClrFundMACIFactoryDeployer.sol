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

import './ClrFundMACIFactory.sol';
import "./CloneFactory.sol";

contract ClrFundMACIFactoryDeployer is CloneFactory { 
    
    address public template;
    mapping (address => bool) public maciFactories;
    uint clrFundMaciFactoryId = 0;
    ClrFundMACIFactory private clrFundMACIFactory; // funding factory contract
    constructor(address _template) public {
        template = _template;
    }
    
    event NewInstance(address indexed clrfundMACIFactory);
    event Register(address indexed clrfundMACIFactory, string metadata);
     
    function deployMACIFactory(
    uint8 _stateTreeDepth,
    uint8 _messageTreeDepth,
    uint8 _voteOptionTreeDepth,
    uint8 _tallyBatchSize,
    uint8 _messageBatchSize,
    SnarkVerifier _batchUstVerifier,
    SnarkVerifier _qvtVerifier,
    uint256 _signUpDuration,
    uint256 _votingDuration
    ) public returns (address) {
        ClrFundMACIFactory clrFundMACIFactory = ClrFundMACIFactory(createClone(template));
        
        clrFundMACIFactory.init(
            _stateTreeDepth,
            _messageTreeDepth,
            _voteOptionTreeDepth,
            _tallyBatchSize,
            _messageBatchSize,
            _batchUstVerifier,
            _qvtVerifier,
            _signUpDuration,
            _votingDuration
        );
       
        emit NewInstance(address(clrFundMACIFactory));
        
        return address(clrFundMACIFactory);
    }

        // added this because it was added in the funding round deployer too
        function registerInstance(
        address _clrFundMACIFcatoryAddress,
        string memory _metadata
      ) public returns (bool) {
          
      clrFundMACIFactory = ClrFundMACIFactory(_clrFundMACIFcatoryAddress);
      
      require(maciFactories[_clrFundMACIFcatoryAddress] == false, 'ClrFundMACIFactory: metadata already registered');

      maciFactories[_clrFundMACIFcatoryAddress] = true;
      
      clrFundMaciFactoryId = clrFundMaciFactoryId + 1;
      emit Register(_clrFundMACIFcatoryAddress, _metadata);
      return true;
      
    }
}
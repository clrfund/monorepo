pragma solidity ^0.6.2;

import '@nomiclabs/buidler/console.sol';

import './FundingRoundFactory.sol';

contract FundingRound {
    mapping(address => uint256[]) private encryptedVote;
    mapping(address => uint256) private totalAmountOfDAI;
    FundingRoundFactory private parent;

    constructor(FundingRoundFactory _parent) public {
        parent = _parent;
    }

    function claimFunds(address recipient) public {
        // TODO: Implement me
        // Send relative percentage of DAI balance to recipient
    }

    function contribute(uint256[] memory message, uint256[] memory encPubKey, uint256 amount)
        public
    {
        // message: encrypted message to be sent to MACI. This is generated using the Command class and Command.encrypt .  More information on using Command here.
        // encPubKey: encrypted public key. Use Keypair to create a keypair, then use Keypair.genEcdhSharedKey and supply the private key from the current keypair

        // Both parameters are created using functions from this maci javascript library.

        // FundingRound thisContract = FundingRound(this);
        address thisContract = address(this);
        // FundingRound currentRound = parent.getCurrentRound();
        address currentRound = address(parent.getCurrentRound());
        // console.log(thisContract);

        // TODO: Also revert if msg.sender isn't BrightID verified
        if (thisContract != currentRound) {
            // revert if it's the previous round
            // if this is not the current round
            revert("This round isn't the current round");
        }

        // DAI is transferred here

    }

    // Question: This should be public, right?
    function getMessage(address _participant)
        public
        returns (uint256[] memory _message)
    {
        // TODO: Get the message from storage
        uint256[] memory message;
        return message; // returns encrypted message for participant
    }

}

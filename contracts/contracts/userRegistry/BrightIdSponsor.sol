// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.20;

contract BrightIdSponsor {
    event Sponsor(address indexed addr);

    /**
     * @dev sponsor a BrightId user by emitting an event
     * that a BrightId node is listening for
     */
    function sponsor(address addr) public {
        emit Sponsor(addr);
    }
}

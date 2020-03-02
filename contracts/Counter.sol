pragma solidity ^0.6.3;

import "@nomiclabs/buidler/console.sol";

contract Counter {
  uint256 public count;

  event CountedTo(uint256 number);

  function countUp() public returns (uint256) {
    uint256 newCount = count + 2;
    console.log("countUp: newCount =", newCount);
    require(newCount > count, "Uint256 overflow");

    count = newCount;

    emit CountedTo(count);
    return count;
  }

  function countDown() public returns (uint256) {
    uint256 newCount = count - 2;
    console.log("countDown: newCount =", newCount);
    require(newCount < count, "Uint256 underflow");

    count = newCount;

    emit CountedTo(count);
    return count;
  }
}

pragma solidity ^0.6.4;

import "@nomiclabs/buidler/console.sol";

contract Counter {
  uint256 public count;

  event CountedTo(uint256 number);

  function initialize() public {
    // Use this as you would typically use a constructor.
  }

  function countUp() public returns (uint256) {
    uint256 newCount = count + 1;
    console.log("countUp: newCount =", newCount);
    require(newCount > count, "uint256 overflow");

    count = newCount;

    emit CountedTo(count);
    return count;
  }

  function countDown() public returns (uint256) {
    uint256 newCount = count - 1;
    console.log("countDown: newCount =", newCount);
    require(newCount < count, "uint256 underflow");

    count = newCount;

    emit CountedTo(count);
    return count;
  }
}

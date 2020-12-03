// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

import '@openzeppelin/contracts/access/Ownable.sol';

/**
 *  @title GeneralizedTCR
 *  This contract is a curated registry for any types of items. Just like a TCR contract it features the request-challenge protocol and appeal fees crowdfunding.
 *  Adapted from https://github.com/kleros/tcr/blob/v2.0.0/contracts/GeneralizedTCR.sol
 */
contract KlerosGTCRMock is Ownable {

  enum Status {
    Absent, // The item is not in the registry.
    Registered, // The item is in the registry.
    RegistrationRequested, // The item has a request to be added to the registry.
    ClearingRequested // The item has a request to be removed from the registry.
  }

  struct Item {
    bytes data; // The data describing the item.
    Status status; // The current status of the item.
    Request[] requests; // List of status change requests made for the item in the form requests[requestID].
  }

  struct Request {
    bool disputed; // True if a dispute was raised.
  }

  bytes32[] public itemList; // List of IDs of all submitted items.
  mapping(bytes32 => Item) public items; // Maps the item ID to its data in the form items[_itemID].
  mapping(bytes32 => uint) public itemIDtoIndex; // Maps an item's ID to its position in the list in the form itemIDtoIndex[itemID].

  /**
   * @dev To be emitted when meta-evidence is submitted.
   * @param _metaEvidenceID Unique identifier of meta-evidence.
   * @param _evidence A link to the meta-evidence JSON.
   */
  event MetaEvidence(uint256 indexed _metaEvidenceID, string _evidence);

  /**
   *  @dev Emitted when a party makes a request, raises a dispute or when a request is resolved.
   *  @param _itemID The ID of the affected item.
   *  @param _requestIndex The index of the request.
   *  @param _roundIndex The index of the round.
   *  @param _disputed Whether the request is disputed.
   *  @param _resolved Whether the request is executed.
   */
  event ItemStatusChange(
    bytes32 indexed _itemID,
    uint indexed _requestIndex,
    uint indexed _roundIndex,
    bool _disputed,
    bool _resolved
  );

  /**
   *  @dev Emitted when someone submits an item for the first time.
   *  @param _itemID The ID of the new item.
   *  @param _submitter The address of the requester.
   *  @param _evidenceGroupID Unique identifier of the evidence group the evidence belongs to.
   *  @param _data The item data.
   */
  event ItemSubmitted(
    bytes32 indexed _itemID,
    address indexed _submitter,
    uint indexed _evidenceGroupID,
    bytes _data
  );

  /**
   *  @dev Deploy the arbitrable curated registry.
   *  @param _registrationMetaEvidence The URI of the meta evidence object for registration requests.
   *  @param _clearingMetaEvidence The URI of the meta evidence object for clearing requests.
   */
  constructor(
    string memory _registrationMetaEvidence,
    string memory _clearingMetaEvidence
  ) public {
    emit MetaEvidence(0, _registrationMetaEvidence);
    emit MetaEvidence(1, _clearingMetaEvidence);
  }

  /** @dev Submit a request to register an item. Accepts enough ETH to cover the deposit, reimburses the rest.
   *  @param _item The data describing the item.
   */
  function addItem(bytes calldata _item) external payable onlyOwner {
    bytes32 itemID = keccak256(_item);
    require(items[itemID].status == Status.Absent, 'Item must be absent to be added.');
    Item storage item = items[itemID];
    item.data = _item;
    item.status = Status.Registered;
    itemList.push(itemID);
    itemIDtoIndex[itemID] = itemList.length - 1;
    emit ItemSubmitted(itemID, msg.sender, 0, item.data);
    emit ItemStatusChange(itemID, 0, 0, false, false);
  }

  /** @dev Submit a request to remove an item from the list. Accepts enough ETH to cover the deposit, reimburses the rest.
   *  @param _itemID The ID of the item to remove.
   */
  function removeItem(bytes32 _itemID) external payable onlyOwner {
    require(items[_itemID].status == Status.Registered, 'Item must be registered to be removed.');
    Item storage item = items[_itemID];
    item.status = Status.Absent;
    emit ItemStatusChange(_itemID, 0, 0, true, true);
  }

  /** @dev Returns item's information. Includes length of requests array.
   *  @param _itemID The ID of the queried item.
   *  @return data The data describing the item.
   *  @return status The current status of the item.
   *  @return numberOfRequests Length of list of status change requests made for the item.
   */
  function getItemInfo(bytes32 _itemID)
    external
    view
    returns (
      bytes memory data,
      Status status,
      uint numberOfRequests
    )
  {
    Item storage item = items[_itemID];
    return (
      item.data,
      item.status,
      item.requests.length
    );
  }
}

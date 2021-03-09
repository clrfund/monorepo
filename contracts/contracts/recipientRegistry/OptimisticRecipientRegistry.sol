// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.6.12;

import '@openzeppelin/contracts/access/Ownable.sol';

import './BaseRecipientRegistry.sol';

/**
 * @dev Recipient registry with optimistic execution of registrations and removals.
 */
contract OptimisticRecipientRegistry is Ownable, BaseRecipientRegistry {

  // Structs
  struct Request {
    address payable requester;
    uint256 submissionTime;
    uint256 deposit;
    address recipientAddress; // Undefined in removal requests
    string recipientMetadata;
  }

  // State
  uint256 public baseDeposit;
  uint256 public challengePeriodDuration;
  mapping(bytes32 => Request) private requests;

  // Events
  event RequestSubmitted(bytes32 indexed _recipientId, address _recipient, string _metadata);
  event RequestRejected(bytes32 indexed _recipientId);
  event RecipientAdded(bytes32 indexed _recipientId, address _recipient, string _metadata, uint256 _index);
  event RecipientRemoved(bytes32 indexed _recipientId);

  /**
    * @dev Deploy the registry.
    * @param _baseDeposit Deposit required to add or remove item.
    * @param _challengePeriodDuration The time owner has to challenge a request (seconds).
    * @param _controller Controller address. Normally it's a funding round factory contract.
    */
  constructor(
    uint256 _baseDeposit,
    uint256 _challengePeriodDuration,
    address _controller
  )
    public
  {
    baseDeposit = _baseDeposit;
    challengePeriodDuration = _challengePeriodDuration;
    controller = _controller;
  }

  /**
    * @dev Change base deposit.
    */
  function setBaseDeposit(uint256 _baseDeposit)
    external
    onlyOwner
  {
    baseDeposit = _baseDeposit;
  }

  /**
    * @dev Change challenge period duration.
    */
  function setChallengePeriodDuration(uint256 _challengePeriodDuration)
    external
    onlyOwner
  {
    challengePeriodDuration = _challengePeriodDuration;
  }

  /**
    * @dev Submit recipient registration request.
    * @param _recipient The address that receives funds.
    * @param _metadata The metadata info of the recipient.
    */
  function addRecipient(address _recipient, string calldata _metadata)
    external
    payable
  {
    require(_recipient != address(0), 'RecipientRegistry: Recipient address is zero');
    require(bytes(_metadata).length != 0, 'RecipientRegistry: Metadata info is empty string');
    bytes32 recipientId = keccak256(abi.encodePacked(_recipient, _metadata));
    require(recipients[recipientId].index == 0, 'RecipientRegistry: Recipient already registered');
    require(requests[recipientId].submissionTime == 0, 'RecipientRegistry: Request already submitted');
    require(msg.value == baseDeposit, 'RecipientRegistry: Incorrect deposit amount');
    requests[recipientId] = Request(
      msg.sender,
      block.timestamp,
      msg.value,
      _recipient,
      _metadata
    );
    emit RequestSubmitted(recipientId, _recipient, _metadata);
  }

  /**
    * @dev Submit recipient removal request.
    * @param _recipientId The ID of recipient.
    */
  function removeRecipient(bytes32 _recipientId)
    external
    payable
  {
    require(recipients[_recipientId].index != 0, 'RecipientRegistry: Recipient is not in the registry');
    require(recipients[_recipientId].removedAt == 0, 'RecipientRegistry: Recipient already removed');
    require(requests[_recipientId].submissionTime == 0, 'RecipientRegistry: Request already submitted');
    require(msg.value == baseDeposit, 'RecipientRegistry: Incorrect deposit amount');
    requests[_recipientId] = Request(
      msg.sender,
      block.timestamp,
      msg.value,
      address(0),
      ''
    );
    emit RequestSubmitted(_recipientId, address(0), '');
  }

  /**
    * @dev Reject request.
    * @param _recipientId The ID of recipient.
    */
  function challengeRequest(bytes32 _recipientId)
    external
    onlyOwner
    returns (bool)
  {
    Request memory request = requests[_recipientId];
    require(request.submissionTime != 0, 'RecipientRegistry: Request does not exist');
    address payable challenger = payable(owner());
    delete requests[_recipientId];
    bool isSent = challenger.send(request.deposit);
    emit RequestRejected(_recipientId);
    return isSent;
  }

  /**
    * @dev Execute request.
    * @param _recipientId The ID of recipient.
    */
  function executeRequest(bytes32 _recipientId)
    external
    returns (bool)
  {
    Request memory request = requests[_recipientId];
    require(request.submissionTime != 0, 'RecipientRegistry: Request does not exist');
    require(
      block.timestamp - request.submissionTime >= challengePeriodDuration,
      'RecipientRegistry: Challenge period is not over'
    );
    if (request.recipientAddress == address(0)) {
      // No recipient address: this is a removal request
      _removeRecipient(_recipientId);
      emit RecipientRemoved(_recipientId);
    } else {
      // WARNING: Could revert if no slots are available or if recipient limit is not set
      uint256 recipientIndex = _addRecipient(_recipientId, request.recipientAddress);
      emit RecipientAdded(
        _recipientId,
        request.recipientAddress,
        request.recipientMetadata,
        recipientIndex
      );
    }
    delete requests[_recipientId];
    bool isSent = request.requester.send(request.deposit);
    return isSent;
  }
}

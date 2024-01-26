import { Interface } from 'ethers'
import { AbiInfo } from './types'

type EventAbiEntry = {
  add: AbiInfo
  remove: AbiInfo
}

export const getRecipientAddressAbi = [
  `function getRecipientAddress(uint256 _index, uint256 _startTime, uint256 _endTime)` +
    ` external view returns (address)`,
  `function tcr() external view returns (address)`,
]

export const EVENT_ABIS: EventAbiEntry[] = [
  {
    add: {
      type: 'RequestSubmitted',
      name: 'RequestSubmitted',
      abi: `event RequestSubmitted(bytes32 indexed _recipientId, uint8 indexed _type, address _recipient, string _metadata, uint256 _timestamp)`,
    },
    remove: {
      type: 'RequestResolved',
      name: 'RequestResolved',
      abi: `event RequestResolved(bytes32 indexed _recipientId, uint8 indexed _type, bool indexed _rejected, uint256 _recipientIndex, uint256 _timestamp)`,
    },
  },
  {
    add: {
      type: 'RecipientAdded',
      name: 'RecipientAdded',
      abi: 'event RecipientAdded(bytes32 indexed _recipientId, address _recipient, string _metadata, uint256 _index, uint256 _timestamp)',
    },
    remove: {
      type: 'RecipientRemoved',
      name: 'RecipientRemoved',
      abi: 'event RecipientRemoved(bytes32 indexed _recipientId, uint256 _timestamp)',
    },
  },
  {
    add: {
      type: 'RecipientAddedV1',
      name: 'RecipientAdded',
      abi: 'event RecipientAdded(address indexed _recipient, string _metadata, uint256 _index)',
    },
    remove: {
      type: 'RecipientRemovedV1',
      name: 'RecipientRemoved',
      abi: 'event RecipientRemoved(address indexed _recipient)',
    },
  },
  {
    add: {
      type: 'KlerosRecipientAdded',
      name: 'RecipientAdded',
      abi: `event RecipientAdded(bytes32 indexed _recipientId, bytes _metadata, uint256 _index)`,
    },
    remove: {
      type: 'KlerosRecipientRemoved',
      name: 'RecipientRemoved',
      abi: `event RecipientRemoved(bytes32 indexed _recipientId)`,
    },
  },
]

/**
 * Event topic abi
 */
export const TOPIC_ABIS: Record<string, AbiInfo> = EVENT_ABIS.reduce(
  (records: Record<string, AbiInfo>, addAndRemoveGroup) => {
    Object.values(addAndRemoveGroup).forEach(({ type, name, abi }) => {
      const addInterface = new Interface([abi])
      const event = addInterface.getEvent(name)
      if (event) {
        records[event.topicHash] = { type, name, abi }
      }
    })

    return records
  },
  {}
)

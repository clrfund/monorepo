import { BigNumber, utils } from 'ethers'
import { AbiInfo } from './types'

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
export const UNIT = BigNumber.from(10).pow(BigNumber.from(18))
export const VOICE_CREDIT_FACTOR = BigNumber.from(10).pow(4 + 18 - 9)

export enum RecipientState {
  Accepted = 'Accepted',
  Removed = 'Removed',
  Rejected = 'Rejected',
}

type EventAbiEntry = {
  add: AbiInfo
  remove: AbiInfo
}

export const EVENT_ABIS: EventAbiEntry[] = [
  {
    add: {
      type: 'RequestSubmitted',
      abi: `event RequestSubmitted(bytes32 indexed _recipientId, uint8 indexed _type, address _recipient, string _metadata, uint256 _timestamp)`,
    },
    remove: {
      type: 'RequestResolved',
      abi: `event RequestResolved(bytes32 indexed _recipientId, uint8 indexed _type, bool indexed _rejected, uint256 _recipientIndex, uint256 _timestamp)`,
    },
  },
  {
    add: {
      type: 'RecipientAdded',
      abi: 'event RecipientAdded(bytes32 indexed _recipientId, address _recipient, string _metadata, uint256 _index, uint256 _timestamp)',
    },
    remove: {
      type: 'RecipientRemoved',
      abi: 'event RecipientRemoved(bytes32 indexed _recipientId, uint256 _timestamp)',
    },
  },
  {
    add: {
      type: 'KlerosRecipientAdded',
      abi: `event RecipientAdded(bytes32 indexed _recipientId, bytes _metadata, uint256 _index)`,
    },
    remove: {
      type: 'KlerosRecipientRemoved',
      abi: `event RecipientRemoved(bytes32 indexed _recipientId)`,
    },
  },
]

export const TOPIC_ABIS: Record<string, AbiInfo> = EVENT_ABIS.reduce(
  (records: Record<string, AbiInfo>, addAndRemoveGroup) => {
    Object.values(addAndRemoveGroup).forEach(({ type, abi }) => {
      const addInterface = new utils.Interface([abi])
      const events = Object.values(addInterface.events)
      const topic0 = addInterface.getEventTopic(events[0].name)
      records[topic0] = { type, abi }
    })

    return records
  },
  {}
)

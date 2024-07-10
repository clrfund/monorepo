import { GraphQLClient } from 'graphql-request'

import { SUBGRAPH_ENDPOINT } from '@/api/core'
import { getSdk, type SdkFunctionWrapper } from './API'

const client = new GraphQLClient(SUBGRAPH_ENDPOINT)

const wrapper: SdkFunctionWrapper = (action, _operationName, _operationType) => {
  if (!SUBGRAPH_ENDPOINT) {
    throw new Error('Subgraph not available')
  }
  return action()
}

export default getSdk(client, wrapper)

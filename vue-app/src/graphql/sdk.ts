import { GraphQLClient } from 'graphql-request'

import { SUBGRAPH_ENDPOINT } from '@/api/core'
import { getSdk } from './API'

const client = new GraphQLClient(SUBGRAPH_ENDPOINT)

function getQuerySdk() {
  return SUBGRAPH_ENDPOINT ? getSdk(client) : {}
}

export default getQuerySdk()

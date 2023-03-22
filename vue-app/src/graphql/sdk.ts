import { GraphQLClient } from 'graphql-request'

import { SUBGRAPH_ENDPOINT } from '@/api/core'
import { getSdk } from './API'

const client = new GraphQLClient(SUBGRAPH_ENDPOINT)
export default getSdk(client)

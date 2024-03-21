/**
 * Travel to block timestamp in seconds, for testing
 *
 * Sample usage:
 * yarn hardhat time-travel --seconds <seconds> --network <network>
 */

import { time } from '@nomicfoundation/hardhat-network-helpers'
import { task, types } from 'hardhat/config'

task('time-travel', 'Travel to block timestamp in seconds')
  .addParam('seconds', 'The number of seconds to travel', undefined, types.int)
  .setAction(async ({ seconds }) => {
    await time.increase(seconds)
  })

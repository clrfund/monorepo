/**
 * Travel to block timestamp in seconds
 *
 * Sample usage:
 * HARDHAT_NETWORK=localhost yarn ts-node cli/timeTravel.ts <state file>
 */

import { time } from '@nomicfoundation/hardhat-network-helpers'
import { program } from 'commander'

program
  .description('Travel to block timestamp in seconds')
  .argument('seconds', 'The number of seconds to travel to')
  .parse()

async function main(args: any) {
  const seconds = Number(args[0])
  await time.increase(seconds)
}

main(program.args)
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(-1)
  })

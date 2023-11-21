import { task, types } from 'hardhat/config'

task('time-travel', 'Travel to block timestamp in seconds')
  .addPositionalParam(
    'seconds',
    'The number of seconds to travel to',
    undefined,
    types.int,
    false
  )
  .setAction(async ({ seconds }, { network }) => {
    await network.provider.send('evm_increaseTime', [seconds])
    await network.provider.send('evm_mine')
  })

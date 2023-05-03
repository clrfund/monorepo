import { task, types } from 'hardhat/config'

task('evm-increase-time', 'Increase block timestamp by seconds')
  .addPositionalParam(
    'seconds',
    'The number of seconds to increase',
    undefined,
    types.int,
    false
  )
  .setAction(async ({ seconds }, { network }) => {
    await network.provider.send('evm_increaseTime', [seconds])
    await network.provider.send('evm_mine')
  })

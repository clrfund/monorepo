import { log } from '@graphprotocol/graph-ts'
import { NewInstance } from '../generated/ClrFundDeployer/ClrFundDeployer'

import { ClrFundDeployer, ClrFund } from '../generated/schema'
import { ClrFund as ClrFundTemplate } from '../generated/templates'

export function handleNewInstance(event: NewInstance): void {
  let clrfundDeployerAddress = event.transaction.to!
  let clrfundDeployerId = clrfundDeployerAddress.toHex()

  let clrFundDeployer = ClrFundDeployer.load(clrfundDeployerId)
  if (!clrFundDeployer) {
    clrFundDeployer = new ClrFundDeployer(clrfundDeployerId)
    clrFundDeployer.createdAt = event.block.timestamp.toString()
  }

  ClrFundTemplate.create(event.params.clrfund)
  let clrFundAddress = event.params.clrfund
  let clrFundId = clrFundAddress.toHexString()
  let clrFund = new ClrFund(clrFundId)
  clrFund.clrFundDeployer = clrfundDeployerId
  clrFund.save()

  clrFundDeployer.lastUpdatedAt = event.block.timestamp.toString()
  clrFundDeployer.save()
  log.info('NewInstance {}', [clrFundId])
}

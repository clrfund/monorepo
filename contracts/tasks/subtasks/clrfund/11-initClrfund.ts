import { ClrFund } from '../../../typechain-types'
import { ContractStorage } from '../../helpers/ContractStorage'
import { Subtask } from '../../helpers/Subtask'
import { EContracts } from '../../helpers/types'
import { ZERO_ADDRESS } from '../../../utils/constants'

const subtask = Subtask.getInstance()
const storage = ContractStorage.getInstance()

/**
 * Deploy step registration and task itself
 */
subtask
  .addTask('clrfund:init-clrfund', 'Initialize ClrFund')
  .setAction(async (_, hre) => {
    subtask.setHre(hre)
    const deployer = await subtask.getDeployer()

    const clrfundContract = await subtask.getContract<ClrFund>({
      name: EContracts.ClrFund,
      signer: deployer,
    })

    const clrfundMaciFactoryAddress = await clrfundContract.maciFactory()
    if (clrfundMaciFactoryAddress !== ZERO_ADDRESS) {
      const clrfundContractAddress = await clrfundContract.getAddress()
      console.log(
        `Clrfund contract ${clrfundContractAddress} already initialized, skipping...`
      )
      return
    }

    const maciFactoryAddress = storage.mustGetAddress(
      EContracts.MACIFactory,
      hre.network.name
    )
    const fundingRoundFactoryAddress = storage.mustGetAddress(
      EContracts.FundingRoundFactory,
      hre.network.name
    )

    const tx = await clrfundContract.init(
      maciFactoryAddress,
      fundingRoundFactoryAddress
    )
    const receipt = await tx.wait()
    if (receipt?.status !== 1) {
      throw new Error('Failed to initialize ClrFund')
    }
  })

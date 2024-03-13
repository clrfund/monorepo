/**
 * Deploy a new recipient registry
 *
 */
import { ContractStorage } from '../../helpers/ContractStorage'
import { Subtask } from '../../helpers/Subtask'
import { ISubtaskParams } from '../../helpers/types'
import { EContracts } from '../../../utils/types'
import { parseUnits } from 'ethers'
import { AnyOldERC20Token, ClrFund } from '../../../typechain-types'

// Number.MAX_SAFE_INTEGER - 1
const defaultChallengePeriodSeconds = 9007199254740990

const subtask = Subtask.getInstance()
const storage = ContractStorage.getInstance()

/**
 * Get the deposit token decimals
 *
 * @param clrfund Clrfund contract
 * @returns Token decimals
 */
async function getTokenDecimals(clrfundContract: ClrFund): Promise<bigint> {
  const nativeTokenAddress = await clrfundContract.nativeToken()
  const tokenContract = await subtask.getContract<AnyOldERC20Token>({
    name: EContracts.AnyOldERC20Token,
    address: nativeTokenAddress,
  })
  const decimals = await tokenContract.decimals()
  return decimals
}

/**
 * Deploy step registration and task itself
 */

subtask
  .addTask(
    'recipient:deploy-optimistic-recipient-registry',
    'Deploy an optimistic recipient regsitry'
  )
  .setAction(async ({ incremental }: ISubtaskParams, hre) => {
    subtask.setHre(hre)
    const deployer = await subtask.getDeployer()
    const network = hre.network.name

    const recipientRegistryName = subtask.getConfigField<string>(
      EContracts.ClrFund,
      'recipientRegistry'
    )
    if (recipientRegistryName !== EContracts.OptimisticRecipientRegistry) {
      return
    }

    const optimisticRecipientRegistryContractAddress = storage.getAddress(
      EContracts.OptimisticRecipientRegistry,
      network
    )

    if (incremental && optimisticRecipientRegistryContractAddress) {
      return
    }

    const deposit = subtask.getConfigField<string>(
      EContracts.OptimisticRecipientRegistry,
      'deposit'
    )

    const challengePeriodSeconds = subtask.getConfigField<number>(
      EContracts.OptimisticRecipientRegistry,
      'challengePeriodSeconds'
    )

    const clrfundContractAddress = storage.mustGetAddress(
      EContracts.ClrFund,
      network
    )

    const clrfundContract = await subtask.getContract<ClrFund>({
      name: EContracts.ClrFund,
      address: clrfundContractAddress,
    })
    const decimals = await getTokenDecimals(clrfundContract)

    const args = [
      parseUnits(deposit, decimals),
      challengePeriodSeconds || defaultChallengePeriodSeconds,
      clrfundContractAddress,
    ]
    const optimisticRecipientRegistryContract = await subtask.deployContract(
      EContracts.OptimisticRecipientRegistry,
      { signer: deployer, args }
    )

    await storage.register({
      id: EContracts.OptimisticRecipientRegistry,
      contract: optimisticRecipientRegistryContract,
      args,
      network: hre.network.name,
    })
  })

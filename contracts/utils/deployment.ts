import bre from '@nomiclabs/buidler'
import { Signer, Contract } from 'ethers'
import { link } from 'ethereum-waffle'

import { MaciParameters } from './maci'
import MACIFactoryArtifact from '../build/contracts/MACIFactory.json'

const ethers = (bre as any).ethers

async function deployContract(
  account: Signer,
  name: string,
  args: any[] = [],
  overrideOptions: any = {},
): Promise<Contract> {
  // Similar to https://github.com/EthWorks/Waffle/blob/2.5.1/waffle-cli/src/deployContract.ts
  const ContractFactory = await ethers.getContractFactory(name, account)
  const contract = await ContractFactory.deploy(...args, {
    ...overrideOptions,
  })
  await contract.deployed()
  return contract
}

export function linkBytecode(
  bytecode: string,
  libraries: {[name: string]: string},
): string {
  // Workarounds for https://github.com/nomiclabs/buidler/issues/611
  const linkable = { evm: { bytecode: { object: bytecode } } }
  for (const [libraryName, libraryAddress] of Object.entries(libraries)) {
    link(linkable, libraryName, libraryAddress.toLowerCase())
  }
  return linkable.evm.bytecode.object
}

export async function deployMaciFactory(account: Signer): Promise<Contract> {
  const batchTreeVerifier = await deployContract(account, 'BatchUpdateStateTreeVerifier')
  const voteTallyVerifier = await deployContract(account, 'QuadVoteTallyVerifier')
  const poseidonT3 = await deployContract(account, 'PoseidonT3')
  const poseidonT6 = await deployContract(account, 'PoseidonT6')

  const linkedBytecode = linkBytecode(MACIFactoryArtifact.bytecode, {
    'maci-contracts/sol/Poseidon.sol:PoseidonT3': poseidonT3.address,
    'maci-contracts/sol/Poseidon.sol:PoseidonT6': poseidonT6.address,
  })
  const MACIFactory = await ethers.getContractFactory(
    MACIFactoryArtifact.abi,
    linkedBytecode,
    account,
  )
  const maciParameters = new MaciParameters({
    batchUstVerifier: batchTreeVerifier.address,
    qvtVerifier: voteTallyVerifier.address,
  })

  const maciFactory = await MACIFactory.deploy(...maciParameters.values())
  await maciFactory.deployed()
  return maciFactory
}

import { ethers } from '@nomiclabs/buidler';
import { Signer, Contract } from 'ethers';
import { link } from 'ethereum-waffle';

import MACIFactoryArtifact from '../build/contracts/MACIFactory.json';

async function deployContract(
  account: Signer,
  name: string,
  args: any[] = [],
  overrideOptions: any = {},
): Promise<Contract> {
  // Similar to https://github.com/EthWorks/Waffle/blob/2.5.1/waffle-cli/src/deployContract.ts
  const ContractFactory = await ethers.getContractFactory(name, account);
  const contract = await ContractFactory.deploy(...args, {
    ...overrideOptions,
  });
  await contract.deployed();
  return contract;
}

function doEIP170check(bytecode: string): void {
  // Check contract code size
  // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-170.md
  const size = bytecode.length / 2;
  if (size > 0x6000) {
    throw new Error(`Contract size exceeded EIP170 limit (${size}).`);
  }
}

export async function deployMaciFactory(account: Signer): Promise<Contract> {
  const signUpGatekeeper = await deployContract(account, 'FreeForAllGatekeeper');
  const batchTreeVerifier = await deployContract(account, 'BatchUpdateStateTreeVerifier');
  const voteTallyVerifier = await deployContract(account, 'QuadVoteTallyVerifier');
  const initialVoiceCreditProxy = await deployContract(account, 'ConstantInitialVoiceCreditProxy', [0]);
  const poseidonT3 = await deployContract(account, 'PoseidonT3');
  const poseidonT6 = await deployContract(account, 'PoseidonT6');

  // Workarounds for https://github.com/nomiclabs/buidler/issues/611
  const MACIFactoryArtifactCopy = {...MACIFactoryArtifact};
  const linkable = { evm: { bytecode: { object: MACIFactoryArtifactCopy.bytecode } } };
  link(linkable, 'maci/contracts/sol/Poseidon.sol:PoseidonT3', poseidonT3.address);
  link(linkable, 'maci/contracts/sol/Poseidon.sol:PoseidonT6', poseidonT6.address);
  MACIFactoryArtifactCopy.bytecode = linkable.evm.bytecode.object;
  const MACIFactory = await ethers.getContractFactory(
    MACIFactoryArtifactCopy.abi,
    MACIFactoryArtifactCopy.bytecode,
    account,
  );

  doEIP170check(MACIFactory.bytecode);
  const maciFactory = await MACIFactory.deploy(
    signUpGatekeeper.address,
    batchTreeVerifier.address,
    voteTallyVerifier.address,
    initialVoiceCreditProxy.address,
  );
  await maciFactory.deployed();
  return maciFactory;
}

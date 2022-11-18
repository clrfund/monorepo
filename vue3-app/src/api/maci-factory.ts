import { Contract } from 'ethers'
import { MACIFactory as MACIFactoryABI } from './abi'
import { factory, provider } from './core'

export interface MACIFactory {
	maciFactoryAddress: string
	maxRecipients: number
}

export async function getMACIFactoryInfo(): Promise<MACIFactory> {
	const maciFactoryAddress = await factory.maciFactory()

	const maciFactory = new Contract(maciFactoryAddress, MACIFactoryABI, provider)
	const treeDepths = await maciFactory.treeDepths()

	return {
		maciFactoryAddress,
		maxRecipients: 5 ** treeDepths.voteOptionTreeDepth - 1,
	}
}

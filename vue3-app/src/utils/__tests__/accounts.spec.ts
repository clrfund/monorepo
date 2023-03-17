import { expect } from 'vitest'
import { isSameAddress } from '@/utils/accounts'
import { ethers } from 'ethers'

describe('accounts', () => {
	it('should distinguish whether the two address is same', async () => {
		const address = await ethers.Wallet.createRandom().getAddress()
		const address2 = await ethers.Wallet.createRandom().getAddress()

		expect(isSameAddress(address, address)).toBeTruthy()
		expect(isSameAddress(address, address2)).toBeFalsy()
	})
})

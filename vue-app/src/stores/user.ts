import { getEtherBalance, getTokenBalance, isVerifiedUser, type User } from '@/api/user'
import { defineStore } from 'pinia'
import { useAppStore } from '@/stores'
import type { WalletUser } from '@/stores'
import { getContributionAmount, hasContributorVoted } from '@/api/contributions'
import type { BigNumber, Signer } from 'ethers'
import { ensLookup, isValidSignature } from '@/utils/accounts'
import { UserRegistryType, userRegistryType } from '@/api/core'
import { getBrightId, type BrightId } from '@/api/bright-id'
import { assert, ASSERT_NOT_CONNECTED_WALLET } from '@/utils/assert'
import { sha256 } from '@/utils/crypto'
import { LOGIN_MESSAGE } from '@/api/user'

export type UserState = {
  currentUser: User | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    currentUser: null,
  }),
  getters: {
    signer(): Signer {
      assert(this.currentUser, ASSERT_NOT_CONNECTED_WALLET)
      return this.currentUser.walletProvider.getSigner()
    },
  },
  actions: {
    loginUser(user: WalletUser) {
      this.currentUser = {
        walletAddress: user.walletAddress,
        walletProvider: user.web3Provider,
      }
    },
    logoutUser() {
      const appStore = useAppStore()
      this.currentUser = null
      appStore.contribution = null
      appStore.contributor = null
      appStore.cart = []
      appStore.cartLoaded = false
    },
    async requestSignature() {
      assert(this.currentUser, ASSERT_NOT_CONNECTED_WALLET)
      if (!this.currentUser.encryptionKey) {
        const signature = await this.signer.signMessage(LOGIN_MESSAGE)

        if (!isValidSignature(signature)) {
          // gnosis safe does not return signature in hex string
          // show the result as error
          throw new Error(signature)
        }
        this.currentUser.encryptionKey = sha256(signature)
      }
    },
    async loadUserInfo() {
      const appStore = useAppStore()

      if (!this.currentUser) {
        return
      }

      let nativeTokenAddress = ''
      let userRegistryAddress = ''
      let balance: BigNumber | null = null
      let isRegistered: boolean | undefined = undefined
      const walletAddress = this.currentUser.walletAddress

      if (appStore.factory) {
        nativeTokenAddress = appStore.factory.nativeTokenAddress
        userRegistryAddress = appStore.factory.userRegistryAddress
      }

      if (appStore.currentRound) {
        nativeTokenAddress = appStore.currentRound.nativeTokenAddress
        userRegistryAddress = appStore.currentRound.userRegistryAddress

        let contribution = appStore.contribution
        if (!contribution || contribution.isZero()) {
          contribution = await getContributionAmount(appStore.currentRound.fundingRoundAddress, walletAddress)
          const hasVoted = await hasContributorVoted(appStore.currentRound.fundingRoundAddress, walletAddress)

          appStore.contribution = contribution
          appStore.hasVoted = hasVoted
        }
      }

      // Check if this user is in our user registry
      if (userRegistryAddress) {
        isRegistered = await isVerifiedUser(userRegistryAddress, walletAddress)
      }

      if (nativeTokenAddress) {
        balance = await getTokenBalance(nativeTokenAddress, walletAddress)
      }

      const etherBalance = await getEtherBalance(walletAddress)
      const ensName: string | null | undefined = this.currentUser.ensName || (await ensLookup(walletAddress))

      this.currentUser = {
        ...this.currentUser,
        isRegistered,
        balance,
        etherBalance,
        ensName,
      }
    },
    async loadBrightID() {
      if (this.currentUser && userRegistryType === UserRegistryType.BRIGHT_ID) {
        // If the user is registered, we assume all brightId steps as done
        let brightId: BrightId = {
          isVerified: true,
        }

        if (!this.currentUser.isRegistered) {
          // If not registered, then fetch brightId data
          brightId = await getBrightId(this.currentUser.walletAddress)
        }

        this.currentUser = {
          ...this.currentUser,
          brightId,
        }
      }
    },
  },
})

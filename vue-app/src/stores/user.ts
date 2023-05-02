import { getEtherBalance, getTokenBalance, isVerifiedUser, type User } from '@/api/user'
import { defineStore } from 'pinia'
import { logoutUser, loginUser } from '@/api/gun'
import { useAppStore } from '@/stores'
import type { WalletUser } from '@/stores'
import { getContributionAmount, hasContributorVoted } from '@/api/contributions'
import type { BigNumber, Signer } from 'ethers'
import { ensLookup } from '@/utils/accounts'
import { UserRegistryType, userRegistryType } from '@/api/core'
import { getBrightId, type BrightId } from '@/api/bright-id'

export type UserState = {
  currentUser: User | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    currentUser: null,
  }),
  getters: {
    signer(): Signer {
      if (!this.currentUser) {
        throw new Error('Not connected to a wallet')
      }
      return this.currentUser.walletProvider.getSigner()
    },
  },
  actions: {
    async loginUser(user: WalletUser) {
      this.currentUser = {
        isRegistered: false,
        encryptionKey: user.encryptionKey,
        walletAddress: user.walletAddress,
        walletProvider: user.web3Provider,
      }
      await loginUser(this.currentUser.walletAddress, this.currentUser.encryptionKey)
    },
    logoutUser() {
      const appStore = useAppStore()
      appStore.unwatchCart()
      appStore.unwatchContributorData()
      logoutUser()
      this.currentUser = null
      appStore.contribution = null
      appStore.contributor = null
      appStore.cart = []
    },
    async loadUserInfo() {
      const appStore = useAppStore()

      if (!this.currentUser) {
        return
      }

      let nativeTokenAddress = ''
      let userRegistryAddress = ''
      let balance: BigNumber | null = null

      if (appStore.factory) {
        nativeTokenAddress = appStore.factory.nativeTokenAddress
        userRegistryAddress = appStore.factory.userRegistryAddress
      }

      if (appStore.currentRound) {
        nativeTokenAddress = appStore.currentRound.nativeTokenAddress
        userRegistryAddress = appStore.currentRound.userRegistryAddress

        let contribution = appStore.contribution
        if (!contribution || contribution.isZero()) {
          contribution = await getContributionAmount(
            appStore.currentRound.fundingRoundAddress,
            this.currentUser.walletAddress,
          )

          const hasVoted = await hasContributorVoted(
            appStore.currentRound.fundingRoundAddress,
            this.currentUser.walletAddress,
          )

          appStore.contribution = contribution
          appStore.hasVoted = hasVoted
        }
      }

      // Check if this user is in our user registry
      const isRegistered = await isVerifiedUser(userRegistryAddress, this.currentUser.walletAddress)

      if (nativeTokenAddress) {
        balance = await getTokenBalance(nativeTokenAddress, this.currentUser.walletAddress)
      }

      const etherBalance = await getEtherBalance(this.currentUser.walletAddress)
      let ensName: string | null | undefined = this.currentUser.ensName
      ensName = await ensLookup(this.currentUser.walletAddress)

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

        this.currentUser.brightId = brightId
      }
    },
  },
})

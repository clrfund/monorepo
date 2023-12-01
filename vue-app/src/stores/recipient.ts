import { defineStore } from 'pinia'
import type { RecipientApplicationData } from '@/api/types'
import type { RegistryInfo } from '@/api/types'
import { getRegistryInfo } from '@/api/recipient-registry'
import { getRecipientRegistryAddress } from '@/api/projects'
import { useAppStore } from './app'
import { isSameAddress } from '@/utils/accounts'
import { useUserStore } from './user'

export type RecipientState = {
  recipient: RecipientApplicationData | null
  recipientRegistryAddress: string | null
  recipientRegistryInfo: RegistryInfo | null
}

export const useRecipientStore = defineStore('recipient', {
  state: (): RecipientState => ({
    recipient: defaultRecipientApplicationData,
    recipientRegistryAddress: null,
    recipientRegistryInfo: null,
  }),
  getters: {
    isRecipientRegistryOwner: (state): boolean => {
      const userStore = useUserStore()
      if (!userStore.currentUser || !state.recipientRegistryInfo) {
        return false
      }
      return isSameAddress(userStore.currentUser.walletAddress, state.recipientRegistryInfo.owner)
    },
  },
  actions: {
    setRecipientData(payload: { updatedData: RecipientApplicationData; step: string; stepNumber: number }) {
      if (!this.recipient) {
        this.recipient = payload.updatedData
      } else {
        this.recipient[payload.step] = payload.updatedData[payload.step]
      }
    },
    resetRecipientData() {
      this.recipient = defaultRecipientApplicationData
    },
    async loadRecipientRegistryInfo() {
      const appStore = useAppStore()
      //TODO: update call to getRecipientRegistryAddress to take ClrFund address as a parameter
      const recipientRegistryAddress =
        this.recipientRegistryAddress || (await getRecipientRegistryAddress(appStore.currentRoundAddress))
      this.recipientRegistryAddress = recipientRegistryAddress

      if (recipientRegistryAddress) {
        const info = await getRegistryInfo(recipientRegistryAddress)
        this.recipientRegistryInfo = info
      } else {
        this.recipientRegistryInfo = null
      }
    },
  },
})

const defaultRecipientApplicationData: RecipientApplicationData = {
  project: {
    name: '',
    tagline: '',
    description: '',
    category: '',
    problemSpace: '',
  },
  fund: {
    addressName: '',
    resolvedAddress: '',
    plans: '',
  },
  team: {
    name: '',
    description: '',
    email: '',
  },
  links: {
    github: '',
    radicle: '',
    website: '',
    twitter: '',
    discord: '',
  },
  image: {
    bannerHash: '',
    thumbnailHash: '',
  },
  furthestStep: 0,
  hasEns: false,
}

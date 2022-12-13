import { getRegistryInfo, type RecipientApplicationData, type RegistryInfo } from '@/api/recipient-registry-optimistic'
import { getRecipientRegistryAddress } from '@/api/projects'
import { useAppStore } from './app'

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
	getters: {},
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
			//TODO: update call to getRecipientRegistryAddress to take factory address as a parameter
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

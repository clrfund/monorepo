import { defineStore } from 'pinia'
import type { BigNumber } from 'ethers'
import {
	type CartItem,
	type Contributor,
	deserializeCart,
	deserializeContributorData,
	getCartStorageKey,
	getCommittedCartStorageKey,
	getContributionAmount,
	getContributorStorageKey,
	hasContributorVoted,
	MAX_CART_SIZE,
	serializeCart,
	serializeContributorData,
} from '@/api/contributions'
import { operator, userRegistryType, UserRegistryType, ThemeMode, recipientRegistryType } from '@/api/core'
import { type RoundInfo, RoundStatus, getRoundInfo } from '@/api/round'
import { getTally, type Tally } from '@/api/tally'
import { getEtherBalance, getTokenBalance, isVerifiedUser, type User } from '@/api/user'
import { type Factory, getFactoryInfo } from '@/api/factory'
import { getMACIFactoryInfo, type MACIFactory } from '@/api/maci-factory'
import { ensLookup, isSameAddress } from '@/utils/accounts'
import { storage } from '@/api/storage'
import { loginUser, logoutUser } from '@/api/gun'
import { type BrightId, getBrightId } from '@/api/bright-id'
import { getSecondsFromNow, hasDateElapsed } from '@/utils/dates'
import { useRecipientStore } from './recipient'

export type AppState = {
	cart: CartItem[]
	cartEditModeSelected: boolean
	committedCart: CartItem[]
	contribution: BigNumber | null
	contributor: Contributor | null
	hasVoted: boolean
	currentRound: RoundInfo | null
	currentRoundAddress: string | null
	currentUser: User | null
	showCartPanel: boolean
	tally: Tally | null
	theme: string | null
	factory: Factory | null
	maciFactory: MACIFactory | null
}

export const useAppStore = defineStore('app', {
	state: (): AppState => ({
		cart: new Array<CartItem>(),
		cartEditModeSelected: false,
		committedCart: new Array<CartItem>(),
		contribution: null,
		contributor: null,
		hasVoted: false,
		currentRound: null,
		currentRoundAddress: null,
		currentUser: null,
		showCartPanel: false,
		tally: null,
		theme: null,
		factory: null,
		maciFactory: null,
	}),
	getters: {
		recipientJoinDeadline: state => {
			const recipientStore = useRecipientStore()
			if (!state.currentRound || !recipientStore.recipientRegistryInfo) {
				return null
			}

			const challengePeriodDuration =
				recipientRegistryType === 'optimistic'
					? recipientStore.recipientRegistryInfo.challengePeriodDuration
					: 0

			const deadline = state.currentRound.signUpDeadline.minus({
				seconds: challengePeriodDuration,
			})

			return deadline.isValid ? deadline : null
		},
		isCartToggledOpen: state => state.showCartPanel,
		isRoundReallocationPhase: (state): boolean => {
			return !!state.currentRound && state.currentRound.status === RoundStatus.Reallocating
		},
		canUserReallocate(): boolean {
			return this.hasUserContributed && (this.isRoundContributionPhase || this.isRoundReallocationPhase)
		},
		isRoundContributionPhase: (state): boolean => {
			return !!state.currentRound && state.currentRound.status === RoundStatus.Contributing
		},
		isRoundContributionPhaseEnding(): boolean {
			return (
				!!this.currentRound &&
				this.isRoundContributionPhase &&
				getSecondsFromNow(this.currentRound.signUpDeadline) < 24 * 60 * 60
			)
		},
		isRoundTallying: (state): boolean => {
			return !!state.currentRound && state.currentRound.status === RoundStatus.Tallying
		},
		isRoundFinalized: (state): boolean => {
			return !!state.currentRound && state.currentRound.status === RoundStatus.Finalized
		},
		isRoundCancelled:
			state =>
			(roundInfo?: RoundInfo | null): boolean => {
				const round = roundInfo || state.currentRound
				return !!round && round.status === RoundStatus.Cancelled
			},
		isCurrentRound:
			state =>
			(roundAddress: string): boolean => {
				const currentRoundAddress = state.currentRoundAddress || ''
				return isSameAddress(roundAddress, currentRoundAddress)
			},
		// BUG: https://github.com/vuejs/pinia/discussions/1076
		isRoundJoinOnlyPhase(): boolean {
			return !!this.currentRound && this.isRoundJoinPhase && !hasDateElapsed(this.currentRound.startTime)
		},
		isRoundJoinPhase(): boolean {
			return !hasDateElapsed(this.recipientJoinDeadline!)
		},
		isRoundContributorLimitReached: state => {
			return !!state.currentRound && state.currentRound.maxContributors <= state.currentRound.contributors
		},
		hasContributionPhaseEnded(): boolean {
			return (
				!!this.currentRound &&
				(hasDateElapsed(this.currentRound.signUpDeadline) ||
					this.isRoundContributorLimitReached ||
					this.isMessageLimitReached)
			)
		},
		isMessageLimitReached: (state): boolean => {
			return !!state.currentRound && state.currentRound.maxMessages <= state.currentRound.messages
		},
		hasUserContributed: (state): boolean => {
			return !!state.currentUser && !!state.contribution && !state.contribution.isZero()
		},
		operator: (): string => {
			return operator
		},
		userRegistryAddress: (state): string | undefined => {
			const { currentRound, factory } = state

			if (currentRound) {
				return currentRound.userRegistryAddress
			}

			if (factory) {
				return factory.userRegistryAddress
			}
		},
		nativeTokenSymbol: (state): string => {
			const { currentRound, factory } = state

			let nativeTokenSymbol = ''

			if (factory) {
				nativeTokenSymbol = factory.nativeTokenSymbol
			}

			if (currentRound) {
				nativeTokenSymbol = currentRound.nativeTokenSymbol
			}

			return nativeTokenSymbol
		},
		nativeTokenDecimals: (state): number | undefined => {
			const { currentRound, factory } = state

			let nativeTokenDecimals

			if (factory) {
				nativeTokenDecimals = factory.nativeTokenDecimals
			}

			if (currentRound) {
				nativeTokenDecimals = currentRound.nativeTokenDecimals
			}

			return nativeTokenDecimals
		},
		nativeTokenAddress: (state): string => {
			const { currentRound, factory } = state

			let nativeTokenAddress = ''

			if (factory) {
				nativeTokenAddress = factory.nativeTokenAddress
			}

			if (currentRound) {
				nativeTokenAddress = currentRound.nativeTokenAddress
			}

			return nativeTokenAddress
		},
		isRecipientRegistryFull(): boolean {
			return this.recipientSpacesRemaining === 0
		},
		isRecipientRegistryFillingUp(): boolean {
			return this.recipientSpacesRemaining !== null && this.recipientSpacesRemaining < 20
		},
		recipientSpacesRemaining: (state): number | null => {
			const recipientStore = useRecipientStore()
			if (!state.currentRound || !recipientStore.recipientRegistryInfo) {
				return null
			}
			const maxRecipients = state.currentRound.maxRecipients
			const recipientCount = recipientStore.recipientRegistryInfo.recipientCount
			return maxRecipients - recipientCount
		},
		maxRecipients: (state): number | undefined => {
			const { currentRound, maciFactory } = state

			if (currentRound) {
				return currentRound.maxRecipients
			}

			if (maciFactory) {
				return maciFactory.maxRecipients
			}
		},
		hasReallocationPhaseEnded(): boolean {
			return (
				!!this.currentRound && (hasDateElapsed(this.currentRound.votingDeadline) || this.isMessageLimitReached)
			)
		},
		hasUserVoted: (state): boolean => {
			return state.hasVoted
		},
	},
	actions: {
		setHasVote(hasVoted: boolean) {
			this.hasVoted = hasVoted
		},
		async loginUser(walletAddress: string, encryptionKey: string) {
			await loginUser(walletAddress, encryptionKey)
		},
		logoutUser() {
			this.unwatchCart()
			this.unwatchContributorData()
			logoutUser()
			this.currentUser = null
			this.contribution = null
			this.contributor = null
			this.cart = []
		},
		setCurrentUser(user: User) {
			this.currentUser = user
		},
		async loadRoundInfo() {
			const roundAddress = this.currentRoundAddress
			if (roundAddress === null) {
				this.currentRound = null
				return
			}
			//TODO: update to take factory address as a parameter, default to env. variable
			const round = await getRoundInfo(roundAddress)
			this.currentRound = round
		},
		selectRound(roundAddress: string) {
			if (this.currentRoundAddress) {
				const recipientStore = useRecipientStore()
				// Reset everything that depends on round
				this.unwatchCart()
				this.unwatchContributorData()
				this.contribution = null
				this.contributor = null
				this.cart = []
				recipientStore.recipientRegistryAddress = null
				recipientStore.recipientRegistryInfo = null
				this.currentRound = null
			}
			this.currentRoundAddress = roundAddress
		},
		unwatchCart() {
			if (!this.currentUser || !this.currentRound) {
				return
			}
			storage.unwatchItem(
				this.currentUser.walletAddress,
				getCartStorageKey(this.currentRound.fundingRoundAddress),
			)
		},
		loadCart() {
			storage.watchItem(
				this.currentUser!.walletAddress,
				this.currentUser!.encryptionKey,
				getCartStorageKey(this.currentRound!.fundingRoundAddress),
				(data: string | null) => {
					const cart = deserializeCart(data)
					this.cart = []
					for (const item of cart) {
						this.addCartItem(item)
					}
				},
			)
		},
		addCartItem(addedItem: CartItem) {
			const itemIndex = this.cart.findIndex(item => {
				return item.id === addedItem.id
			})
			if (itemIndex === -1) {
				// Look for cleared item
				const clearedItemIndex = this.cart.findIndex(item => {
					return item.isCleared
				})
				if (clearedItemIndex !== -1) {
					// Replace
					this.cart[clearedItemIndex] = addedItem
				} else {
					this.cart.push(addedItem)
				}
			} else {
				/* eslint-disable-next-line no-console */
				console.warn('item is already in the cart')
				this.cart[itemIndex] = addedItem
			}
		},
		removeCartItem(removedItem: CartItem) {
			const itemIndex = this.cart.findIndex(item => {
				return item.id === removedItem.id
			})
			if (itemIndex === -1) {
				throw new Error('item is not in the cart')
			} else if (this.contribution === null) {
				throw new Error('invalid operation')
			} else if (this.contribution.isZero() || this.cart.length > MAX_CART_SIZE) {
				this.cart.splice(itemIndex, 1)
			} else {
				// The number of MACI messages can't go down after initial submission
				// so we just clear contribution amount and mark item with a flag
				this.cart[itemIndex] = {
					...removedItem,
					amount: '0',
					isCleared: true,
				}
			}
		},
		clearCart() {
			this.cart = []
		},
		saveCart() {
			const serializedCart = serializeCart(this.cart)
			storage.setItem(
				this.currentUser?.walletAddress as string,
				this.currentUser?.encryptionKey as string,
				getCartStorageKey(this.currentRound?.fundingRoundAddress as string),
				serializedCart,
			)
		},
		saveCommittedCartDispatch() {
			this.saveCommittedCart()
			const serializedCart = serializeCart(this.committedCart)
			storage.setItem(
				this.currentUser!.walletAddress,
				this.currentUser!.encryptionKey,
				getCommittedCartStorageKey(this.currentRound!.fundingRoundAddress),
				serializedCart,
			)
		},
		saveCommittedCart() {
			this.committedCart = [...this.cart.filter(item => Number(item.amount) !== 0)]
		},
		updateCartItem(updatedItem: CartItem) {
			const itemIndex = this.cart.findIndex(item => {
				return item.id === updatedItem.id
			})
			if (itemIndex === -1) {
				throw new Error('item is not in the cart')
			}
			this.cart[itemIndex] = updatedItem
		},
		restoreCommittedCartToLocalCart() {
			// Spread to avoid reference
			this.cart = [...this.committedCart]
		},

		toggleEditSelection(isOpen?: boolean | undefined) {
			// Handle the case of both null and undefined
			if (isOpen != null) {
				this.cartEditModeSelected = isOpen
			} else {
				this.cartEditModeSelected = !this.cartEditModeSelected
			}
		},
		toggleShowCartPanel(isOpen?: boolean | undefined) {
			// Handle the case of both null and undefined
			if (isOpen != null) {
				this.showCartPanel = isOpen
			} else {
				this.showCartPanel = !this.showCartPanel
			}
		},
		toggleTheme(theme?: string) {
			if (theme) {
				this.theme = theme
			} else {
				this.theme = this.theme === ThemeMode.LIGHT ? ThemeMode.DARK : ThemeMode.LIGHT
			}
		},
		loadCommittedCart() {
			storage.watchItem(
				this.currentUser!.walletAddress,
				this.currentUser!.encryptionKey,
				getCommittedCartStorageKey(this.currentRound!.fundingRoundAddress),
				(data: string | null) => {
					const committedCart = deserializeCart(data)
					this.committedCart = committedCart
					// Spread to avoid reference
					this.cart = [...this.committedCart]
				},
			)
		},
		setContributor(contributor: Contributor | null) {
			this.contributor = contributor
		},
		setContribution(contribution: BigNumber | null) {
			this.contribution = contribution
		},
		saveContributorData() {
			const serializedData = serializeContributorData(this.contributor!)
			storage.setItem(
				this.currentUser!.walletAddress,
				this.currentUser!.encryptionKey,
				getContributorStorageKey(this.currentRound!.fundingRoundAddress),
				serializedData,
			)
		},
		loadContributorData() {
			storage.watchItem(
				this.currentUser!.walletAddress,
				this.currentUser!.encryptionKey,
				getContributorStorageKey(this.currentRound!.fundingRoundAddress),
				(data: string | null) => {
					const contributor = deserializeContributorData(data)
					if (contributor) {
						this.contributor = contributor
					}
				},
			)
		},
		unwatchContributorData() {
			if (!this.currentUser || !this.currentRound) {
				return
			}
			storage.unwatchItem(
				this.currentUser.walletAddress,
				getContributorStorageKey(this.currentRound.fundingRoundAddress),
			)
		},
		async loadUserInfo() {
			if (!this.currentUser) {
				return
			}

			let nativeTokenAddress = ''
			let userRegistryAddress = ''
			let balance: BigNumber | null = null

			if (this.factory) {
				nativeTokenAddress = this.factory.nativeTokenAddress
				userRegistryAddress = this.factory.userRegistryAddress
			}

			if (this.currentRound) {
				nativeTokenAddress = this.currentRound.nativeTokenAddress
				userRegistryAddress = this.currentRound.userRegistryAddress

				let contribution = this.contribution
				if (!contribution || contribution.isZero()) {
					contribution = await getContributionAmount(
						this.currentRound.fundingRoundAddress,
						this.currentUser.walletAddress,
					)

					const hasVoted = await hasContributorVoted(
						this.currentRound.fundingRoundAddress,
						this.currentUser.walletAddress,
					)

					this.contribution = contribution
					this.hasVoted = hasVoted
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

				this.setCurrentUser({
					...this.currentUser,
					brightId,
				})
			}
		},
		async loadFactoryInfo() {
			const factory = await getFactoryInfo()
			this.factory = factory
		},
		async loadMACIFactoryInfo() {
			const factory = await getMACIFactoryInfo()
			this.maciFactory = factory
		},
		async loadTally() {
			const currentRound = this.currentRound
			if (currentRound && currentRound.status === RoundStatus.Finalized) {
				const tally = await getTally(this.currentRoundAddress!)
				this.tally = tally
			}
		},
	},
})

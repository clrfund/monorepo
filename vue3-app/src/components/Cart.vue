<template>
	<div class="h100">
		<div v-if="!currentUser" class="empty-cart">
			<div class="moon-emoji">🌚</div>
			<h3>Connect to see your cart</h3>
			<wallet-widget :is-action-button="true" />
		</div>
		<div v-else class="cart-container">
			<div v-if="canUserReallocate && hasUserVoted" class="reallocation-message">
				You’ve already contributed this round. You can edit your choices and add new projects, but your cart
				total must always equal your original contribution amount.
				<links to="/about/maci" class="message-link">Why?</links>
			</div>
			<div v-if="canUserReallocate && !hasUserVoted" class="reallocation-message">
				Almost done! You must submit one more transaction to complete your contribution.
			</div>
			<div class="flex cart-title-bar">
				<div v-if="showCollapseCart" class="absolute-left cart-btn" @click="toggleCart">
					<img alt="cart" width="16" src="@/assets/cart.svg" />
					<img alt="close" width="16" src="@/assets/chevron-right.svg" />
				</div>
				<h2>{{ isEditMode ? 'Edit cart' : 'Your cart' }}</h2>
				<div
					v-if="(isRoundContributionPhase || canUserReallocate) && !isCartEmpty"
					class="absolute-right dropdown"
				>
					<img class="dropdown-btn" src="@/assets/more.svg" @click="openDropdown" />
					<div id="cart-dropdown" class="button-menu">
						<div
							v-for="({ callback, text, icon, cssClass }, idx) of dropdownItems"
							:key="idx"
							class="dropdown-item"
							@click="callback"
						>
							<img width="16" :class="cssClass" :src="`src/assets/${icon}`" />
							<p>{{ text }}</p>
						</div>
					</div>
				</div>
			</div>
			<div class="messages-and-cart-items">
				<div v-if="hasUserContributed && hasReallocationPhaseEnded" class="reallocation-intro">
					This round is over. Here’s how you contributed. Thanks!
				</div>
				<div class="cart">
					<div v-if="!hasUserContributed && hasContributionPhaseEnded" class="empty-cart">
						<div class="moon-emoji">🌚</div>
						<h3>Too late to donate</h3>
						<div>Sorry, the deadline for donating has passed.</div>
					</div>
					<div v-else-if="isCartEmpty && isRoundContributionPhase" class="empty-cart">
						<div class="moon-emoji">🌚</div>
						<h3>Your cart is empty</h3>
						<div>Choose some projects that you want to contribute to...</div>
						<links to="/projects" class="btn-secondary mobile mt1">See projects</links>
					</div>
					<div v-else-if="canUserReallocate && !isCartEmpty">
						<div class="flex-row-reallocation">
							<div class="semi-bold">
								{{ isEditMode ? 'Edit contributions' : 'Your contributions' }}
							</div>
							<div v-if="canUserReallocate" class="semi-bold">
								<button class="pointer" @click="handleEditState">
									{{ isEditMode ? 'Cancel' : 'Edit' }}
								</button>
							</div>
						</div>
					</div>
					<div v-else-if="hasUserContributed" id="readOnly" class="flex-row-reallocation">
						<!-- Round is finalized -->
						<div>Your contributions</div>
					</div>
					<cart-items
						v-if="hasUserContributed || !hasContributionPhaseEnded"
						:cart-list="filteredCart"
						:is-edit-mode="isEditMode"
						:is-amount-valid="isAmountValid"
					/>
				</div>
				<div
					v-if="(canUserReallocate && !isEditMode) || (isRoundContributionPhase && !canUserReallocate)"
					class="time-left-read-only"
				>
					<div class="caps">Time left:</div>
					<time-left :date="timeLeftDate" />
				</div>
			</div>
			<div v-if="canUserReallocate && isEditMode" class="reallocation-section">
				<div class="reallocation-row">
					<span>Original contribution</span>
					{{ formatAmount(contribution) }} {{ tokenSymbol }}
				</div>
				<div :class="isGreaterThanInitialContribution() ? 'reallocation-row-warning' : 'reallocation-row'">
					<span>Your cart</span>
					<div class="reallocation-warning">
						<span v-if="isGreaterThanInitialContribution()">⚠️</span>{{ formatAmount(getCartTotal(cart)) }}
						{{ tokenSymbol }}
					</div>
				</div>
				<div v-if="hasUnallocatedFunds()" class="reallocation-row-matching-pool">
					<div>
						<div><b>Matching pool</b></div>
						<div>Remaining funds go to matching pool</div>
					</div>
					+ {{ BigInt(formatAmount(contribution)) - BigInt(formatAmount(getTotal())) }}
					{{ tokenSymbol }}
				</div>
				<div
					v-if="isGreaterThanInitialContribution() || hasUnallocatedFunds()"
					class="split-link"
					@click="splitContributionsEvenly"
				>
					<img src="@/assets/split.svg" /> Split {{ formatAmount(contribution) }} {{ tokenSymbol }} evenly
				</div>
			</div>
			<div v-if="canWithdrawContribution() && cart.length >= 1" class="submit-btn-wrapper">
				<button class="btn-action" @click="withdrawContribution()">
					Withdraw {{ formatAmount(contribution) }} {{ tokenSymbol }}
				</button>
			</div>
			<div
				v-if="
					((canUserReallocate && isEditMode) ||
						(!canUserReallocate && isRoundContributionPhase) ||
						!hasUserVoted) &&
					cart.length >= 1
				"
				class="submit-btn-wrapper"
			>
				<div v-if="errorMessage" class="error-title">
					Can't
					<span v-if="canUserReallocate">reallocate</span>
					<span v-else>contribute</span>
				</div>
				<div v-if="errorMessage" class="submit-error">
					{{ errorMessage }}
				</div>
				<div v-if="hasUnallocatedFunds()" class="p1">
					Funds you don't contribute to projects ({{
						BigInt(formatAmount(contribution)) - BigInt(formatAmount(getTotal()))
					}}
					{{ tokenSymbol }}) will be sent to the matching pool at the end of the round. Your cart must add up
					to your original {{ formatAmount(contribution) }} {{ tokenSymbol }} donation.
				</div>
				<div v-if="isBrightIdRequired" class="p1">
					<links to="/verify" class="btn-primary"> Verify with BrightID </links>
				</div>
				<button
					v-if="!isCartEmpty"
					class="btn-action"
					:disabled="!!errorMessage || (hasUserContributed && hasUserVoted && !isDirty)"
					@click="submitCart"
				>
					<template v-if="contribution.isZero()">
						Contribute {{ formatAmount(getTotal()) }} {{ tokenSymbol }} to {{ cart.length }} projects
					</template>
					<template v-else-if="!hasUserVoted"> Finish contribution </template>
					<template v-else> Reallocate contribution </template>
				</button>
				<funds-needed-warning :on-navigate="toggleCart" :is-compact="true" />
				<div v-if="canUserReallocate && isEditMode" class="time-left">
					<div class="caps">Time left:</div>
					<time-left :date="timeLeftDate" />
				</div>
			</div>
			<div v-if="hasUserContributed && !isEditMode" class="line-item-bar">
				<div class="line-item">
					<span>Projects</span>
					<div>
						<span>{{ formatAmount(getCartTotal(committedCart)) }} {{ tokenSymbol }}</span>
					</div>
				</div>
				<div class="line-item">
					<span>Matching Pool</span>
					<div>
						<span>{{ getCartMatchingPoolTotal() }} {{ tokenSymbol }}</span>
					</div>
				</div>
			</div>
			<div v-if="isRoundContributionPhase || (hasUserContributed && hasContributionPhaseEnded)" class="total-bar">
				<span class="total-label">Total</span>
				<div>
					<span v-if="isGreaterThanInitialContribution() && hasUserContributed"
						>{{ formatAmount(getCartTotal(cart)) }} /
						<span class="total-reallocation">{{ formatAmount(contribution) }}</span>
					</span>
					<span v-else>{{ formatAmount(getTotal()) }}</span>
					{{ tokenSymbol }}
				</div>
			</div>
			<div v-if="!currentRound" class="reallocation-section">
				No current round.
				<links v-if="isBrightIdRequired" to="/verify"> Verify with BrightID while you wait</links>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { BigNumber } from 'ethers'
import { parseFixed } from '@ethersproject/bignumber'
import { DateTime } from 'luxon'
import WalletWidget from '@/components/WalletWidget.vue'
import ContributionModal from '@/components/ContributionModal.vue'
import ReallocationModal from '@/components/ReallocationModal.vue'
import WithdrawalModal from '@/components/WithdrawalModal.vue'
import CartItems from '@/components/CartItems.vue'
import Links from '@/components/Links.vue'
import TimeLeft from '@/components/TimeLeft.vue'
import { MAX_CONTRIBUTION_AMOUNT, MAX_CART_SIZE, type CartItem, isContributionAmountValid } from '@/api/contributions'
import { userRegistryType, UserRegistryType, chain } from '@/api/core'
import { RoundStatus } from '@/api/round'
import { formatAmount as _formatAmount } from '@/utils/amounts'
import FundsNeededWarning from '@/components/FundsNeededWarning.vue'
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'
import { useEthers, useWallet } from 'vue-dapp'
import { $vfm } from 'vue-final-modal'
import { useRoute } from 'vue-router'

const route = useRoute()
const { onChainChanged, onAccountsChanged } = useWallet()
const { network } = useEthers()
const appStore = useAppStore()
const {
	cart,
	cartEditModeSelected,
	committedCart,
	currentRound,
	currentUser,
	isRoundContributionPhase,
	isRoundReallocationPhase,
	hasUserContributed,
	hasReallocationPhaseEnded,
	isMessageLimitReached,
	canUserReallocate,
	hasUserVoted,
	hasContributionPhaseEnded,
} = storeToRefs(appStore)
const profileImageUrl = ref<string | null>(null)
const dropdownItems = ref<
	{
		callback: () => void | null
		text: string
		icon: string
		cssClass?: string
	}[]
>([
	{
		callback: removeAll,
		text: 'Remove all',
		icon: 'remove.svg',
	},
	{
		callback: splitContributionsEvenly,
		text: 'Split evenly',
		icon: 'split.svg',
		cssClass: 'split-image',
	},
])

function removeAll(): void {
	appStore.clearCart()
	appStore.saveCart()
	appStore.toggleEditSelection(true)
}

const isEditMode = computed(() => {
	if (isRoundContributionPhase && !hasUserContributed) {
		return true
	}

	if ((isRoundContributionPhase && hasUserContributed) || isRoundReallocationPhase) {
		return cartEditModeSelected.value
	}

	return false
})

const isDirty = computed(() => {
	return cart.value
		.filter(item => !item.isCleared)
		.some((item: CartItem) => {
			const index = committedCart.value.findIndex((commitedItem: CartItem) => {
				return item.id === commitedItem.id && item.amount === commitedItem.amount
			})

			return index === -1
		})
})

function handleEditState(): void {
	// When hitting cancel in edit mode, restore committedCart to local cart
	if (cartEditModeSelected.value) {
		appStore.restoreCommittedCartToLocalCart()
	}
	appStore.toggleEditSelection()
}

function toggleCart(): void {
	appStore.toggleShowCartPanel()
}
const walletChainId = computed(() => network.value?.chainId)
const supportedChainId = computed(() => Number(import.meta.env.VITE_ETHEREUM_API_CHAINID))

const isCorrectNetwork = computed(() => supportedChainId.value === walletChainId.value)

onMounted(() => {
	// TODO: refactor, move `chainChanged` and `accountsChanged` from here to an
	// upper level where we hear this events only once (there are other
	// components that do the same).
	onChainChanged(chainId => {
		if (currentUser.value) {
			// Log out user to prevent interactions with incorrect network
			appStore.logoutUser()
		}
	})

	let accounts: string[]
	onAccountsChanged((_accounts: string[]) => {
		if (_accounts !== accounts) {
			// Log out user if wallet account changes
			appStore.logoutUser()
		}
		accounts = _accounts
	})
})
const tokenSymbol = computed(() => {
	const _currentRound = currentRound.value
	return currentRound ? _currentRound?.nativeTokenSymbol : ''
})
const contribution = computed(() => appStore.contribution || BigNumber.from(0))

const filteredCart = computed<CartItem[]>(() => {
	// Once reallocation phase ends, use committedCart for cart items
	if (hasReallocationPhaseEnded.value) {
		return committedCart.value
	}
	// Hide cleared items
	return cart.value.filter(item => !item.isCleared)
})

const isCartEmpty = computed(() => {
	return (
		currentUser.value &&
		contribution.value !== null &&
		contribution.value.isZero() &&
		filteredCart.value.length === 0
	)
})
function formatAmount(value: BigNumber): string {
	const { nativeTokenDecimals } = currentRound.value!
	return _formatAmount(value, nativeTokenDecimals)
}

function isAmountValid(value: string): boolean {
	return isContributionAmountValid(value, currentRound.value!)
}

function isFormValid(): boolean {
	const invalidCount = cart.value.filter(item => {
		return !item.isCleared && isAmountValid(item.amount) === false
	}).length
	return invalidCount === 0
}

function getCartMatchingPoolTotal(): string {
	return formatAmount(contribution.value.sub(getCartTotal(committedCart.value)))
}

function getCartTotal(cart: Array<CartItem>): BigNumber {
	const { nativeTokenDecimals, voiceCreditFactor } = currentRound.value!
	return cart.reduce((total: BigNumber, item: CartItem) => {
		let amount
		try {
			amount = parseFixed(item.amount, nativeTokenDecimals)
		} catch {
			return total
		}
		return total.add(amount.div(voiceCreditFactor).mul(voiceCreditFactor))
	}, BigNumber.from(0))
}

function getTotal(): BigNumber {
	return hasUserContributed.value ? contribution.value : getCartTotal(cart.value)
}

function isGreaterThanMax(): boolean {
	const decimals = currentRound.value?.nativeTokenDecimals
	const maxContributionAmount = BigNumber.from(10).pow(BigNumber.from(decimals)).mul(MAX_CONTRIBUTION_AMOUNT)
	return getTotal().gt(maxContributionAmount)
}

function isGreaterThanInitialContribution(): boolean {
	return getCartTotal(cart.value).gt(contribution.value)
}

const isBrightIdRequired = computed(
	() => userRegistryType === UserRegistryType.BRIGHT_ID && !currentUser.value?.isRegistered,
)

const errorMessage = computed<string | null>(() => {
	if (isMessageLimitReached.value) return 'The limit on the number of contributions has been reached'
	if (!currentUser.value) return 'Please connect your wallet'
	if (!isCorrectNetwork.value) return `Please change network to ${chain.label} network.`
	if (isBrightIdRequired.value) return 'To contribute, you need to set up BrightID.'
	if (!isFormValid()) return 'Include valid contribution amount.'
	if (cart.value.length > MAX_CART_SIZE) return `Your cart can't include over ${MAX_CART_SIZE} projects.`
	if (currentRound.value?.status === RoundStatus.Cancelled) return "Sorry, we've had to cancel this funding round."
	if (hasReallocationPhaseEnded.value) return 'The funding round has ended.'
	if (currentRound.value!.messages + cart.value.length >= currentRound.value!.maxMessages) {
		return 'Cart changes will exceed contribution capacity of this round'
		// } else if (currentRound.value!.messages + cart.value.length >= currentRound.value!.maxMessages) {
		// 	return 'The limit on the number of contributions has been reached'
		// }
	} else {
		const total = getTotal()
		if (contribution.value.isZero()) {
			// Contributing
			if (DateTime.local() >= currentRound.value!.signUpDeadline) {
				return 'Contributions are over for this funding round.'
				// the above error might not be necessary now we have our cart states in the HTML above
			} else if (currentRound.value!.contributors >= currentRound.value!.maxContributors) {
				return 'The limit on the number of contributors has been reached'
			} else if (total.eq(BigNumber.from(0)) && !isCartEmpty.value) {
				return `Your total must be more than 0 ${currentRound.value!.nativeTokenSymbol}`
			} else if (currentUser.value.balance === null) {
				return '' // No error: waiting for balance
			} else if (total.gt(currentUser.value!.balance!)) {
				const balanceDisplay = _formatAmount(
					currentUser.value!.balance!,
					currentRound.value!.nativeTokenDecimals,
				)
				return `Not enough funds. Your balance is ${balanceDisplay} ${currentRound.value!.nativeTokenSymbol}.`
			} else if (isGreaterThanMax()) {
				return `Your contribution is too generous. The max contribution is ${MAX_CONTRIBUTION_AMOUNT} ${
					currentRound.value!.nativeTokenSymbol
				}.`
			} else if (parseInt(currentUser.value?.etherBalance!.toString()) === 0) {
				return `You need some ETH to pay for gas`
			} else {
				return null
			}
		} else {
			// Reallocating funds
			if (!contribution.value) {
				return "Contributor key is not found. Refresh and try again and/or make sure you're using the same browser/machine as the one you contributed with."
			} else if (isGreaterThanInitialContribution()) {
				return `Your new total can't be more than your original ${formatAmount(
					contribution.value,
				)} contribution.`
			} else {
				return null
			}
		}
	}
})

function hasUnallocatedFunds(): boolean {
	return errorMessage.value === null && !contribution.value.isZero() && getTotal().lt(contribution.value)
}

function submitCart(event: any) {
	event.preventDefault()
	const { nativeTokenDecimals, voiceCreditFactor } = currentRound.value!
	const votes = cart.value.map((item: CartItem) => {
		const amount = parseFixed(item.amount, nativeTokenDecimals)
		const voiceCredits = amount.div(voiceCreditFactor)
		return [item.index, voiceCredits]
	})

	$vfm.show(
		{
			component: contribution.value.isZero() || !hasUserVoted.value ? ContributionModal : ReallocationModal,
		},
		{ votes },
	)
	// this.$modal.show(
	// 	contribution.value.isZero() || !hasUserVoted.value ? ContributionModal : ReallocationModal,
	// 	{ votes },
	// 	{
	// 		width: 500,
	// 		clickToClose: contribution.value.isZero() || !hasUserVoted.value,
	// 	},
	// )

	appStore.toggleEditSelection(false)
}

const canWithdrawContribution = () =>
	computed(() => currentRound.value?.status === RoundStatus.Cancelled && !contribution.value.isZero())

function withdrawContribution() {
	$vfm.show({ component: WithdrawalModal })
}

const showCollapseCart = computed(() => route.name !== 'cart')

function openDropdown() {
	document.getElementById('cart-dropdown')?.classList.toggle('show')
}

const timeLeftDate = computed<DateTime>(() => {
	return canUserReallocate.value ? currentRound.value!.votingDeadline : currentRound.value!.signUpDeadline
})

// Close the dropdown menu if the user clicks outside of it
window.onclick = function (event) {
	// @ts-ignore
	if (!event.target.matches('.dropdown-btn')) {
		const dropdowns = document.getElementsByClassName('button-menu')
		let i: number
		for (i = 0; i < dropdowns.length; i++) {
			const openDropdown = dropdowns[i]
			if (openDropdown.classList.contains('show')) {
				openDropdown.classList.remove('show')
			}
		}
	}
}

function splitContributionsEvenly(): void {
	appStore.toggleEditSelection(true)

	const filteredCart = cart.value.filter(item => !item.isCleared) // Filter out isCleared cart items for accurate split
	const total = canUserReallocate.value
		? formatAmount(contribution.value)
		: filteredCart.reduce((acc, curr) => (acc += parseFloat(curr.amount)), 0)
	const splitAmount = (total as number) / filteredCart.length
	// Each iteration subtracts from the totalRemaining until the last round to accomodate for decimal rounding. ex 10/3
	let totalRemaining = Number(total)

	filteredCart.map((item: CartItem, index: number) => {
		if (filteredCart.length - 1 === index) {
			appStore.updateCartItem({
				...item,
				amount: parseFloat(totalRemaining.toFixed(5)).toString(),
			})
		} else {
			appStore.updateCartItem({
				...item,
				amount: parseFloat(splitAmount.toFixed(5)).toString(),
			})
			totalRemaining -= Number(splitAmount.toFixed(5))
		}
	})
	appStore.saveCart()
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

h2 {
	line-height: 130%;
}

.cart-container {
	box-sizing: border-box;
	position: relative;
	gap: 1rem;
	height: 100%;
	padding: 1rem 0rem;
	padding-top: 0rem;
	width: 100%;
	border-left: 1px solid #000;

	@media (max-width: $breakpoint-m) {
		padding: 0rem;
	}
	@media (max-width: $breakpoint-s) {
		padding: 1rem 0rem;
		margin-bottom: 3rem;
	}
}

.balance {
	font-size: 16px;
	font-weight: 600;
	font-family: 'Glacial Indifference', sans-serif;
}

.reallocation-intro {
	padding: 1rem;
	padding-top: 0rem;
	margin-bottom: 1rem;
	font-size: 14px;
}

.profile-info-round {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.5rem 0.5rem;
	width: 100%;
}

.profile-info-balance img {
	height: 16px;
	width: 16px;
}

.button-container {
	width: 100%;
	padding: 0rem 1rem;
}

.time-left {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	width: 100%;
	margin-top: 1rem;
}

.time-left-read-only {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	padding: 1rem;
}

.cart-title-bar {
	position: sticky;
	padding: 1rem;
	top: 0;
	z-index: 1;
	@media (max-width: $breakpoint-m) {
		justify-content: space-between;
	}
	& > h2 {
		margin: 0;
		width: 100%;
		text-align: center;
		@media (max-width: $breakpoint-m) {
			margin-left: 1rem;
		}
	}
}

.flex-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0rem 1rem;
}

.semi-bold {
	font-weight: 500;
	font-size: 14px;
	button {
		font-family: 'Inter';
		font-weight: 500;
		font-size: 14px;
		color: var(--text-color);
		border: 0;
		background: none;
		text-decoration: underline;
	}
}

.flex {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.flex-row-reallocation {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0rem 1rem;
	margin: 1rem 0;
}

.absolute-left {
	/* position: absolute;
  left: 0; */
	/* margin-left: 1rem; */
}

.absolute-right {
	position: absolute;
	right: 1rem;
}

.cart-btn {
	@include button(white, var(--bg-light-color), 1px solid rgba($border-light, 0.3));
	border: 0px solid var(--text-color);
	background: transparent;
	padding: 0.75rem 0.5rem;
	border-radius: 0.5rem;
	display: flex;
	gap: 0.5rem;
	margin-right: -0.5rem;
	&:hover {
		background: var(--bg-secondary-color);
		gap: 0.75rem;
		margin-right: -0.75rem;
	}

	img {
		filter: var(--img-filter, invert(0.7));
	}
}

.cart {
	display: flex;
	flex-direction: column;
	width: 100%;
}

.empty-cart {
	font-size: 16px;
	font-weight: 400;
	margin: 1rem;
	padding: 1.5rem 1.5rem;

	img {
		height: 70px;
	}

	h3 {
		font-family: 'Glacial Indifference', sans-serif;
		font-size: 25px;
		font-weight: 700;
	}

	div {
		color: var(--text-color-cart);
	}
}

.line-item-bar {
	display: flex;
	flex-grow: 1;
	flex-direction: column;
	padding: 1rem 0;
	background: var(--bg-primary-color);
	font-family: 'Inter';
	font-size: 1rem;
	line-height: 0;
	font-weight: 400;
}

.line-item {
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	padding: 1rem;
}

.total-bar {
	box-sizing: border-box;
	display: flex;
	align-items: center;
	position: sticky;
	bottom: 0;
	padding: 1rem;
	justify-content: space-between;
	border-top: 1px solid #000;
	border-bottom: 1px solid #000;
	font-family: 'Inter';
	font-size: 1rem;
	line-height: 0;
	font-weight: 400;
	height: 60px;
	@media (max-width: $breakpoint-m) {
		position: fixed;
		bottom: 4rem;
		width: 100%;
	}
	@media (max-width: $breakpoint-s) {
		position: fixed;
		bottom: 4rem;
		width: 100%;
		padding: 1rem;
	}
}

.total-reallocation {
	font-family: 'Inter';
	font-size: 1rem;
	line-height: 0;
	font-weight: 700;
}

.total-label {
	font-family: 'Glacial Indifference', sans-serif;
	font-size: 1.5rem;
	font-weight: 700;
	line-height: 0;
	margin-right: 0.5rem;
}

.reallocation-message {
	padding: 1rem;
	background: $highlight-color;
	font-size: 14px;
}

.message-link {
	color: var(--text-color);
	text-decoration: underline;
}

.balance {
	padding: 1rem;
	background: var(--bg-primary-color);
	border-bottom: 1px solid #000000;
	border-top: 1px solid #000000;
	display: flex;
	justify-content: space-between;
}

.close-btn {
	display: flex;
	align-items: center;
	gap: 0.25rem;
	cursor: pointer;
	&:hover {
		transform: scale(1.01);
	}
}

.submit-btn-wrapper {
	align-self: flex-end;
	box-sizing: border-box;
	border-top: 1px solid #000000;
	text-align: left;
	gap: 0.5rem;
	width: 100%;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	padding: 1rem;
	position: relative;
	background: var(--bg-secondary-color);
	@media (max-width: $breakpoint-m) {
		padding: 2rem;
	}

	.error-title {
		text-align: left;
		color: var(--attention-color);
		:after {
			content: ' ⚠️';
		}
	}

	.submit-error {
		margin-bottom: 1rem;
	}

	.btn-action {
		padding-left: 0;
		padding-right: 0;
		width: 100%;
	}
}

.h100 {
	height: 100%;
}

.p1 {
	width: 100%;
	margin-bottom: 1rem;
}

.mt1 {
	margin-top: 1rem;
	width: fit-content;
}

.ml1 {
	margin-left: 1rem;
}

.moon-emoji {
	font-size: 4rem;
}

.reallocation-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-weight: 600;
	font-size: 16px;
	span {
		font-size: 14px;
		font-weight: 600;
	}
}

.reallocation-row-warning {
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-weight: 600;
	font-size: 16px;
	color: var(--attention-color);
	span {
		font-size: 14px;
		font-weight: 600;
		color: var(--text-color);
	}
}

.reallocation-warning {
	span {
		color: var(--attention-color);
		margin-right: 0.25rem;
	}
}

.split-link {
	display: flex;
	gap: 0.25rem;
	align-items: center;
	text-decoration: underline;
	cursor: pointer;
	justify-content: flex-end;
	&:hover {
		opacity: 0.8;
		transform: scale(1.01);
	}

	img {
		filter: var(--img-filter, invert(1));
	}
}

.reallocation-row-matching-pool {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	font-weight: 600;
	font-size: 16px;
	color: $clr-green;
	div {
		font-size: 14px;
		font-weight: 400;
		color: #fff;
		padding: 0.125rem 0;
	}
}

.reallocation-section {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	padding: 1rem;
	border-top: 1px solid #000;
}

.dropdown {
	position: relative;
	display: inline-block;

	img.dropdown-btn {
		margin: 0;
		filter: var(--img-filter, invert(1));
	}

	.button-menu {
		display: none;
		flex-direction: column;
		position: absolute;
		top: 2rem;
		right: 0.5rem;
		background: var(--bg-secondary-color);
		border: 1px solid rgba($border-light, 0.3);
		border-radius: 0.5rem;
		min-width: 160px;
		box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
		z-index: 1;
		cursor: pointer;
		overflow: hidden;

		.dropdown-item {
			display: flex;
			align-items: center;
			padding: 0.25rem;
			padding-left: 1rem;
			gap: 0.5rem;
			color: var(--text-color);
			&:hover {
				background: var(--bg-light-color);
			}

			.item-text {
				margin: 0;
				color: var(--text-color);
			}

			.split-image {
				filter: var(--img-filter, invert(1));
			}
		}
	}

	.show {
		display: flex;
	}
}

.flex {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}
</style>

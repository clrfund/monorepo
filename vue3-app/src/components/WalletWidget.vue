<template>
	<div :class="{ container: !isActionButton }">
		<button
			v-if="!currentUser"
			:class="{
				'btn-action': isActionButton,
				'app-btn': !isActionButton,
				'full-width-mobile': fullWidthMobile,
			}"
			@click="showModal()"
		>
			Connect
		</button>
		<div v-else-if="currentUser && !isActionButton" class="profile-info" @click="toggleProfile">
			<div class="profile-info-balance">
				<img v-if="showEth" :src="require(`@/assets/${chainCurrencyLogo}`)" />
				<img v-else :src="require(`@/assets/${tokenLogo}`)" />
				<div v-if="showEth" class="balance">{{ etherBalance }}</div>
				<div v-else class="balance">{{ balance }}</div>
			</div>
			<div class="profile-name">
				{{ displayAddress }}
			</div>
			<div class="profile-image">
				<img v-if="profileImageUrl" :src="profileImageUrl" />
			</div>
		</div>
		<profile v-if="showProfilePanel" :balance="balance!" :etherBalance="etherBalance!" @close="toggleProfile" />
	</div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { BigNumber } from 'ethers'
import { formatAmount } from '@/utils/amounts'
import { getTokenLogo } from '@/utils/tokens'
import { chain } from '@/api/core'
import Profile from '@/views/Profile.vue'
import { useAppStore } from '@/store/app'
import { storeToRefs } from 'pinia'
import { useBoard, useEthers, useWallet } from 'vue-dapp'

interface Props {
	// Boolean to only show Connect button, styled like an action button,
	// which hides the widget that would otherwise display after connecting
	showEth?: boolean
	isActionButton?: boolean
	// Boolean to allow connect button to be full width
	fullWidthMobile?: boolean
}

withDefaults(defineProps<Props>(), {
	showEth: false,
	isActionButton: false,
	fullWidthMobile: false,
})

const { open } = useBoard()
const { onDisconnect, onChainChanged, onAccountsChanged } = useWallet()
const { network } = useEthers()
const appStore = useAppStore()
const { currentUser, nativeTokenSymbol, nativeTokenDecimals } = storeToRefs(appStore)

const showProfilePanel = ref<boolean | null>(null)
const profileImageUrl = ref<string | null>(null)

const walletChainId = computed(() => network.value?.chainId)
const etherBalance = computed(() => {
	const etherBalance = currentUser.value?.etherBalance
	if (etherBalance === null || typeof etherBalance === 'undefined') {
		return null
	}
	return formatAmount(etherBalance, 'ether', 4)
})
const balance = computed(() => {
	const balance: BigNumber | null | undefined = currentUser.value?.balance
	if (balance === null || typeof balance === 'undefined') return null
	return formatAmount(balance, nativeTokenDecimals.value, 4)
})
const displayAddress = computed<string | null>(() => {
	if (!currentUser.value) return null
	return currentUser.value.ensName ?? currentUser.value.walletAddress
})

const tokenLogo = computed(() => getTokenLogo(nativeTokenSymbol.value))
const chainCurrencyLogo = computed(() => getTokenLogo(chain.currency))

onDisconnect(() => {
	appStore.logoutUser()
})

// TODO: refactor, move `chainChanged` and `accountsChanged` from here to an
// upper level where we hear this events only once (there are other
// components that do the same).
onChainChanged(() => {
	if (currentUser.value) {
		// Log out user to prevent interactions with incorrect network
		appStore.logoutUser()
	}
})

let accounts: string[]
onAccountsChanged(_accounts => {
	if (_accounts !== accounts) {
		// Log out user if wallet account changes
		appStore.logoutUser()
	}
	accounts = _accounts
})

onMounted(() => {
	showProfilePanel.value = false
})

async function showModal(): Promise<void> {
	open()
}

function toggleProfile(): void {
	showProfilePanel.value = !showProfilePanel.value
}

// TODO:
// @Watch('$web3.user')
// 	async updateProfileImage(currentUser: User): Promise<void> {
// 		if (currentUser) {
// 			const url = await getProfileImageUrl(currentUser.walletAddress)
// 			this.profileImageUrl = url
// 		}
// 	}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.container {
	margin-left: 0.5rem;
	width: fit-content;
}

.profile-info {
	display: flex;
	gap: 0.5rem;
	align-items: center;
	cursor: pointer;
	background: var(--bg-gradient);
	border-radius: 32px;
	padding-right: 0.5rem;
	width: fit-content;

	.profile-name {
		font-size: 14px;
		opacity: 0.8;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: min(20vw, 14ch);
		color: var(--text-color);
		@media (max-width: $breakpoint-s) {
			display: none;
		}
	}

	.balance {
		font-size: 14px;
		font-weight: 600;
		font-family: 'Glacial Indifference', sans-serif;
	}

	.profile-image {
		border-radius: 50%;
		box-sizing: border-box;
		height: $profile-image-size;
		/* margin-left: 20px; */
		overflow: hidden;
		width: $profile-image-size;
		box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
		cursor: pointer;
		img {
			height: 100%;
			width: 100%;
		}
		&:hover {
			opacity: 0.8;
			transform: scale(1.01);
			cursor: pointer;
		}
	}

	.profile-info-balance {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		cursor: pointer;
		background: var(--bg-primary-color);
		padding: 0.5rem 0.5rem;
		border-radius: 32px;
		margin: 0.25rem;
		margin-right: 0;
		color: var(--text-color);
	}

	.profile-info-balance img {
		height: 16px;
		width: 16px;
	}
}

.full-width-mobile {
	@media (max-width: $breakpoint-m) {
		width: 100%;
	}
}
</style>

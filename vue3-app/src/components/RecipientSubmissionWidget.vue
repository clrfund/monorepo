<template>
	<div class="tx-container">
		<div :class="isWaiting ? 'recipient-submission-widget shine' : 'recipient-submission-widget'">
			<loader v-if="isLoading" />
			<div :class="isWaiting || txError ? 'tx-progress-area' : 'tx-progress-area-no-notice'">
				<loader v-if="isWaiting" class="button-loader" />
				<div v-if="isWaiting" class="tx-notice">
					<div v-if="!!txHash">Waiting for transaction to be mined...</div>
					<div v-else>Check your wallet for a prompt...</div>
				</div>
				<div v-if="hasTxError" class="warning-icon">⚠️</div>
				<div v-if="hasTxError" class="warning-text">
					Something failed: {{ txError }}<br />
					Check your wallet or {{ blockExplorerLabel }} for more info.
				</div>
			</div>
			<div class="connected">
				<div class="total-title">
					Total to submit
					<img
						v-tooltip="{
							content: 'Estimate – this total may be slightly different in your wallet.',
							triggers: ['hover', 'click'],
						}"
						src="@/assets/info.svg"
					/>
				</div>
				<div class="total">
					{{ depositAmount }}
					<span class="total-currency"> {{ depositToken }}</span>
				</div>
				<div v-if="hasLowFunds" class="warning-text">
					Not enough {{ depositToken }} in your wallet.<br />
					Top up or connect a different wallet.
				</div>
				<div v-if="txHasDeposit" class="checkout-row">
					<p class="m05"><b>Security deposit</b></p>
					<p class="m05">
						{{ depositAmount }} {{ depositToken }}
						<span class="o5"
							>({{ fiatSign
							}}{{
								recipientRegistryInfo?.deposit ? calculateFiatFee(recipientRegistryInfo.deposit) : ''
							}})</span
						>
					</p>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { BigNumber } from 'ethers'
import { type EthPrice, fetchCurrentEthPrice } from '@/api/price'
import { chain } from '@/api/core'
import Loader from '@/components/Loader.vue'
import Transaction from '@/components/Transaction.vue'
import { formatAmount } from '@/utils/amounts'
import { useUserStore, useRecipientStore } from '@/stores'

interface Props {
	isWaiting: boolean
	txHash: string
	txError: string
}

const userStore = useUserStore()
const { currentUser } = storeToRefs(userStore)
const recipientStore = useRecipientStore()
const { recipientRegistryInfo } = storeToRefs(recipientStore)
const props = defineProps<Props>()

const isLoading = ref(true)
const ethPrice = ref<EthPrice | null>(null)
const fiatFee = ref('-')
const fiatSign = ref('$')

const blockExplorerLabel = computed(() => {
	return chain.explorerLabel
})

const hasTxError = computed(() => {
	return !!props.txError
})

const txHasDeposit = computed(() => {
	return !!recipientRegistryInfo.value?.deposit
})

const depositAmount = computed(() => {
	return recipientRegistryInfo.value ? formatAmount(recipientRegistryInfo.value.deposit, 18) : '...'
})

const hasLowFunds = computed(() => {
	if (currentUser.value?.etherBalance && recipientRegistryInfo.value?.deposit) {
		return currentUser.value.etherBalance.lt(recipientRegistryInfo.value.deposit)
	}
	return false
})

const depositToken = computed(() => {
	return recipientRegistryInfo.value?.depositToken ?? ''
})

function calculateFiatFee(ethAmount: BigNumber): string {
	if (recipientRegistryInfo.value && ethPrice.value) {
		return Number(ethPrice.value.ethereum.usd * Number(formatAmount(ethAmount, 18))).toFixed(2)
	}
	return '-'
}

onMounted(async () => {
	ethPrice.value = await fetchCurrentEthPrice()
	isLoading.value = false
})
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.tx-container {
	width: 100%;
	display: flex;
	justify-content: center;
}

.recipient-submission-widget {
	display: flex;
	flex-direction: column;
	background: var(--bg-primary-color);
	border-radius: 1rem;
	border: 1px solid var(--border-color);
	align-items: center;
	justify-content: center;
	width: 75%;
	margin-top: 1rem;
	@media (max-width: $breakpoint-m) {
		width: 100%;
		margin-top: 0;
	}
}

.shine {
	background: var(--bg-primary-color);
	background-image: linear-gradient(
		to right,
		var(--bg-primary-color) 0%,
		var(--bg-secondary-color) 10%,
		var(--bg-primary-color) 40%,
		var(--bg-primary-color) 100%
	);
	background-repeat: repeat;
	position: relative;

	-webkit-animation-duration: 8s;
	-webkit-animation-fill-mode: forwards;
	-webkit-animation-iteration-count: infinite;
	-webkit-animation-name: placeholderShimmer;
	-webkit-animation-timing-function: linear;
}

@-webkit-keyframes placeholderShimmer {
	0% {
		background-position: calc(-100vw) 0;
	}

	100% {
		background-position: calc(100vw) 0;
	}
}

.connected {
	width: 75%;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding-bottom: 2rem;
}

.tx-progress-area {
	background: var(--bg-inactive);
	text-align: center;
	border-radius: calc(1rem - 1px) calc(1rem - 1px) 0 0;
	padding: 1.5rem;
	width: -webkit-fill-available;
	margin-bottom: 2rem;
	display: flex;
	align-items: center;
	gap: 1rem;
	justify-content: center;
	font-weight: 500;
}

.tx-progress-area-no-notice {
	background: var(--bg-inactive);
	text-align: center;
	border-radius: calc(3rem - 1px) calc(3rem - 1px) 0 0;
	width: -webkit-fill-available;
	margin-bottom: 2rem;
	display: flex;
	align-items: center;
	gap: 1rem;
	justify-content: center;
	font-weight: 500;
	height: 1rem;
}

.total {
	font-size: 64px;
	font-weight: 700;
	font-family: 'Glacial Indifference', sans-serif;
	overflow-wrap: break-word;
	width: 100%;
	text-align: center;
	line-height: 100%;
	margin-bottom: 1rem;
}

.checkout-row {
	width: 100%;
	text-align: center;
	display: flex;
	align-items: center;
	justify-content: space-between;
	@media (max-width: $breakpoint-m) {
		flex-direction: column;
		justify-content: flex-start;
	}
}

.m05 {
	margin: 0.5rem 0rem;
}

.m2 {
	margin: 2rem 0rem;
}

.o5 {
	opacity: 0.5;
}

.total-currency {
	font-size: 48px;
}

.total-title {
	color: var(--text-color);
	font-size: 16px;
	font-weight: 400;
	line-height: 100%;
	text-transform: uppercase;
	justify-content: flex-start;
	align-items: center;
	display: flex;
	width: fit-content;
	padding: 0.5rem;
	background: var(--bg-light-color);
	border-radius: 2rem;
	gap: 0.25rem;
	margin-bottom: 0.5rem;

	img {
		width: 16px;
		height: 16px;
		filter: var(--img-filter, invert(0.3));
	}
}

.warning-icon {
	font-size: 24px;
}

.warning-text {
	font-size: 14px;
}

.warning-text,
.warning-icon {
	line-height: 150%;
	color: var(--attention-color);
	text-transform: uppercase;
	text-align: center;
}
</style>

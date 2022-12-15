<template>
	<div class="projects">
		<div class="round-info">
			<div class="image-wrapper">
				<image-responsive title="docking" height="100%" />
			</div>
			<template v-if="roundInfo">
				<div class="round">
					<div class="round-title-bar">
						<h2 class="round-title">{{ operator }}</h2>
						<VDropdown class="verified-container">
							<div class="verified">
								<img src="@/assets/verified.svg" />
							</div>
							<template #popper>
								<div class="contract-popover">
									<div class="contract-address">
										{{ roundInfo.fundingRoundAddress }}
									</div>
									<links :to="blockExplorer.url">View on {{ blockExplorer.label }}</links>
								</div>
							</template>
						</VDropdown>
					</div>
					<div v-if="isRoundCancelled" class="status">
						<div class="circle closed" />
						Cancelled
					</div>
					<div v-else-if="isCurrentRound && !isRoundFinalized && !isRoundTallying" class="status">
						<div class="circle open-pulse" />
						Open
					</div>
					<div v-else class="status">
						<div class="circle closed" />
						Closed
					</div>
				</div>
				<template v-if="isCurrentRound">
					<div v-if="isMaxMessagesReached" class="round-notice hidden">
						<span class="bold-all-caps">
							<p>The round is officially closed</p>
						</span>
						<p>
							It's now too late to contribute or reallocate your donations! Due to the community's
							generosity and some technical constraints we had to close the round earlier than expected.
							You can still help by donating to the matching pool.
						</p>
						<div class="dismiss-btn" @click="toggleNotice">Great!</div>
					</div>
					<div v-if="isRoundJoinOnlyPhase" class="round-info-item">
						<div class="full-width">
							<div class="round-info-item-top">
								<div class="round-info-title">⏱️ Round opening</div>
							</div>
						</div>
						<div class="round-info-value">
							<time-left :date="recipientJoinDeadline!" />
						</div>
					</div>
					<div v-else-if="isRoundContributionPhase && !hasUserContributed" class="round-info-item">
						<div class="full-width">
							<div class="round-info-item-top">
								<div class="round-info-title">Time left to contribute</div>
								<img
									v-tooltip="{
										content: 'During this phase, you can contribute to your favorite projects.',
										triggers: ['hover', 'click'],
									}"
									width="16"
									src="@/assets/info.svg"
								/>
							</div>
						</div>
						<div
							class="round-info-value"
							:title="'Contribution Deadline: ' + formatDate(roundInfo.signUpDeadline)"
						>
							<time-left :date="roundInfo.signUpDeadline" />
						</div>
					</div>
					<div v-else-if="isRoundReallocationPhase || canUserReallocate" class="round-info-item">
						<div class="full-width">
							<div class="round-info-item-top">
								<div class="round-info-title">
									{{ hasUserContributed ? 'Time left to reallocate' : 'Round status' }}
								</div>
								<img
									v-if="hasUserContributed"
									v-tooltip="{
										content: `During this phase, you can add/remove projects and change your contribution amounts. You can't make a contribution or increase your overall total.`,
										triggers: ['hover', 'click'],
									}"
									width="16"
									src="@/assets/info.svg"
								/>
								<img
									v-else-if="!currentUser"
									v-tooltip="{
										content: `If you've contributed, you can add/remove projects and change your contribution amounts. Please connect your wallet.`,
										triggers: ['hover', 'click'],
									}"
									width="16"
									src="@/assets/info.svg"
								/>
								<img
									v-else
									v-tooltip="{
										content: `This round has closed for new contributions.`,
										triggers: ['hover', 'click'],
									}"
									width="16"
									src="@/assets/info.svg"
								/>
							</div>
							<div v-if="!hasUserContributed" class="message">Closed for contributions</div>
							<div
								v-else
								class="round-info-value"
								:title="'Reallocation Deadline: ' + formatDate(roundInfo.votingDeadline)"
							>
								<div class="round-info-value">
									<time-left :date="roundInfo.votingDeadline" />
								</div>
							</div>
						</div>
					</div>
					<div v-else-if="isRoundTallying" class="round-info-item">
						<div class="full-width">
							<div class="round-info-item-top">
								<div class="round-info-title">Round status</div>
								<img
									v-tooltip="{
										content: `Our smart contracts are busy figuring out final contribution amounts.`,
										triggers: ['hover', 'click'],
									}"
									width="16"
									src="@/assets/info.svg"
								/>
							</div>
							<div class="round-info-value">
								<div class="message">Tallying all contributions</div>
							</div>
						</div>
					</div>
					<div v-else-if="isRoundFinalized" class="round-info-item">
						<div class="full-width">
							<div class="round-info-item-top">
								<div class="round-info-title">Round status</div>
								<img
									v-tooltip="{
										content: `If you're a project owner you can now claim your funds!`,
										triggers: ['hover', 'click'],
									}"
									width="16"
									src="@/assets/info.svg"
								/>
							</div>
							<div class="round-info-value">
								<div class="message">Contributions are ready to claim 🎉</div>
							</div>
						</div>
					</div>
				</template>
				<div class="round-value-info">
					<div class="round-value-info-item">
						<div class="full-width">
							<div class="round-info-item-top">
								<div class="round-info-title">Total in round</div>
								<img
									v-tooltip="{
										content: `This total includes the funds in the matching pool and all contributions from the community.`,
										triggers: ['hover', 'click'],
									}"
									width="16"
									src="@/assets/info.svg"
								/>
							</div>
							<div class="round-info-value">
								<div class="value large">{{ formatTotalInRound }}</div>
								<div class="unit">{{ roundInfo.nativeTokenSymbol }}</div>
							</div>
						</div>
					</div>
					<div class="round-info-sub-item">
						<div class="round-info-item-top">
							<div class="round-info-title">Matching pool</div>
							<img
								v-tooltip="{
									content:
										'These are the funds that will be distributed to all the projects based on the contributions they receive from the community.',
									triggers: ['hover', 'click'],
								}"
								width="16"
								src="@/assets/info.svg"
							/>
							<div
								v-if="isCurrentRound && !isRoundFinalized && !isRoundTallying && !isRoundCancelled"
								v-tooltip="'Add matching funds'"
								class="add-link"
								@click="addMatchingFunds"
							>
								<img src="@/assets/add.svg" width="16" />
								<span class="add-funds-link">Add funds</span>
							</div>
						</div>

						<div class="round-info-value">
							<div class="value">
								{{ formatAmount(roundInfo.matchingPool) }}
							</div>
							<div class="unit">{{ roundInfo.nativeTokenSymbol }}</div>
						</div>
					</div>
					<div class="round-info-sub-item">
						<div>
							<div class="round-info-title">Contributions total</div>
							<div class="round-info-value">
								<div class="value">
									{{ formatAmount(roundInfo.contributions) }}
								</div>
								<div class="unit">{{ roundInfo.nativeTokenSymbol }}</div>
							</div>
						</div>
					</div>
					<div class="round-info-sub-item">
						<div>
							<div class="round-info-title">Contributors</div>
							<div class="round-info-value">
								<div class="value">{{ roundInfo.contributors }}</div>
								<div class="unit">legend{{ roundInfo.contributors !== 1 ? 's' : '' }}</div>
							</div>
						</div>
					</div>
				</div>
			</template>
			<template v-else-if="!roundInfo && !isLoading">
				<div class="round-info-item">
					<div class="full-width">
						<div class="round-info-item-top">
							<div class="round-info-title">No scheduled round</div>
						</div>
					</div>
					<div class="round-announcement-info">We haven't yet scheduled a funding round. Stay tuned!</div>
				</div>
			</template>
			<loader v-if="isLoading" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import type { BigNumber, FixedNumber } from 'ethers'
import { DateTime } from 'luxon'
import { type RoundInfo, getRoundInfo } from '@/api/round'
import { chain } from '@/api/core'
import { lsGet, lsSet } from '@/utils/localStorage'
import { formatAmount as _formatAmount } from '@/utils/amounts'
import MatchingFundsModal from '@/components/MatchingFundsModal.vue'
import Loader from '@/components/Loader.vue'
import TimeLeft from '@/components/TimeLeft.vue'
import Links from '@/components/Links.vue'
import ImageResponsive from '@/components/ImageResponsive.vue'
import { useAppStore, useUserStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useBoard } from 'vue-dapp'
import { $vfm } from 'vue-final-modal'

const appStore = useAppStore()
const route = useRoute()
const { open: openWalletBoard, boardOpen } = useBoard()
// state
const isLoading = ref(true)
const roundInfo = ref<RoundInfo | null>(null)
const {
	operator,
	currentRoundAddress,
	currentRound,
	isRoundFinalized,
	isRoundTallying,
	hasUserContributed,
	isRoundReallocationPhase,
	canUserReallocate,
	recipientJoinDeadline,
	isRoundContributionPhase,
} = storeToRefs(appStore)
const userStore = useUserStore()
const { currentUser } = storeToRefs(userStore)

const lsIsNoticeHiddenKey = computed(() => `${roundInfo.value?.fundingRoundAddress}.is-notice-hidden`)
const isRoundCancelled = computed(() => appStore.isRoundCancelled(roundInfo.value))
const isMaxMessagesReached = computed(() => (!roundInfo.value ? true : false))
const isCurrentRound = computed(() => {
	const roundAddress = roundInfo.value?.fundingRoundAddress || ''
	return appStore.isCurrentRound(roundAddress)
})

const formatTotalInRound = computed(() => {
	if (!roundInfo.value) {
		return ''
	}

	const { contributions, matchingPool } = roundInfo.value
	const totalInRound = contributions.addUnsafe(matchingPool)

	return formatAmount(totalInRound)
})

onMounted(async () => {
	await loadRoundInfo()

	// Message cap notice defaults with `hidden` class
	// If it hasn't been dismissed yet, this class is toggled off until dismissed
	const showNotice = !lsGet(lsIsNoticeHiddenKey.value, false)
	if (showNotice) {
		toggleNotice()
	}
})

// Gets local storage key to look up if user has dismissed round notice (if message cap exceeded)
// Key specific to each round via round address
const roundAddress = computed(() => (route.params.address as string) || currentRoundAddress.value)
watch(roundAddress, async () => {
	await loadRoundInfo()
})

async function loadRoundInfo() {
	roundInfo.value = null
	isLoading.value = true
	if (roundAddress.value) {
		roundInfo.value = await getRoundInfo(roundAddress.value, currentRound.value)
	}
	isLoading.value = false
}

function toggleNotice() {
	const elements = document.getElementsByClassName('round-notice')
	for (let i = 0; i < elements.length; i++) {
		elements[i].classList.toggle('hidden')
	}
	lsSet(lsIsNoticeHiddenKey.value, !lsGet(lsIsNoticeHiddenKey.value))
}

const isRoundJoinOnlyPhase = computed(() => isCurrentRound.value && appStore.isRoundJoinOnlyPhase)

// function formatIntegerPart(value: FixedNumber): string {
// 	if (value._value === '0.0') {
// 		return '0'
// 	}
// 	const integerPart = value.toString().split('.')[0]
// 	return integerPart + (value.round(0) === value ? '' : '.')
// }

// function formatFractionalPart(value: FixedNumber): string {
// 	return value._value === '0.0' ? '' : value.toString().split('.')[1]
// }

function formatDate(value: DateTime): string {
	return value.toLocaleString(DateTime.DATETIME_SHORT) || ''
}

function formatAmount(value: BigNumber | FixedNumber | string): string {
	return _formatAmount(value, roundInfo.value?.nativeTokenDecimals, 4)
}

watch(boardOpen, (newVal, oldVal) => {
	// If closed but no user was connected in the event, then this will be closing the WalletModal
	// and dont do anythign else. If closed and a user was connected, call the addMatchingFunds method
	// again to pop open the MatchingFundsModal after the WalletModal.
	if (oldVal && !newVal) {
		if (currentUser.value) {
			addMatchingFunds()
		}
	}
})

function addMatchingFunds(): void {
	if (!currentUser.value) {
		openWalletBoard()
		return
	}

	$vfm.show({
		component: MatchingFundsModal,
		on: {
			close() {
				// Reload matching pool size
				appStore.loadRoundInfo()
			},
		},
	})
}

const blockExplorer = computed(() => ({
	label: chain.explorerLabel,
	url: `${chain.explorer}/address/${roundInfo.value?.fundingRoundAddress}`,
}))
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.image-wrapper {
	border-radius: 8px;
	background: var(--bg-gradient);
	height: 160px;
	width: 100%;
	display: flex;
	justify-content: center;
}

.image-wrapper img {
	mix-blend-mode: exclusion;
	transform: rotate(15deg);
}

.round {
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;
}

.round-title-bar {
	display: flex;
	align-items: center;
}

.round-title {
	line-height: 120%;
	margin: 0;
}

.verified-container {
	align-self: flex-end;
}

.verified {
	img {
		filter: var(--img-filter, invert(0.3));
	}
}

.contract-address {
	text-overflow: ellipsis;
	overflow: hidden;
	width: 100%;
	margin-bottom: 0.5rem;
}

.circle {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	margin-right: 0.5rem;
}

.closed {
	width: 12px;
	height: 12px;
	background: var(--bg-light-color);
}

.open-pulse {
	animation: pulse-animation 2s infinite ease-out;
	background: $clr-green;
}

@keyframes pulse-animation {
	0% {
		box-shadow: 0 0 0 0px $idle-color;
	}

	50% {
		box-shadow: 0 0 0 2.5px $clr-green;
	}

	100% {
		box-shadow: 0 0 0 5px $clr-pink;
	}
}

.projects {
	display: flex;
	justify-content: center;
}

.round-info {
	display: flex;
	flex-wrap: wrap;
	align-items: flex-start;
	gap: 1.5rem;
	margin-top: 1rem;
	max-width: 800px;

	@media (max-width: $breakpoint-m) {
		padding: 1rem;
		padding-bottom: 4rem;
	}
}

.round-value-info {
	width: 100%;
	display: grid;
	align-items: center;
	margin-bottom: 3rem;
	border-radius: 0.5rem;

	img {
		opacity: 0.6;
	}

	& > div {
		box-shadow: inset 0px -1px 0px #7375a6;

		&:first-of-type {
			border-radius: 0.5rem 0.5rem 0 0;
		}

		&:last-of-type {
			border-radius: 0 0 0.5rem 0.5rem;
			box-shadow: none;
		}
	}
}

.round-value-info-item {
	display: flex;
	flex: 1 0 auto;
	justify-content: space-between;
	align-items: center;
	background: var(--bg-light-highlight);
	padding: 1rem;
}

.round-info-item {
	display: flex;
	flex-direction: column;
	flex: 1 0 auto;
	justify-content: space-between;
	align-items: flex-start;
	background: var(--bg-light-highlight);
	padding: 1rem;
	border-radius: 0.5rem;
	box-sizing: border-box;
	width: 100%;

	img {
		opacity: 0.6;
	}
}

.round-info-item-top {
	width: 100%;
	display: flex;
	gap: 0.5rem;
	align-items: flex-start;
}

.round-info-sub-item {
	flex: 1 0 10%;
	background: var(--bg-secondary-highlight);
	padding: 1rem;

	img {
		opacity: 0.6;
	}
}

.round-info-title {
	color: var(--text-color);
	font-size: 14px;
	font-weight: 400;
	line-height: 120%;
	text-transform: uppercase;
	white-space: nowrap;
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 0.5rem;
}

.round-info-value {
	display: flex;
	flex-direction: row;
	align-items: flex-end;

	.value {
		font-size: 24px;
		font-family: 'Glacial Indifference', sans-serif;
		color: var(--text-color);
		font-weight: 700;
		line-height: 120%;

		&.large {
			font-size: 32px;
			line-height: 120%;
		}

		&.extra {
			font-size: 32px;
			font-family: 'Glacial Indifference', sans-serif;
			color: var(--text-color);
			line-height: 120%;
		}
	}

	.unit {
		color: var(--text-color);
		font-family: 'Glacial Indifference', sans-serif;
		font-size: 16px;
		font-weight: 600;
		text-transform: uppercase;
		line-height: 150%;
		margin: 0 0.5rem;

		&:last-child {
			margin-right: 0;
		}
	}
}

.round-announcement-info {
	.value {
		font-size: 24px;
		font-family: 'Glacial Indifference', sans-serif;
		color: white;
		font-weight: 700;
		line-height: 120%;

		&.large {
			font-size: 32px;
			line-height: 120%;
		}

		&.extra {
			font-size: 32px;
			font-family: 'Glacial Indifference', sans-serif;
			color: white;
			line-height: 120%;
		}
	}

	.unit {
		color: white;
		font-family: 'Glacial Indifference', sans-serif;
		font-size: 16px;
		font-weight: 600;
		text-transform: uppercase;
		line-height: 150%;
		margin: 0 0.5rem;

		&:last-child {
			margin-right: 0;
		}
	}
}

.message {
	color: var(--text-color);
	font-family: 'Glacial Indifference', sans-serif;
	font-size: 16px;
	font-weight: 600;
	text-transform: uppercase;
	line-height: 150%;
}

.add-matching-funds-btn {
	display: inline-block;
	margin-left: 5px;

	img {
		height: 1.8em;
		vertical-align: middle;
	}
}

.project-list {
	box-sizing: border-box;
	margin: 100%;

	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
	gap: $content-space;
}

/* @media (max-width: 1500px) {
  .round-info-item:nth-child(2n) {
    break-after: always;
  }

  .round-info-title {
    margin-bottom: calc($content-space / 2);
    font-size: 14px;
  }
} */

.add-link {
	display: flex;
	gap: 0.25rem;
	color: $clr-green;
	margin-left: auto;
	cursor: pointer;

	&:hover {
		opacity: 0.8;
	}
}

.add-funds-link {
	font-size: 14px;
}

.status {
	font-size: 16px;
	display: flex;
	align-items: center;
}

.full-width {
	width: 100%;
}

.round-notice {
	background: var(--warning-background);
	border: 1px solid var(--warning-border);
	border-radius: 0.5rem;
	padding: 0.5rem 1rem 1rem;
	color: var(--warning-color);
	font-size: 14px;
	line-height: 150%;
	font-weight: 500;

	.bold-all-caps {
		text-transform: uppercase;
		font-weight: 600;
	}

	.dismiss-btn {
		@include button(var(--warning-color), none, 1px solid var(--warning-color));
		margin: 0 auto;
		width: fit-content;
		padding: 0.25rem 1.25rem;
	}
}

.hidden {
	display: none;
}

.has-tooltip {
	filter: var(--img-filter, invert(0.7));
}
</style>

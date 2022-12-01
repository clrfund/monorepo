<template>
	<div id="join-landing">
		<div class="gradient">
			<div class="hero">
				<image-responsive title="core" />
			</div>
		</div>

		<round-status-banner />

		<div class="breadcrumbs">
			<breadcrumbs />
		</div>
		<div v-if="loading" class="content">
			<h1>Fetching round data...</h1>
			<loader />
		</div>

		<div v-else-if="hasContributionPhaseEnded" class="content">
			<div class="big-emoji">☹</div>
			<h1>Sorry, it's too late to join</h1>
			<div id="subtitle" class="subtitle">
				The round is closed for new projects. It's now too late to get on board.
			</div>
			<div id="subtitle" class="subtitle mt2">
				Check out these
				<links to="https://ethereum.org/en/community/grants/">other ways to source funding</links>. Or follow us
				on Twitter for updates about future rounds:
				<links to="https://twitter.com/clrfund">@clrfund</links>
			</div>
			<div class="btn-container">
				<links to="/" class="btn-primary">Home</links>
			</div>
		</div>

		<div v-else-if="isRoundFull" class="content">
			<div class="big-emoji">☹</div>
			<h1>Sorry, the round is full</h1>
			<div id="subtitle" class="subtitle">
				The tech we use to protect you from bribery and collusion, MACI, limits the number of projects right
				now. Unfortunately we've hit the cap and there's no more room on board.
			</div>
			<div id="subtitle" class="subtitle mt2">
				Check out these
				<links to="https://ethereum.org/en/community/grants/">other ways to source funding</links>. Or follow us
				on Twitter for updates about future rounds:
				<links to="https://twitter.com/clrfund">@clrfund</links>
			</div>
			<div class="btn-container">
				<links to="/" class="btn-primary">Home</links>
				<links to="/about" class="btn-secondary">More on MACI</links>
			</div>
		</div>

		<div v-else-if="appStore.currentRound" class="content">
			<h1>Join the funding round</h1>
			<div class="subtitle">
				We’ll need some information about your project and a
				<strong>{{ formatAmount(deposit!) }} {{ depositToken }}</strong> security deposit.
			</div>
			<div class="subtitle mt2">
				The round only accepts a total of {{ maxRecipients }} projects, so apply now while there’s still room!
			</div>
			<div class="info-boxes">
				<div class="apply-callout">
					<div class="countdown-label caps">Time left to join</div>
					<div class="countdown caps">
						<time-left value-class="none" unit-class="none" :date="signUpDeadline!" />
					</div>
				</div>
				<div class="apply-callout">
					<div class="countdown-label caps">Time to complete</div>
					<div class="countdown caps">15 minutes (ish)</div>
				</div>
				<div v-if="isRoundFillingUp" class="apply-callout-warning">
					<div class="filling-up-container">
						<div class="countdown caps">{{ spacesRemainingString }} left, hurry!</div>
						<div class="dropdown">
							<img class="icon" src="@/assets/info.svg" @click="openTooltip" />
							<div id="myTooltip" class="hidden button-menu">
								MACI, our anti-bribery tech, currently limits the amount of projects allowed per round.
								<links to="/about/maci">More on MACI</links>
							</div>
						</div>
					</div>
					<p class="warning-text">
						You will get your deposit back if you don’t make it into the round this time.
					</p>
				</div>
			</div>
			<div class="btn-container">
				<button class="btn-secondary" @click="toggleCriteria">See round criteria</button>
				<links to="/join/project" class="btn-primary">Add project</links>
			</div>
		</div>

		<div v-else class="content">
			<h1>Join the next funding round</h1>
			<div class="subtitle">
				We’ll need some information about your project and a
				<strong>{{ formatAmount(deposit!) }} {{ depositToken }}</strong> security deposit.
			</div>
			<div class="subtitle mt2">
				The round only accepts a total of {{ maxRecipients }} projects, so apply now while there’s still room!
			</div>
			<div class="info-boxes">
				<div class="apply-callout">
					<div class="countdown-label caps">Time to complete</div>
					<div class="countdown caps">15 minutes (ish)</div>
				</div>
			</div>
			<div class="btn-container">
				<button class="btn-secondary" @click="toggleCriteria">See round criteria</button>
				<links to="/join/project" class="btn-primary">Add project</links>
			</div>
		</div>

		<criteria-modal v-if="showCriteriaPanel" @close="toggleCriteria" />
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { DateTime } from 'luxon'
import type { BigNumber } from 'ethers'

import type { RegistryInfo } from '@/api/recipient-registry-optimistic'
import Loader from '@/components/Loader.vue'
import CriteriaModal from '@/components/CriteriaModal.vue'
import Breadcrumbs from '@/components/Breadcrumbs.vue'
import Links from '@/components/Links.vue'
import RoundStatusBanner from '@/components/RoundStatusBanner.vue'
import TimeLeft from '@/components/TimeLeft.vue'
import ImageResponsive from '@/components/ImageResponsive.vue'

import { getCurrentRound } from '@/api/round'
import { formatAmount as _formatAmount } from '@/utils/amounts'
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'

const appStore = useAppStore()
const { recipientRegistryInfo, maxRecipients, isMessageLimitReached, hasContributionPhaseEnded } = storeToRefs(appStore)

const currentRound = ref<string | null>(null)
const loading = ref(true)
const showCriteriaPanel = ref(false)

const links = computed<Array<{ link: string; url: string }>>(() => [{ link: 'join', url: '/join' }])

const registryInfo = computed<RegistryInfo>(() => recipientRegistryInfo.value!)

const deposit = computed<BigNumber | null>(() => registryInfo.value.deposit)
const depositToken = computed<string | null>(() => registryInfo.value.depositToken)
const recipientCount = computed(() => registryInfo.value.recipientCount)
const signUpDeadline = computed(() => appStore.currentRound?.signUpDeadline)
const spacesRemaining = computed(() => {
	// eslint-disable-next-line
	if (!appStore.currentRound || !registryInfo.value) {
		return null
	}
	return appStore.currentRound.maxRecipients - registryInfo.value.recipientCount
})

const isRoundFull = computed(() => {
	if (spacesRemaining.value === null) {
		return false
	}
	return spacesRemaining.value === 0 || isMessageLimitReached.value
})

const isRoundFillingUp = computed(() => {
	if (spacesRemaining.value === null) {
		return false
	}
	return spacesRemaining.value < 20
})

const spacesRemainingString = computed(() =>
	spacesRemaining.value === 1 ? '1 space' : `${spacesRemaining.value} spaces`,
)

onMounted(async () => {
	currentRound.value = await getCurrentRound()
	loading.value = false
})

function openTooltip(): void {
	document.getElementById('myTooltip')?.classList.toggle('hidden')
}

function toggleCriteria(): void {
	showCriteriaPanel.value = !showCriteriaPanel.value
}

function formatAmount(value?: BigNumber): string {
	if (!value) return ''
	return _formatAmount(value, 18)
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

h1 {
	font-family: Glacial Indifference;
	font-style: normal;
	font-weight: bold;
	font-size: 40px;
	line-height: 120%;
}

.gradient {
	position: fixed;
	top: 0;
	right: 0;
	height: 100%;
	width: 100%;
	background: var(--bg-gradient);

	.hero {
		position: fixed;
		top: 0;
		right: 0;
		height: 100%;
		width: 100%;
		background: var(--bg-gradient-hero);
		@media (max-width: $breakpoint-m) {
			width: 100%;
			padding-bottom: 0rem;
		}

		img {
			position: absolute;
			bottom: 0;
			right: calc(-700px + 50vw);
			mix-blend-mode: exclusion;
			max-width: 88%;
			max-height: 100%;

			@media (max-width: $breakpoint-m) {
				right: 1rem;
				width: 100%;
			}
		}
	}
}

.breadcrumbs {
	position: relative;
	z-index: 1;
	box-sizing: border-box;
	padding-left: $content-space;
	margin-left: 2rem;
	width: min(100%, 512px);
}

.content {
	position: relative;
	z-index: 1;
	box-sizing: border-box;
	padding: $content-space;
	margin-left: 2rem;
	width: min(100%, 512px);
	@media (max-width: $breakpoint-m) {
		width: 100%;
		margin: 0;
		padding-bottom: 35vw;
	}
}

.countdown {
	font-family: 'Glacial Indifference', sans-serif;
	font-weight: bold;
	font-size: 24px;
	letter-spacing: -0.015em;
}

.countdown-label {
	font-family: Glacial Indifference;
	font-size: 16px;
	font-style: normal;
	font-weight: 400;
	line-height: 21px;
	letter-spacing: 6px;
	text-align: left;
	margin-bottom: 0.5rem;
}

.subtitle {
	font-size: 20px;
}

.apply-callout {
	background: var(--bg-transparent);
	border: 2px solid var(--border-highlight);
	box-sizing: border-box;
	border-radius: 8px;
	padding: 1rem;
	margin-top: 1rem;
	&:first-of-type {
		margin-top: 2rem;
	}
}

.icon {
	width: 16px;
	height: 16px;
	filter: var(--img-filter, invert(0.7));
}

.apply-callout-warning {
	background: var(--warning-background);
	border: 2px solid var(--warning-border);
	box-sizing: border-box;
	border-radius: 8px;
	padding: 1rem;
	margin-top: 1rem;
}

.filling-up-container {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
}

.warning-text {
	margin-bottom: 0;
	color: var(--warning-color);
}

.info-boxes {
	margin-bottom: 2rem;
}

.button-menu {
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
	padding: 1rem 0.25rem;
	text-align: center;
}

.dropdown {
	position: relative;
	display: inline-block;
}

.show {
	display: flex;
}

.btn-container {
	margin-top: 2.5rem;
}
</style>

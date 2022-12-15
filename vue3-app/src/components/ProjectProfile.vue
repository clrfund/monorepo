<template>
	<div v-if="project" class="project-page">
		<info
			v-if="previewMode"
			class="info"
			message="This is what your contributors will see when they visit your project page."
		/>
		<img v-if="previewMode" class="project-image" :src="project.bannerImageUrl" :alt="project.name" />
		<div class="about">
			<h1 class="project-name" :title="addressName" :project-index="project.index">
				<links v-if="klerosCurateUrl" :to="klerosCurateUrl">{{ project.name }}</links>
				<span v-else> {{ project.name }} </span>
			</h1>
			<p class="tagline">{{ project.tagline }}</p>
			<div class="subtitle">
				<div class="tag">{{ project.category }} tag</div>
				<div v-if="!!project.teamName" class="team-byline">
					Team: <links to="#team"> {{ project.teamName }}</links>
				</div>
			</div>
			<div class="mobile mb2">
				<add-to-cart-button v-if="shouldShowCartInput && hasContributeBtn()" :project="project" />
				<claim-button :project="project" />
				<p v-if="hasUserContributed && !canUserReallocate">✔️ You have contributed to this project!</p>
			</div>
			<div class="project-section">
				<h2>About the project</h2>
				<markdown :raw="project.description" />
			</div>
			<div class="project-section">
				<h2>The problem it solves</h2>
				<markdown :raw="project.problemSpace ? project.problemSpace : ''" />
			</div>
			<div class="project-section">
				<h2>Funding plans</h2>
				<markdown :raw="project.plans ? project.plans : ''" />
			</div>
			<div
				:class="{
					'address-box': project.teamName || project.teamDescription,
					'address-box-no-team': !project.teamName && !project.teamDescription,
				}"
			>
				<div>
					<div class="address-label">Recipient address</div>
					<div class="address">
						{{ addressName }}
					</div>
				</div>
				<div class="copy-div">
					<copy-button
						:value="project.address"
						text="address"
						my-class="project-profile"
						:has-border="true"
					/>
					<links
						class="explorerLink"
						:to="blockExplorer.url"
						:title="`View on ${blockExplorer.label}`"
						:hide-arrow="true"
					>
						<img class="icon" :src="logoUrl" />
					</links>
				</div>
			</div>
			<hr v-if="project.teamName || project.teamDescription" />
			<div v-if="project.teamName || project.teamDescription" id="team" class="team">
				<h2>Team: {{ project.teamName }}</h2>
				<markdown :raw="project.teamDescription ? project.teamDescription : ''" />
			</div>
		</div>
		<link-box v-if="previewMode" :project="project" class="mt2" />
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { DateTime } from 'luxon'
import type { Project } from '@/api/projects'
import { DEFAULT_CONTRIBUTION_AMOUNT, type CartItem } from '@/api/contributions'
import { RoundStatus } from '@/api/round'
import { chain } from '@/api/core'
import { ensLookup } from '@/utils/accounts'
import Info from '@/components/Info.vue'
import Markdown from '@/components/Markdown.vue'
import CopyButton from '@/components/CopyButton.vue'
import LinkBox from '@/components/LinkBox.vue'
import Links from '@/components/Links.vue'
import AddToCartButton from '@/components/AddToCartButton.vue'
import ClaimButton from '@/components/ClaimButton.vue'
import { useAppStore, useUserStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'

interface Props {
	project: Project
	klerosCurateUrl?: string | null
	previewMode: boolean
}

const props = defineProps<Props>()
const route = useRoute()
const appStore = useAppStore()
const { currentRound, cart, currentRoundAddress, isRoundContributionPhase, canUserReallocate, hasUserContributed } =
	storeToRefs(appStore)
const userStore = useUserStore()
const { currentUser } = storeToRefs(userStore)

const contributionAmount = ref<number | null>(DEFAULT_CONTRIBUTION_AMOUNT)
const ens = ref<string | null>(null)

onMounted(async () => {
	if (props.project.address) {
		ens.value = await ensLookup(props.project.address)
	}
})

const inCart = computed(() => {
	const project = props.project
	// eslint-disable-next-line
	if (project === null) {
		return false
	}
	const index = cart.value.findIndex((item: CartItem) => {
		// Ignore cleared items
		return item.id === project.id && !item.isCleared
	})
	return index !== -1
})

const blockExplorer = computed<{ label: string; url: string; logo: string }>(() => {
	return {
		label: chain.explorerLabel,
		url: `${chain.explorer}/address/${props.project.address}`,
		logo: chain.explorerLogo,
	}
})

const addressName = computed<string>(() => {
	return ens.value || props.project.address
})

const isCurrentRound = computed<boolean>(() => {
	const roundAddress = route.params.address || currentRoundAddress.value
	return appStore.isCurrentRound(roundAddress as string)
})

const shouldShowCartInput = computed<boolean>(() => {
	return isCurrentRound.value && (isRoundContributionPhase.value || canUserReallocate.value)
})
const logoUrl = new URL(`/src/assets/${blockExplorer.value.logo}`, import.meta.url).href

function hasContributeBtn(): boolean {
	// eslint-disable-next-line
	return isCurrentRound.value! && currentRound.value! && props.project !== null && props.project.index !== 0
}

function canContribute(): boolean {
	return (
		hasContributeBtn() &&
		// eslint-disable-next-line
		currentUser.value! &&
		DateTime.local() < currentRound.value!.votingDeadline &&
		currentRound.value!.status !== RoundStatus.Cancelled &&
		// eslint-disable-next-line
		props.project !== null &&
		!props.project.isLocked
	)
}

function contribute() {
	if (!contributionAmount.value) {
		return
	}
	appStore.addCartItem({
		...props.project,
		amount: contributionAmount.value.toString(),
		isCleared: false,
	})
	appStore.saveCart()
}
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.project-page {
	h2 {
		font-size: 20px;
	}

	hr {
		border: 0;
		border-bottom: 0.5px solid $button-disabled-text-color;
		margin-bottom: 3rem;
	}

	.info {
		margin-bottom: 1.5rem;
	}

	.project-image {
		border-radius: 0.25rem;
		display: block;
		height: 20rem;
		object-fit: cover;
		text-align: center;
		width: 100%;
		margin-bottom: 2rem;
	}

	.content {
		display: flex;
		gap: 3rem;
		margin-top: 4rem;
	}

	.about {
		.project-name {
			font-family: 'Glacial Indifference', sans-serif;
			font-weight: bold;
			font-size: 2.5rem;
			letter-spacing: -0.015em;
			margin: 0;

			a {
				color: var(--text-color);
			}
		}

		.tagline {
			font-size: 1.5rem;
			line-height: 150%;
			margin-top: 0.25rem;
			margin-bottom: 1rem;
			font-family: 'Glacial Indifference', sans-serif;
		}

		.subtitle {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			margin-bottom: 3rem;
			@media (max-width: $breakpoint-l) {
				flex-direction: column;
				align-items: flex-start;
				gap: 1rem;
				margin-bottom: 2rem;
			}

			.team-byline {
				line-height: 150%;
			}
		}

		.project-section {
			margin-bottom: 3rem;
			color: var(--text-body);
		}

		.address-box {
			padding: 1rem;
			margin-bottom: 3rem;
			border-radius: 0.5rem;
			box-shadow: var(--box-shadow);
			background: var(--bg-address-box);
			display: flex;
			align-items: center;
			justify-content: space-between;

			@media (max-width: $breakpoint-m) {
				flex-direction: column;
				gap: 0.5rem;
				align-items: flex-start;
			}

			.address-label {
				font-size: 14px;
				margin: 0;
				font-weight: 400;
				margin-bottom: 0.25rem;
				text-transform: uppercase;
			}

			.address {
				display: flex;
				font-family: 'Glacial Indifference', sans-serif;
				font-weight: 600;
				border-radius: 8px;
				align-items: center;
				gap: 0.5rem;
				word-break: break-all;
			}
		}

		.address-box-no-team {
			padding: 1rem;
			border-radius: 0.5rem;
			box-shadow: var(--box-shadow);
			background: var(--bg-address-box);
			display: flex;
			align-items: center;
			justify-content: space-between;

			@media (max-width: $breakpoint-l) {
				flex-direction: column;
				gap: 0.5rem;
				align-items: flex-start;
			}
		}

		.team {
			padding: 1rem;
			margin-bottom: 3rem;
			border-radius: 0.25rem;
			background: var(--bg-secondary-color);
			@media (max-width: $breakpoint-l) {
				margin-bottom: 0;
			}

			h2 {
				font-size: 24px;
				font-weight: 400;
				font-family: 'Glacial Indifference', sans-serif;
				margin-top: 0;
			}
		}
	}

	.sticky-column {
		position: sticky;
		top: 2rem;
		align-self: start;
		gap: 1rem;
		display: flex;
		flex-direction: column;

		.button {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			width: 100%;
			justify-content: center;
		}
	}

	.copy-div {
		display: flex;
		gap: 0.5rem;

		.explorerLink {
			margin: 0;
			padding: 0;
			.icon {
				@include icon(none, var(--explorer-hover));
				border: 1px solid var(--explorer-border);
				filter: var(--img-filter, invert(0.7));
			}
		}
	}
}
</style>

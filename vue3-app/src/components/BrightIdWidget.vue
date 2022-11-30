<template>
	<div
		:class="{
			'bright-id-widget-container': true,
			'bright-id-profile-widget': !isProjectCard,
		}"
	>
		<div class="row">
			<div v-if="isVerified">
				<icon-status :happy="true" logo="brightid.svg" secondary-logo="checkmark.svg" />
			</div>
			<div v-else>
				<icon-status :sad="true" logo="brightid.svg" secondary-logo="close-black.svg" />
			</div>
			<h2>BrightID setup</h2>
			<p>{{ getCurrentStep }} / 2</p>
		</div>
		<div class="progress">
			<div
				:class="{
					half: isVerified,
					full: isRegistered,
				}"
			/>
		</div>
		<div v-if="!isProjectCard" class="setup-container">
			<div class="row">
				<div v-if="isVerified">
					<div v-if="isRegistered">
						<a href="/#/projects" @click="$emit('close')">
							Start contributing
							<span role="img" aria-label="party emoji">🎉</span>
						</a>
					</div>
					<div v-else>
						<a href="/#/verify/" @click="$emit('close')">Continue setup</a>
					</div>
				</div>
				<a v-else href="/#/verify/" @click="$emit('close')">Start setup</a>
				<p
					v-tooltip="{
						content: isVerified
							? 'You\'re a verified human on BrightID!'
							: 'Your BrightID profile still needs to be verified.',
						triggers: ['hover', 'click'],
					}"
					:class="isVerified ? 'brightid-verified' : 'unverified'"
				>
					{{ isVerified ? 'Verified' : 'Unverified' }}
				</p>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import IconStatus from '@/components/IconStatus.vue'
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'

interface Props {
	abbrev?: string
	balance?: string
	isProjectCard: boolean
}

const props = defineProps<Props>()

const appStore = useAppStore()
const { currentUser } = storeToRefs(appStore)

const isVerified = computed(() => {
	return currentUser.value && currentUser.value?.brightId!.isVerified
})

const isRegistered = computed(() => {
	return currentUser.value && currentUser.value.isRegistered
})

const getCurrentStep = computed(() => {
	if (!isVerified.value) {
		return 0
	}

	if (!isRegistered.value) {
		return 1
	}

	return 2
})
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.setup-container {
	background: var(--bg-secondary-color);
	border-radius: 0.5rem;
	padding: 0.5rem 0;
	width: auto;
	height: auto;

	h2 {
		font-size: 20px;
		font-family: 'Glacial Indifference', sans-serif;
		margin: 0;
	}
}

.row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;

	p {
		margin: 0;
		font-weight: 600;
	}
	a {
		margin: 0;
		line-height: 0;
	}
	.unverified {
		color: var(--warning-color);
	}
	.brightid-verified {
		color: $clr-green;
	}

	.step0:before {
		content: '0';
	}
	.step1:before {
		content: '1';
	}
	.step2:before {
		content: '2';
	}
	.step3:before {
		content: '3';
	}
	.step4:before {
		content: '4';
	}
	.span {
		margin: 0;
		line-height: 0;
	}
}

.bright-id-widget-container {
	background: var(--bg-secondary-color);
	border-radius: 0.5rem;

	width: auto;
	height: auto;

	h2 {
		font-size: 20px;
		font-family: 'Glacial Indifference', sans-serif;
		margin: 0;
	}
}

.bright-id-profile-widget {
	padding: 1rem;
}

.row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;

	p {
		margin: 0;
		font-weight: 600;
	}
	a {
		margin: 0;
		line-height: 0;
	}
	.unverified {
		color: var(--warning-color);
	}
	.brightid-verified {
		color: $clr-green;
	}

	.step0:before {
		content: '0';
	}
	.step1:before {
		content: '1';
	}
	.step2:before {
		content: '2';
	}
	.step3:before {
		content: '3';
	}
	.step4:before {
		content: '4';
	}
	.span {
		margin: 0;
		line-height: 0;
	}
}

.progress {
	width: 100%;
	border-radius: 2rem;
	height: 0.5rem;
	background: $gradient-inactive;
	margin: 1rem 0rem;

	.quarter {
		width: 25%;
		background: $gradient-highlight;
		height: 0.5rem;
		border-radius: 2rem;
	}
	.half {
		width: 50%;
		background: $gradient-highlight;
		height: 0.5rem;
		border-radius: 2rem;
	}
	.three-quarters {
		width: 75%;
		background: $gradient-highlight;
		height: 0.5rem;
		border-radius: 2rem;
	}
	.full {
		width: 100%;
		background: $gradient-highlight;
		height: 0.5rem;
		border-radius: 2rem;
	}
}
</style>

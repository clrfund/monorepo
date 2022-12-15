<template>
	<!-- Reallocate CTA -->
	<div v-if="canUserReallocate" class="get-prepared">
		<span aria-label="thinking face" class="emoji">🤔</span>
		<div>
			<h2 class="prep-title">Changed your mind?</h2>
			<p class="prep-text">You still have time to reallocate your contributions.</p>
			<div class="btn-action" @click="toggleCartPanel()">Open cart</div>
		</div>
	</div>
	<!-- Round is over notification -->
	<div v-else-if="hasContributionPhaseEnded" class="get-prepared">
		<span aria-label="hand" class="emoji">🤚</span>
		<div>
			<h2 class="prep-title">Round over for contributions</h2>
			<p class="prep-text">You can no longer make any contributions this round.</p>
		</div>
	</div>
	<!-- Get prepared CTA -->
	<div v-else-if="showUserVerification" class="get-prepared">
		<bright-id-widget v-if="hasStartedVerification" :is-project-card="true" />
		<span v-else aria-label="rocket" class="emoji">🚀</span>
		<div>
			<h2 class="prep-title">Get prepared</h2>
			<p class="prep-text">
				You’ll need to set up a few things before you contribute. You can do this any time before or during the
				funding round.
			</p>
		</div>
		<links v-if="!hasStartedVerification" to="/verify" class="btn-action">Start prep</links>
		<links v-else to="/verify/connect" class="btn-action">Continue setup</links>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import BrightIdWidget from '@/components/BrightIdWidget.vue'
import Links from '@/components/Links.vue'

import { userRegistryType, UserRegistryType } from '@/api/core'
import { useAppStore, useUserStore } from '@/stores'
import { storeToRefs } from 'pinia'

const appStore = useAppStore()
const { canUserReallocate, hasContributionPhaseEnded } = storeToRefs(appStore)
const userStore = useUserStore()
const { currentUser } = storeToRefs(userStore)

const hasStartedVerification = computed(
	() => currentUser.value && currentUser.value.brightId && currentUser.value.brightId.isVerified,
)
const showUserVerification = computed(() => {
	return (
		userRegistryType === UserRegistryType.BRIGHT_ID &&
		typeof currentUser.value?.isRegistered === 'boolean' &&
		!currentUser.value.isRegistered
	)
})

const toggleCartPanel = () => {
	appStore.toggleShowCartPanel(true)
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.get-prepared {
	background: var(--bg-secondary-color);
	border: 1px solid var(--border-strong);
	border-radius: 8px;
	display: flex;
	flex-direction: column;
	padding: 1.5rem;
	justify-content: space-between;
}

.prep-title {
	font-family: 'Glacial Indifference', sans-serif;
	font-size: 2rem;
	font-weight: 700;
}

.prep-title-continue {
	font-family: 'Glacial Indifference', sans-serif;
	font-size: 1.5rem;
	font-weight: 700;
}

.prep-text {
	font-family: Inter;
	font-size: 16px;
	line-height: 150%;
}

.emoji {
	font-size: 32px;
}
</style>

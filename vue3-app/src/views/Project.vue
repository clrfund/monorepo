<template>
	<div v-if="project" :class="`grid ${isCartToggledOpen ? 'cart-open' : 'cart-closed'}`">
		<img class="project-image banner" :src="project.bannerImageUrl" :alt="project.name" />
		<project-profile class="details" :project="project" :preview-mode="false" />
		<div class="sticky-column">
			<div class="desktop">
				<add-to-cart-button v-if="shouldShowCartInput && hasContributeBtn" :project="project" />
				<claim-button :project="project" />
				<p v-if="hasUserContributed && !canUserReallocate">✔️ You have contributed to this project!</p>
			</div>
			<link-box :project="project" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { FixedNumber } from 'ethers'

import { type Project, getRecipientRegistryAddress, getProject } from '@/api/projects'
import { getCurrentRound } from '@/api/round'
import Loader from '@/components/Loader.vue'
import ProjectProfile from '@/components/ProjectProfile.vue'
import AddToCartButton from '@/components/AddToCartButton.vue'
import LinkBox from '@/components/LinkBox.vue'
import ClaimButton from '@/components/ClaimButton.vue'
import { markdown } from '@/utils/markdown'

import { useMeta } from 'vue-meta'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'

useMeta({ title: (this as any).project?.name || '' })

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const { showCartPanel, isRoundContributionPhase, canUserReallocate, hasUserContributed } = storeToRefs(appStore)

const project = ref<Project | null>(null)
const allocatedAmount = ref<FixedNumber | null>(null)
const claimed = ref<boolean | null>(null)
const isLoading = ref(true)
const isCartToggledOpen = computed(() => showCartPanel)
const isCurrentRound = computed(() => {
	const roundAddress = (route.params.address as string) || appStore.currentRoundAddress
	return appStore.isCurrentRound(roundAddress!)
})

const shouldShowCartInput = computed(
	() => (isCurrentRound.value && isRoundContributionPhase.value) || canUserReallocate,
)
const hasContributeBtn = computed(() => isCurrentRound.value && project.value !== null && project.value.index !== 0)
const descriptionHtml = computed(() => markdown.render(project.value?.description || ''))

onMounted(async () => {
	if (!!route.params.address && !route.params.id) {
		// missing project id, redirect back to rounds
		router.push({ name: 'rounds', params: route.params })
		return
	}

	//TODO: update to take factory address as a parameter, default to env. variable
	const currentRoundAddress = appStore.currentRoundAddress || (await getCurrentRound())

	const roundAddress = (route.params.address as string) || appStore.currentRoundAddress

	const registryAddress = await getRecipientRegistryAddress(roundAddress)
	const _project = await getProject(registryAddress, route.params.id as string)
	if (_project === null || _project.isHidden) {
		// Project not found
		router.push({ name: 'projects' })
		return
	} else {
		project.value = _project
	}
	isLoading.value = false
})
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

@mixin project-grid() {
	display: grid;
	grid-template-columns: 1fr clamp(320px, 24%, 440px);
	grid-template-rows: repeat(2, auto);
	grid-template-areas: 'banner banner' 'details actions';
	grid-column-gap: 2rem;
	grid-row-gap: 3rem;
}

@mixin project-grid-mobile() {
	grid-template-columns: 1fr;
	grid-template-rows: repeat(3, auto);
	grid-template-areas: 'banner' 'details' 'actions';
	padding-bottom: 6rem;
}

.grid.cart-open {
	@include project-grid();
	@media (max-width: $breakpoint-xl) {
		@include project-grid-mobile();
	}
}

.grid.cart-closed {
	@include project-grid();
	@media (max-width: $breakpoint-m) {
		@include project-grid-mobile();
	}
}

.banner {
	grid-area: banner;
}

.sticky-column {
	grid-area: actions;
	position: sticky;
	top: 6rem;
	display: flex;
	flex-direction: column;
	align-self: start;
	gap: 1rem;
	@media (max-width: $breakpoint-l) {
		margin-bottom: 3rem;
	}
}

.project-image {
	border-radius: 4px;
	display: block;
	height: 320px;
	object-fit: cover;
	text-align: center;
	width: 100%;
}

.content {
	display: flex;
	gap: 3rem;
	margin-top: 4rem;
}
</style>

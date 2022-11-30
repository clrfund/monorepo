<template>
	<div>
		<div class="btn-row">
			<button
				v-if="currentStep > 0"
				class="btn-secondary float-left"
				:disabled="isNavDisabled"
				@click="handleStepNav(currentStep - 1)"
			>
				Previous
			</button>
			<wallet-widget
				v-if="!currentUser && currentStep === finalStep"
				class="float-right"
				:is-action-button="true"
			/>
			<button
				v-else
				class="btn-primary float-right"
				:disabled="!isStepValid"
				@click="handleStepNav(currentStep + 1, true)"
			>
				{{ currentStep === finalStep ? 'Confirm' : 'Next' }}
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { User } from '@/api/user'
import WalletWidget from '@/components/WalletWidget.vue'
import { useAppStore } from '@/stores/app'

interface Props {
	currentStep: number
	finalStep: number
	steps: string[]
	isStepValid: boolean
	callback: (updateFurthest?: boolean) => void
	handleStepNav: (step: number, updateFurthest?: boolean) => void
	isNavDisabled: boolean
}

const appStore = useAppStore()
const currentUser = computed<User | null>(() => appStore.currentUser)

defineProps<Props>()
</script>

<style scoped lang="scss">
@import '../styles/theme';
@import '../styles/vars';

.btn-row {
	display: block;
	height: 2.75rem;
}

.float-left {
	float: left;
}

.float-right {
	float: right;
}
</style>

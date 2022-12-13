<template>
	<div>
		<div class="btn-row">
			<button v-if="currentStep > 0" class="btn-secondary" :disabled="isNavDisabled" @click="onClickPrevious">
				Previous
			</button>
			<wallet-widget v-if="!currentUser && currentStep === finalStep" class="" :is-action-button="true" />
			<button v-else class="btn-primary" :disabled="!isStepValid" @click="onClickNextOrConfirm">
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
const props = defineProps<Props>()

const appStore = useAppStore()
const currentUser = computed<User | null>(() => appStore.currentUser)

function onClickPrevious() {
	props.handleStepNav(props.currentStep - 1)
}

function onClickNextOrConfirm() {
	props.handleStepNav(props.currentStep + 1, true)
}
</script>

<style scoped lang="scss">
@import '../styles/theme';
@import '../styles/vars';

.btn-row {
	display: flex;
	justify-content: space-between;
	height: 2.75rem;
}
</style>

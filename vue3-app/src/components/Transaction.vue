<template>
	<div class="transaction">
		<template v-if="error">
			<div class="error">{{ error }}</div>
			<div class="btn-row">
				<button v-if="displayCloseBtn" class="btn-secondary close-btn" @click="$emit('close')">Close</button>
				<button v-if="displayRetryBtn" class="btn-primary close-btn" @click="$emit('retry')">Retry</button>
			</div>
		</template>
		<template v-else>
			<div v-if="!hash">Please approve transaction in your wallet</div>
			<div v-else>
				<transaction-receipt :hash="hash" />
			</div>
			<loader v-if="!hash" />
			<div v-if="displayWarning && !hash">
				<small class="warning-text">
					If you have been waiting a while, consider refreshing your browser and reconnecting your wallet.
				</small>
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
import { watch, ref, withDefaults, defineProps } from 'vue'

import Loader from '@/components/Loader.vue'
import Links from '@/components/Links.vue'
import TransactionReceipt from '@/components/TransactionReceipt.vue'

interface Props {
	hash: string
	error: string
	displayCloseBtn?: boolean
	displayRetryBtn?: boolean
}

const props = withDefaults(defineProps<Props>(), {
	displayCloseBtn: true,
	displayRetryBtn: false,
})

const displayWarning = ref(false)

let waitingWarningTimeout: any
watch(
	() => props.hash,
	() => {
		// Every time the hash changes, restart the timer to display the warning
		// message to the user
		clearTimeout(waitingWarningTimeout)
		displayWarning.value = false

		waitingWarningTimeout = setTimeout(() => {
			displayWarning.value = true
		}, 30000)
	},
	{
		immediate: true,
	},
)
</script>

<style scoped lang="scss">
@import '../styles/vars';

.error {
	color: var(--error-color);
	overflow: hidden;
	text-overflow: ellipsis;
}

.close-btn {
	margin-top: 20px;
}

.btn-row {
	display: flex;
	margin: 1rem 0;
	margin-top: 1.5rem;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
}
</style>

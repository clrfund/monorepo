<template>
	<vue-final-modal>
		<div class="modal-body">
			<transaction
				:hash="txHash"
				:error="txError"
				:display-retry-btn="true"
				@close="$emit('close')"
				@retry="
					() => {
						txError = ''
						executeTx()
					}
				"
			></transaction>
			<button v-if="txHash" class="btn-secondary close-btn" @click="$emit('close')">Close</button>
		</div>
	</vue-final-modal>
</template>

<script lang="ts">
export default {
	inheritAttrs: false,
}
</script>

<script setup lang="ts">
import type { TransactionResponse } from '@ethersproject/abstract-provider'
// @ts-ignore
import { VueFinalModal } from 'vue-final-modal'
import Transaction from '@/components/Transaction.vue'
import { waitForTransaction } from '@/utils/contracts'

interface Props {
	transaction: Promise<TransactionResponse>
	onTxSuccess: (txHash: string) => void
}

const props = defineProps<Props>()

const txHash = ref('')
const txError = ref('')

onMounted(() => {
	executeTx()
})

async function executeTx() {
	try {
		await waitForTransaction(props.transaction, hash => (txHash.value = hash))

		props.onTxSuccess(txHash.value)
	} catch (error: any) {
		txError.value = error.message
		return
	}
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.modal-body {
	text-align: left;
	background: var(--bg-secondary-color);
	border-radius: 1rem;
	box-shadow: var(--box-shadow);
	padding: 1.5rem;
}

.close-btn {
	margin-top: $modal-space;
}
</style>

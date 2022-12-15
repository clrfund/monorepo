<template>
	<div class="modal-body">
		<div v-if="step === 1">
			<h3>Reallocate funds</h3>
			<transaction
				:hash="voteTxHash"
				:error="voteTxError"
				:display-retry-btn="true"
				@close="$emit('close')"
				@retry="
					() => {
						voteTxError = ''
						vote()
					}
				"
			></transaction>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { BigNumber, Contract } from 'ethers'
import type { PubKey, Message } from 'maci-domainobjs'
import Transaction from '@/components/Transaction.vue'
import { waitForTransaction } from '@/utils/contracts'
import { createMessage } from '@/utils/maci'

import { FundingRound } from '@/api/abi'
import { useEthers } from 'vue-dapp'
import { useAppStore } from '@/stores'
import { useRouter } from 'vue-router'

interface Props {
	votes: [number, BigNumber][]
}

const props = defineProps<Props>()
const emit = defineEmits(['close'])

const router = useRouter()
const { signer } = useEthers()
const appStore = useAppStore()

const step = ref(1)
const voteTxHash = ref('')
const voteTxError = ref('')

onMounted(() => {
	vote()
})

async function vote() {
	const contributor = appStore.contributor
	const { coordinatorPubKey, fundingRoundAddress } = appStore.currentRound!
	const fundingRound = new Contract(fundingRoundAddress, FundingRound, signer.value!)
	const messages: Message[] = []
	const encPubKeys: PubKey[] = []
	let nonce = 1
	for (const [recipientIndex, voiceCredits] of props.votes) {
		const [message, encPubKey] = createMessage(
			contributor!.stateIndex,
			contributor!.keypair,
			null,
			coordinatorPubKey,
			recipientIndex,
			voiceCredits,
			nonce,
		)
		messages.push(message)
		encPubKeys.push(encPubKey)
		nonce += 1
	}
	try {
		await waitForTransaction(
			fundingRound.submitMessageBatch(
				messages.reverse().map(msg => msg.asContractParam()),
				encPubKeys.reverse().map(key => key.asContractParam()),
			),
			hash => (voteTxHash.value = hash),
		)
		appStore.saveCommittedCartDispatch()
		emit('close')
		router.push({
			name: `transaction-success`,
			params: {
				type: 'reallocation',
				hash: voteTxHash.value,
			},
		})
	} catch (error) {
		voteTxError.value = error.message
		return
	}
	step.value += 1
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.close-btn {
	margin-top: $modal-space;
}
</style>

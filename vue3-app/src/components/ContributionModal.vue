<template>
	<div class="modal-body">
		<div v-if="step === 0">
			<h2>Confirm {{ renderTotal }} {{ currentRound?.nativeTokenSymbol }} contribution</h2>
			<p>
				Your
				<b>{{ renderTotal }} {{ currentRound?.nativeTokenSymbol }}</b>
				contribution total is final. You won't be able to increase this amount. Make sure this is the maximum
				you might want to spend on contributions.
			</p>
			<!-- TODO: if you get 1/3 of the way through these transactions and come back, you shouldn't get this warning again. This warning should only appear if you haven't already signed 'approve' transaction -->
			<!-- <p>
        <em>After contributing, you'll be able to add/remove projects and change amounts as long as your cart adds up to <b>{{ renderTotal }} {{ currentRound.nativeTokenSymbol }}</b>.</em>
      </p> -->
			<div class="btn-row">
				<button class="btn-secondary" @click="$emit('close')">Cancel</button>
				<button class="btn-primary" @click="contribute()">Continue</button>
			</div>
		</div>
		<div v-if="step === 1">
			<progress-bar :current-step="1" :total-steps="3" />
			<h2>
				Approve {{ renderTotal }}
				{{ currentRound?.nativeTokenSymbol }}
			</h2>
			<p>
				This gives this app permission to withdraw
				{{ renderTotal }} {{ currentRound?.nativeTokenSymbol }} from your wallet for your contribution.
			</p>
			<transaction
				:hash="approvalTxHash"
				:error="approvalTxError || error"
				:display-retry-btn="true"
				@close="$emit('close')"
				@retry="
					() => {
						step = 0
						approvalTxError = ''
						contribute()
					}
				"
			></transaction>
		</div>
		<div v-if="step === 2">
			<progress-bar :current-step="2" :total-steps="3" />
			<h2>Send {{ renderTotal }} {{ currentRound?.nativeTokenSymbol }} contribution</h2>
			<p>
				This transaction sends out your {{ renderTotal }} {{ currentRound?.nativeTokenSymbol }} contribution to
				your chosen projects.
			</p>
			<transaction
				:hash="contributionTxHash"
				:error="contributionTxError || error"
				:display-retry-btn="true"
				@close="$emit('close')"
				@retry="
					() => {
						step = 0
						contributionTxError = ''
						contribute()
					}
				"
			></transaction>
		</div>
		<div v-if="step === 3">
			<progress-bar :current-step="3" :total-steps="3" />
			<h2>Matching pool magic ✨</h2>
			<p>
				This transaction lets the matching pool know how much
				{{ currentRound?.nativeTokenSymbol }} to send to your favorite projects based on your contributions.
			</p>
			<transaction
				:hash="voteTxHash"
				:error="voteTxError || error"
				:display-retry-btn="true"
				@close="$emit('close')"
				@retry="
					() => {
						voteTxError = ''
						sendVotes()
					}
				"
			></transaction>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { BigNumber, Contract } from 'ethers'
import { DateTime } from 'luxon'
import { Keypair, PubKey, Message } from 'maci-domainobjs'

import Transaction from '@/components/Transaction.vue'
import { formatAmount } from '@/utils/amounts'
import { waitForTransaction, getEventArg } from '@/utils/contracts'
import { createMessage } from '@/utils/maci'
import ProgressBar from '@/components/ProgressBar.vue'

import { FundingRound, ERC20, MACI } from '@/api/abi'
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'
import { useEthers } from 'vue-dapp'
import { useRouter } from 'vue-router'

const router = useRouter()
const { signer } = useEthers()
const appStore = useAppStore()
const { hasUserContributed, hasUserVoted, currentRound } = storeToRefs(appStore)

const emit = defineEmits(['close'])

interface Props {
	votes: [number, BigNumber][]
}

const props = defineProps<Props>()

const step = ref(0)
const approvalTxHash = ref('')
const approvalTxError = ref('')
const contributionTxHash = ref('')
const contributionTxError = ref('')
const voteTxHash = ref('')
const voteTxError = ref('')
const error = ref('')

onMounted(() => {
	if (hasUserContributed && !hasUserVoted) {
		// If the user has already contributed but without sending the votes
		// (final step 3), move automatically to that step
		step.value = 3
		sendVotes()
	}
})

async function sendVotes() {
	const { coordinatorPubKey } = currentRound.value!

	const contributor = appStore.contributor
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
			fundingRound.value.submitMessageBatch(
				messages.reverse().map(msg => msg.asContractParam()),
				encPubKeys.reverse().map(key => key.asContractParam()),
			),
			hash => (voteTxHash.value = hash),
		)
		appStore.setHasVote(true)
		appStore.saveCommittedCartDispatch()
		emit('close')
		router.push({
			name: `transaction-success`,
			params: {
				type: 'contribution',
				hash: contributionTxHash.value,
			},
		})
	} catch (error) {
		voteTxError.value = error.message
		return
	}
	step.value += 1
}

const fundingRound = computed(() => {
	const { fundingRoundAddress } = currentRound.value!
	return new Contract(fundingRoundAddress, FundingRound, signer.value!)
})

const total = computed(() => {
	const { voiceCreditFactor } = currentRound.value!
	return props.votes.reduce((total: BigNumber, [, voiceCredits]) => {
		return total.add(voiceCredits.mul(voiceCreditFactor))
	}, BigNumber.from(0))
})

const renderTotal = computed(() => {
	const { nativeTokenDecimals } = currentRound.value!
	return formatAmount(total.value, nativeTokenDecimals)
})

function formatDate(value: DateTime): string {
	return value.toLocaleString(DateTime.DATETIME_SHORT) || ''
}

async function contribute() {
	try {
		step.value += 1
		const { nativeTokenAddress, voiceCreditFactor, maciAddress, fundingRoundAddress } = currentRound.value!
		const token = new Contract(nativeTokenAddress, ERC20, signer.value!)
		// Approve transfer (step 1)
		const allowance = await token.allowance(signer.value!.getAddress(), fundingRoundAddress)
		if (allowance < total.value) {
			try {
				await waitForTransaction(
					token.approve(fundingRoundAddress, total.value),
					hash => (approvalTxHash.value = hash),
				)
			} catch (error) {
				approvalTxError.value = error.message
				return
			}
		}
		step.value += 1
		// Contribute (step 2)
		const contributorKeypair = new Keypair()
		let contributionTxReceipt
		try {
			contributionTxReceipt = await waitForTransaction(
				fundingRound.value.contribute(contributorKeypair.pubKey.asContractParam(), total.value),
				hash => (contributionTxHash.value = hash),
			)
		} catch (error) {
			contributionTxError.value = error.message
			return
		}
		// Get state index and amount of voice credits
		const maci = new Contract(maciAddress, MACI, signer.value!)
		const stateIndex = getEventArg(contributionTxReceipt, maci, 'SignUp', '_stateIndex')
		const voiceCredits = getEventArg(contributionTxReceipt, maci, 'SignUp', '_voiceCreditBalance')
		if (!voiceCredits.mul(voiceCreditFactor).eq(total.value)) {
			throw new Error('Incorrect amount of voice credits')
		}
		const contributor = {
			keypair: contributorKeypair,
			stateIndex: stateIndex.toNumber(),
		}
		// Save contributor data to storage
		appStore.setContributor(contributor)
		appStore.saveContributorData()
		// Set contribution and update round info
		appStore.setContribution(total.value)
		// Reload contribution pool size
		appStore.loadRoundInfo()
		step.value += 1
		// Vote (step 3)
		await sendVotes()
	} catch (err) {
		/* eslint-disable-next-line no-console */
		console.log(err)
		error.value = 'Something unexpected ocurred. Refresh the page and try again.'
	}
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.btn-row {
	display: flex;
	margin: 1rem 0;
	margin-top: 1.5rem;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;

	.btn {
		margin: 0 $modal-space;
	}
}

.modal-body {
	text-align: left;
	background: var(--bg-secondary-color);
	border-radius: 1rem;
	box-shadow: var(--box-shadow);
	padding: 1.5rem;
}
</style>

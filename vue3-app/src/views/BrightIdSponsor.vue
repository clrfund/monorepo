<template>
	<div>
		<h2 class="step-title">Get sponsored</h2>
		<p>
			You need a sponsorship token to become BrightID verified. This helps support BrightID as a decentralized
			platform. You’ll only ever need to do this once and it covers you for any other app that works with
			BrightID. Check the BrightID mobile app to see if you're sponsored. If you're not, click the button below to
			submit a sponsorship request.
		</p>
		<div class="transaction">
			<div>
				<div>
					<wallet-widget
						v-if="!currentUser"
						class="button"
						:is-action-button="true"
						:full-width-mobile="true"
					/>
					<button
						v-else
						type="button"
						class="btn-action button"
						:disabled="sponsorTxHash.length !== 0"
						@click="sponsor"
					>
						Get sponsored
					</button>
				</div>
				<transaction
					v-if="sponsorTxHash || loadingTx || sponsorTxError"
					:display-close-btn="false"
					:hash="sponsorTxHash"
					:error="sponsorTxError"
				/>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { selfSponsor } from '@/api/bright-id'
import { waitForTransaction } from '@/utils/contracts'
import WalletWidget from '@/components/WalletWidget.vue'
import Transaction from '@/components/Transaction.vue'
import { useAppStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

const appStore = useAppStore()
const { currentUser, userRegistryAddress } = storeToRefs(appStore)
const router = useRouter()

const loadingTx = ref(false)
const sponsorTxError = ref('')
const sponsorTxHash = ref('')

async function sponsor() {
	if (!currentUser.value) return

	const signer = currentUser.value.walletProvider.getSigner()

	loadingTx.value = true
	sponsorTxError.value = ''
	try {
		await waitForTransaction(selfSponsor(userRegistryAddress.value!, signer), hash => (sponsorTxHash.value = hash))
		loadingTx.value = false
		router.push({
			name: 'sponsored',
			params: { hash: sponsorTxHash.value },
		})
	} catch (error) {
		sponsorTxError.value = (error as Error).message
		return
	}
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.transaction {
	padding: 2rem;
	border-radius: 1rem;
	width: auto;

	.button {
		max-width: 250px;
		margin: auto;
	}
}
</style>

<template>
	<div class="container">
		<div class="grid">
			<div class="progress-area desktop">
				<div class="progress-container">
					<progress-bar :current-step="currentStep + 1" :total-steps="steps.length" />
					<p class="subtitle">Step {{ currentStep + 1 }} of {{ steps.length }}</p>
					<div class="progress-steps">
						<div v-for="(step, stepIndex) in steps" :key="step.page" class="progress-step">
							<template v-if="stepIndex === currentStep">
								<loader v-if="stepIndex === 0 && !brightId?.isVerified" class="progress-steps-loader" />
								<img v-else class="current-step" src="@/assets/current-step.svg" alt="current step" />
								<p class="active step" v-text="step.name" />
							</template>
							<template v-else-if="isStepUnlocked(stepIndex) && isStepValid(stepIndex)">
								<loader v-if="stepIndex === 0 && !brightId?.isVerified" class="progress-steps-loader" />
								<img v-else src="@/assets/green-tick.svg" alt="step complete" />
								<p class="step" v-text="step.name" />
							</template>
							<template v-else>
								<img class="remaining-step" src="@/assets/step-remaining.svg" alt="step remaining" />
								<p class="step" v-text="step.name" />
							</template>
						</div>
					</div>
				</div>
			</div>
			<div class="progress-area mobile">
				<progress-bar :current-step="currentStep + 1" :total-steps="steps.length" />
				<div class="row">
					<p>Step {{ currentStep + 1 }} of {{ steps.length }}</p>
					<links class="cancel-link" to="/verify"> Cancel </links>
				</div>
			</div>
			<div class="title-area">
				<h1>Set up BrightID</h1>
			</div>
			<div class="cancel-area desktop">
				<links class="cancel-link" to="/verify"> Cancel </links>
			</div>
			<div class="form-area">
				<div class="application">
					<div v-if="currentStep === 0">
						<h2 class="step-title">Connect</h2>
						<p>You need to connect your BrightID account with your wallet address.</p>
						<p>
							Once this app is linked in your BrightID app, we'll automatically transition you to the next
							step. It may take a minute for us to verify the connection - please wait.
						</p>
						<div class="qr">
							<div v-if="appLink" class="instructions">
								<p v-if="appLinkQrCode" class="desktop">Scan this QR code with your BrightID app</p>
								<img :src="appLinkQrCode" class="desktop qr-code" />
								<p class="mobile">Follow this link to connect your wallet to your BrightID app</p>
								<links class="mobile" :to="appLink">
									<div class="icon">
										<img src="@/assets/bright-id.png" />
									</div>
									{{ appLink }}
								</links>
								<p class="mobile">
									<em>
										This link might look scary but it just makes a connection between your connected
										wallet address, our app, and BrightID. If clicking the link does not open the
										BrightId app, try manually copying the link to a browser.
									</em>
								</p>
							</div>

							<loader />
						</div>
					</div>
					<div v-if="currentStep === 1">
						<h2 class="step-title">Register</h2>
						<p>
							To protect the round from bribery and fraud, you need to add your wallet address to a smart
							contract registry. Once you’re done, you can join the funding round!
						</p>
						<div class="transaction">
							<button
								type="button"
								class="btn-action btn-block"
								:disabled="registrationTxHash.length !== 0"
								@click="register"
							>
								Become a contributor
							</button>
							<transaction
								v-if="registrationTxHash || loadingTx || registrationTxError"
								:display-close-btn="false"
								:hash="registrationTxHash"
								:error="registrationTxError"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import ProgressBar from '@/components/ProgressBar.vue'
import QRCode from 'qrcode'
import { getBrightIdLink, getBrightIdUniversalLink, registerUser } from '@/api/bright-id'
import Transaction from '@/components/Transaction.vue'
import Loader from '@/components/Loader.vue'
import Links from '@/components/Links.vue'
import { waitForTransaction } from '@/utils/contracts'
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

interface BrightIDStep {
	page: 'connect' | 'registration'
	name: string
}
const router = useRouter()
const appStore = useAppStore()

// state
const { currentUser, hasContributionPhaseEnded, userRegistryAddress } = storeToRefs(appStore)

const steps = ref<Array<BrightIDStep>>([
	{ page: 'connect', name: 'Connect' },
	{ page: 'registration', name: 'Get registered' },
])
const appLink = ref('')
const appLinkQrCode = ref('')
const registrationTxHash = ref('')
const registrationTxError = ref('')
const loadingTx = ref(false)

const brightId = computed(() => currentUser.value?.brightId)

const currentStep = computed(() => {
	if (!brightId.value || !brightId.value.isVerified) {
		return 0
	}

	if (!currentUser.value?.isRegistered) {
		return 1
	}

	// This means the user is registered
	return -1
})

onMounted(async () => {
	// created
	if (!currentUser.value?.walletAddress || hasContributionPhaseEnded.value) {
		router.replace({ name: 'verify' })
	}

	// make sure BrightId status is availabel before page load
	await appStore.loadBrightID()

	// redirect to the verify success page if the user is registered
	if (currentStep.value < 0) {
		router.replace({ name: 'verified' })
	}

	// mounted
	if (currentUser.value && !brightId.value?.isVerified) {
		// Present app link and QR code
		appLink.value = getBrightIdUniversalLink(currentUser.value.walletAddress)
		const qrcodeLink = getBrightIdLink(currentUser.value.walletAddress)
		QRCode.toDataURL(qrcodeLink, (error: unknown, url: string) => {
			if (!error) {
				appLinkQrCode.value = url
			}
		})
		waitUntil(() => brightId.value?.isVerified || false)
	}
})

watch(currentUser, () => {
	if (!currentUser.value?.walletAddress) {
		router.replace({ name: 'verify' })
	}
})

async function register() {
	const signer = currentUser.value?.walletProvider.getSigner()

	if (brightId.value?.verification) {
		loadingTx.value = true
		registrationTxError.value = ''
		try {
			await waitForTransaction(
				registerUser(userRegistryAddress.value!, brightId.value.verification, signer!),
				hash => (registrationTxHash.value = hash),
			)
			loadingTx.value = false
			router.push({
				name: 'verified',
				params: { hash: registrationTxHash.value },
			})
		} catch (error: any) {
			registrationTxError.value = error.message
			return
		}
		appStore.loadUserInfo()
	}
}

/**
 * Start polling brightId state until the condition is met
 */
async function waitUntil(isConditionMetFn: () => boolean, intervalTime = 5000) {
	let isConditionMet = false

	const checkVerification = async () => {
		await appStore.loadBrightID()
		isConditionMet = isConditionMetFn()

		if (!isConditionMet) {
			setTimeout(async () => {
				await checkVerification()
			}, intervalTime)
		}
	}
	await checkVerification()
}

function isStepValid(step: number): boolean {
	return !!steps.value[step]
}

function isStepUnlocked(step: number): boolean {
	if (!brightId.value) {
		return false
	}

	switch (step) {
		case 0:
			// Connect
			return true
		case 1:
			// Register
			return currentUser.value?.isRegistered || false
		default:
			return false
	}
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.container {
	width: clamp(calc(800px - 4rem), calc(100% - 4rem), 1100px);
	margin: 0 auto;
	@media (max-width: $breakpoint-m) {
		width: 100%;
		background: var(--bg-secondary-color);
	}
}

.grid {
	display: grid;
	grid-template-columns: 1fr clamp(250px, 25%, 360px);
	grid-template-rows: auto 1fr;
	grid-template-areas:
		'title cancel'
		'form progress';
	height: calc(100vh - var($nav-header-height));
	gap: 0 2rem;
	@media (max-width: $breakpoint-m) {
		grid-template-rows: auto auto 1fr;
		grid-template-columns: 1fr;
		grid-template-areas:
			'progress'
			'title'
			'form';
		gap: 0;
	}
}

.progress-area.desktop {
	grid-area: progress;
	position: relative;

	.progress-container {
		position: sticky;
		top: 5rem;
		align-self: start;
		padding: 1.5rem 1rem;
		border-radius: 16px;
		/* width: 320px; */
		box-shadow: var(--box-shadow);

		.progress-steps {
			margin-bottom: 1rem;
		}

		.progress-steps-loader {
			margin: 0rem;
			margin-right: 1rem;
			margin-top: 0.5rem;
			padding: 0;
			width: 1rem;
			height: 1rem;
		}

		.progress-steps-loader:after {
			width: 1rem;
			height: 1rem;
			margin: 0;
			border-radius: 50%;
			border: 3px solid $clr-pink;
			border-color: $clr-pink transparent $clr-pink transparent;
		}

		.progress-step {
			display: flex;

			img {
				margin-right: 1rem;
			}

			img.current-step {
				filter: var(--img-filter, invert(0.3));
			}

			p {
				margin: 0.5rem 0;
			}
			.step {
				@include stepColor(var(--text-color-rgb));
			}
			.active {
				color: var(--text-color);
				font-weight: 600;
				font-size: 1rem;
			}
		}

		.subtitle {
			font-weight: 500;
			opacity: 0.8;
		}
	}
}

.progress-area.mobile {
	grid-area: progress;
	margin: 2rem 1rem;
	margin-bottom: 0;

	.row {
		margin-top: 1.5rem;

		p {
			margin: 0;
			font-weight: 500;
		}

		.cancel-link {
			font-weight: 500;
		}
	}
}

.title-area {
	grid-area: title;
	display: flex;
	padding: 1rem;
	padding-left: 0rem;
	justify-content: space-between;
	align-items: flex-start;
	flex-direction: column;

	h1 {
		font-family: 'Glacial Indifference', sans-serif;
	}

	@media (max-width: $breakpoint-m) {
		margin-top: 2rem;
		padding-bottom: 0;
		padding-left: 1rem;
		font-size: 14px;
		font-weight: normal;
	}
}

.cancel-area {
	grid-area: cancel;
	display: flex;
	justify-content: flex-end;
	align-items: center;

	.cancel-link {
		font-weight: 500;
	}
}

.form-area {
	grid-area: form;
	overflow: auto;
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 1rem;
	height: 100%;
	@media (min-width: $breakpoint-m) {
		padding: 0;
		width: 100%;
	}
}

.form-area p {
	line-height: 150%;
}

.step-title {
	font-size: 1.5rem;
	margin-top: 1rem;
	font-weight: 600;
	&:first-of-type {
		margin-top: 0;
	}
}

.row {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.application {
	/* height: 100%; */
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	margin-bottom: 2rem;
	@media (min-width: $breakpoint-m) {
		background: var(--bg-secondary-color);
		padding: 1.5rem;
		border-radius: 1rem;
		margin-bottom: 4rem;
	}
}

.cancel-link {
	position: sticky;
	top: 0px;
	color: var(--error-color);
	text-decoration: underline;
}

.transaction {
	padding: 2rem;
	border-radius: 1rem;
	width: auto;

	button {
		max-width: 250px;
		margin: auto;
	}
}

.qr {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	border-radius: 1rem;
	margin-top: 2rem;
	padding: 2rem;
	/* @media (max-width: $breakpoint-m) {
        width: 100%;
  } */
}

.instructions {
	width: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	a {
		overflow-wrap: anywhere;
	}
}

.qr-code {
	width: 320px;
	margin: 2rem;
}

.icon {
	$icon-height: 5rem;
	height: $icon-height;
	width: 100%;
	display: flex;
	justify-content: center;
	margin-bottom: 1rem;
	img {
		width: $icon-height;
		aspect-ratio: 1;
	}
}

.btn-block {
	display: block;
	width: 100%;
}

.remaining-step {
	filter: var(--img-filter, invert(0.3));
}
</style>

<template>
	<div id="join-the-round" class="container">
		<div class="grid">
			<form-progress-widget
				:currentStep="currentStep"
				:furthestStep="form.furthestStep"
				:steps="steps"
				:stepNames="stepNames"
				:isNavDisabled="isNavDisabled"
				:isStepUnlocked="isStepUnlocked"
				:isStepValid="isStepValid"
				:handleStepNav="handleStepNav"
				:saveFormData="saveFormData"
			/>
			<div class="title-area">
				<h1>Join the round</h1>
				<div v-if="currentStep === 5">
					<div class="toggle-tabs-desktop">
						<p
							class="tab"
							id="review"
							:class="showSummaryPreview ? 'inactive-tab' : 'active-tab'"
							@click="handleToggleTab"
						>
							Review info
						</p>
						<p
							class="tab"
							id="preview"
							:class="showSummaryPreview ? 'active-tab' : 'inactive-tab'"
							@click="handleToggleTab"
						>
							Preview project
						</p>
					</div>
				</div>
			</div>
			<div class="cancel-area desktop">
				<links class="cancel-link" to="/join"> Cancel </links>
			</div>
			<div class="form-area">
				<div class="application">
					<div v-if="currentStep === 0">
						<h2 class="step-title">About the project</h2>
						<div class="inputs">
							<div class="form-background">
								<label for="project-name" class="input-label">Project name</label>
								<input
									id="project-name"
									type="text"
									placeholder="ex: clr.fund"
									v-model="v$.project.name.$model"
									:class="{
										input: true,
										invalid: v$.project.name.$error,
									}"
								/>
								<p
									:class="{
										error: true,
										hidden: !v$.project.name.$error,
									}"
								>
									Your project needs a name
								</p>
							</div>
							<div class="form-background">
								<label for="project-tagline" class="input-label">Tagline</label>
								<p class="input-description">
									Describe your project in a sentence. Max characters: 140
								</p>
								<textarea
									id="project-tagline"
									placeholder="ex: A quadratic funding protocol"
									v-model="v$.project.tagline.$model"
									:class="{
										input: true,
										invalid: v$.project.tagline.$error,
									}"
								/>
								<p
									:class="{
										error: true,
										hidden: !v$.project.tagline.$error || v$.project.tagline.maxLength,
									}"
								>
									This tagline is too long. Be brief for potential contributors
								</p>
								<p
									:class="{
										error: true,
										hidden: !v$.project.tagline.$error || !v$.project.tagline.maxLength,
									}"
								>
									Your project needs a tagline
								</p>
							</div>
							<div class="form-background">
								<label for="project-description" class="input-label">
									Description
									<p class="input-description">Markdown supported.</p>
								</label>
								<textarea
									id="project-description"
									placeholder="ex: CLR.fund is a quadratic funding protocol that aims to make it as easy as possible to set up, manage, and participate in quadratic funding rounds..."
									v-model="v$.project.description.$model"
									:class="{
										input: true,
										invalid: v$.project.description.$error,
									}"
								/>
								<p v-if="form.project.description" class="input-label pt-1">Preview:</p>
								<markdown :raw="form.project.description" />
								<p
									:class="{
										error: true,
										hidden: !v$.project.description.$error,
									}"
								>
									Your project needs a description. What are you raising money for?
								</p>
							</div>
							<div class="form-background">
								<label for="project-category" class="input-label"
									>Category
									<p class="input-description">Choose the best fit.</p>
								</label>
								<form class="radio-row" id="category-radio">
									<input
										id="tooling"
										type="radio"
										name="project-category"
										value="Tooling"
										v-model="v$.project.category.$model"
										:class="{
											input: true,
											invalid: v$.project.category.$error,
										}"
									/>
									<label for="tooling" class="radio-btn">Tools</label>
									<input
										id="category-content"
										type="radio"
										name="project-category"
										value="Content"
										v-model="v$.project.category.$model"
										:class="{
											input: true,
											invalid: v$.project.category.$error,
										}"
									/>
									<label for="category-content" class="radio-btn">Content</label>
									<input
										id="research"
										type="radio"
										name="project-category"
										value="Research"
										v-model="v$.project.category.$model"
										:class="{
											input: true,
											invalid: v$.project.category.$error,
										}"
									/>
									<label for="research" class="radio-btn">Research</label>

									<input
										id="data"
										type="radio"
										name="project-category"
										value="Data"
										v-model="v$.project.category.$model"
										:class="{
											input: true,
											invalid: v$.project.category.$error,
										}"
									/>
									<label for="data" class="radio-btn">Data</label>
								</form>
								<p
									:class="{
										error: true,
										hidden: !v$.project.category.$error,
									}"
								>
									You need to choose a category
								</p>
							</div>
							<div class="form-background">
								<label for="project-problem-space" class="input-label">Problem space</label>
								<p class="input-description">
									Explain the problems you're trying to solve. Markdown supported.
								</p>
								<textarea
									id="project-problem-space"
									placeholder="ex: there is no way to spin up a quadratic funding round. Right now, you have to collaborate with GitCoin Grants which isn’t a scalable or sustainable model."
									v-model="v$.project.problemSpace.$model"
									:class="{
										input: true,
										invalid: v$.project.problemSpace.$error,
									}"
								/>
								<p
									:class="{
										error: true,
										hidden: !v$.project.problemSpace.$error,
									}"
								>
									Explain the problem your project solves
								</p>
								<p v-if="form.project.description" class="input-label pt-1">Preview:</p>
								<markdown :raw="form.project.problemSpace" />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="mobile nav-bar">
			<form-navigation
				:isStepValid="isStepValid(currentStep)"
				:steps="steps"
				:finalStep="steps.length - 2"
				:currentStep="currentStep"
				:callback="saveFormData"
				:handleStepNav="handleStepNav"
				:isNavDisabled="isNavDisabled"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core'
import { required, email, maxLength, url } from '@vuelidate/validators'
import type { RecipientApplicationData, formToProjectInterface } from '@/api/recipient-registry-optimistic'
import type { Project } from '@/api/projects'
import { chain } from '@/api/core'
import { DateTime } from 'luxon'
import { useAppStore } from '@/stores/app'
import { waitForTransaction } from '@/utils/contracts'
import { addRecipient as _addRecipient } from '@/api/recipient-registry-optimistic'
import { storeToRefs } from 'pinia'
import { isValidEthAddress, resolveEns } from '@/utils/accounts'
import * as isIPFS from 'is-ipfs'

const router = useRouter()
const appStore = useAppStore()

const form = reactive<RecipientApplicationData>({
	project: {
		name: '',
		tagline: '',
		description: '',
		category: '',
		problemSpace: '',
	},
	fund: {
		addressName: '',
		resolvedAddress: '',
		plans: '',
	},
	team: {
		name: '',
		description: '',
		email: '',
	},
	links: {
		github: '',
		radicle: '',
		website: '',
		twitter: '',
		discord: '',
	},
	image: {
		bannerHash: '',
		thumbnailHash: '',
	},
	furthestStep: 0,
	hasEns: false,
})

const rules = computed(() => {
	return {
		project: {
			name: { required },
			tagline: {
				required,
				maxLength: maxLength(140),
			},
			description: { required },
			category: { required },
			problemSpace: { required },
		},
		fund: {
			addressName: {
				required,
				validEthAddress: isValidEthAddress,
			},
			resolvedAddress: {},
			plans: { required },
		},
		team: {
			name: {},
			description: {},
			email: {
				email,
				required: import.meta.env.VITE_GOOGLE_SPREADSHEET_ID ? required : () => true,
			},
		},
		links: {
			github: { url },
			radicle: { url },
			website: { url },
			twitter: { url },
			discord: { url },
		},
		image: {
			bannerHash: {
				required,
				validIpfsHash: isIPFS.cid,
			},
			thumbnailHash: {
				required,
				validIpfsHash: isIPFS.cid,
			},
		},
	}
})

const v$ = useVuelidate(rules, form)

const currentStep = ref(0)
const steps = ref<string[]>([])
const stepNames = ref<string[]>([])
const showSummaryPreview = ref(false)
const isWaiting = ref(false)
const txHash = ref('')
const txError = ref('')

const isNavDisabled = computed<boolean>(
	() => !isStepValid(currentStep.value) && currentStep.value !== form.furthestStep,
)

function isStepValid(step: number): boolean {
	if (isWaiting.value) {
		return false
	}

	if (step === 3) {
		return isLinkStepValid()
	}
	const stepName: string = steps.value[step]
	return !v$.value[stepName]?.$invalid
}

// Check that at least one link is not empty && no links are invalid
function isLinkStepValid(): boolean {
	let isValid = false
	const links = Object.keys(form.links)
	for (const link of links) {
		const linkData = v$.value.links[link]
		if (!linkData) return false
		const isInvalid = linkData.$invalid
		const isEmpty = linkData.$model.length === 0
		if (isInvalid) {
			return false
		} else if (!isEmpty) {
			isValid = true
		}
	}
	return isValid
}

function isStepUnlocked(step: number): boolean {
	return step <= form.furthestStep
}

function handleToggleTab(event): void {
	const { id } = event.target
	// Guard clause:
	if ((!showSummaryPreview.value && id === 'review') || (showSummaryPreview.value && id === 'preview')) return
	showSummaryPreview.value = !showSummaryPreview.value
}

function handleStepNav(step: number, updateFurthest?: boolean): void {
	// If isNavDisabled => disable quick-links
	if (isNavDisabled.value) return
	// Save form data
	saveFormData(updateFurthest)
	// Navigate
	if (steps.value[step] === 'submit') {
		addRecipient()
	} else {
		if (isStepUnlocked(step)) {
			router.push({
				name: 'join-step',
				params: {
					step: steps.value[step],
				},
			})
		}
	}
}

function saveFormData(updateFurthest?: boolean): void {
	if (updateFurthest && currentStep.value + 1 > form.furthestStep) {
		form.furthestStep = currentStep.value + 1
	}
	if (typeof currentStep.value !== 'number') return
	appStore.setRecipientData({
		updatedData: form,
		step: steps.value[currentStep.value],
		stepNumber: currentStep.value,
	})
}

async function addRecipient() {
	const { currentRound, currentUser, recipient, recipientRegistryAddress, recipientRegistryInfo } =
		storeToRefs(appStore)

	isWaiting.value = true

	// Reset errors when submitting
	txError.value = ''

	if (recipientRegistryAddress.value && recipient.value && recipientRegistryInfo.value && currentUser.value) {
		try {
			if (currentRound.value && DateTime.now() >= currentRound.value.votingDeadline) {
				router.push({
					name: 'join',
				})
				throw { message: 'round over' }
			}

			await waitForTransaction(
				_addRecipient(
					recipientRegistryAddress.value,
					recipient.value,
					recipientRegistryInfo.value.deposit,
					currentUser.value.walletProvider.getSigner(),
				),
				hash => (txHash.value = hash),
			)

			// Send application data to a Google Spreadsheet
			if (import.meta.env.VITE_GOOGLE_SPREADSHEET_ID) {
				await fetch('/.netlify/functions/recipient', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(recipient),
				})
			}
			appStore.resetRecipientData()
		} catch (error: any) {
			isWaiting.value = false
			txError.value = error.message
			return
		}
		isWaiting.value = false

		router.push({
			name: 'project-added',
			params: {
				hash: txHash.value,
			},
		})
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
		grid-template-rows: auto auto 1fr auto;
		grid-template-columns: 1fr;
		grid-template-areas:
			'progress'
			'title'
			'form';
		gap: 0;
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
		margin-top: 6rem;
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

.nav-bar {
	position: fixed;
	bottom: 0;
	right: 0;
	left: 0;
	padding: 1.5rem;
	background: var(--bg-primary-color);
	box-shadow: var(--box-shadow);
}

.layout-steps {
	display: flex;
	justify-content: center;
	align-items: flex-start;

	@media (max-width: $breakpoint-m) {
		display: block;
		margin: 0;
	}
}

.step-title {
	font-size: 1.5rem;
	margin-top: 1rem;
	font-weight: 600;
	&:first-of-type {
		margin-top: 0;
	}
}

.application {
	/* height: 100%; */
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	margin-bottom: 2rem;
	overflow: none;
	@media (min-width: $breakpoint-m) {
		background: var(--bg-secondary-color);
		padding: 1.5rem;
		border-radius: 1rem;
		margin-bottom: 4rem;
	}
}

.link {
	font-family: Inter;
	font-size: 16px;
	text-decoration: underline;
}

.cancel-link {
	position: sticky;
	top: 0px;
	color: var(--error-color);
	text-decoration: underline;
}

.inputs {
	margin: 1.5rem 0;
}

.form-background {
	border-radius: 0.5rem;
	padding: 1rem;
	background: var(--bg-light-color);
	margin-top: 1.5rem;
	display: flex;
	flex-direction: column;
	&:last-of-type {
		margin-bottom: 2rem;
	}
	@media (max-width: $breakpoint-m) {
		&:first-of-type {
			margin-top: 0;
		}
	}
}

.input {
	color: var(--text-color);
	border-radius: 16px;
	border: 2px solid var(-button-color);
	background-color: var(--bg-secondary-color);
	margin: 0.5rem 0;
	padding: 0.5rem 1rem;
	font-size: 16px;
	font-family: Inter;
	font-weight: 400;
	line-height: 24px;
	letter-spacing: 0em;
	&:valid {
		border: 2px solid $clr-green;
	}
	&:hover {
		background: var(--bg-primary-color);
		border: 2px solid $highlight-color;
		box-shadow: 0px 4px 16px 0px 25, 22, 35, 0.4;
	}
	&:optional {
		border: 2px solid $button-color;
		background-color: var(--bg-secondary-color);
	}
}

.input.invalid {
	border: 2px solid var(--error-color);
}

.input-description {
	margin-top: 0.25rem;
	font-size: 14px;
	font-family: Inter;
	margin-bottom: 0.5rem;
	line-height: 150%;
}

.input-notice {
	margin-top: 0.25rem;
	font-size: 12px;
	font-family: Inter;
	margin-bottom: 0.5rem;
	line-height: 150%;
	color: var(--attention-color);
	text-transform: uppercase;
	font-weight: 500;
}

.input-label {
	font-family: Inter;
	font-size: 16px;
	font-style: normal;
	font-weight: 500;
	line-height: 24px;
	letter-spacing: 0em;
	text-align: left;
	margin: 0;
}

.radio-row {
	display: flex;
	margin-top: 1rem;
	box-sizing: border-box;
	border: 2px solid $button-color;
	border-radius: 1rem;
	overflow: hidden;
	width: fit-content;
	input {
		position: fixed;
		opacity: 0;
		pointer-events: none;
	}
	input[type='radio']:checked + label {
		background: $clr-pink;
		font-weight: 600;
	}
	@media (max-width: $breakpoint-m) {
		width: 100%;
		flex-direction: column;
		text-align: center;
	}
}

.radio-btn {
	box-sizing: border-box;
	color: var(--text-color);
	font-size: 16px;
	line-height: 24px;
	align-items: center;
	padding: 0.5rem 1rem;
	margin-left: -1px;

	border-right: 2px solid $button-color;
	border-bottom: none;
	@media (max-width: $breakpoint-m) {
		border-right: none;
		border-bottom: 2px solid $button-color;
	}
	&:last-of-type {
		border-right: none;
		border-bottom: none;
	}

	&:hover {
		opacity: 0.8;
		background: var(--bg-secondary-highlight);
		transform: scale(1.04);
		cursor: pointer;
	}
	&:active {
		background: var(--bg-secondary-highlight);
	}
}

.read-only-title {
	line-height: 150%;
	margin: 0;
}

.project-details {
	&:last-child {
		margin-bottom: 0;
	}
}

.summary {
	margin-bottom: 1rem;
	:deep() {
		.markdown {
			h1,
			h2,
			h3,
			h4,
			h5,
			h6,
			p {
				margin: 0.25rem 0;
			}
		}
	}
}

.summary-section-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 1.5rem;
	border-bottom: 1px solid $highlight-color;
	padding-bottom: 0.5rem;
}

.toggle-tabs-desktop {
	display: flex;
	gap: 2rem;
	font-family: 'Inter';
	@media (max-width: $breakpoint-m) {
		/* flex-direction: column;
      gap: 0;
      margin-left: 0rem; */
		/* display: none; */
	}
	.active-tab {
		padding-bottom: 0.5rem;
		border-bottom: 4px solid $clr-green;
		border-radius: 4px;
		font-weight: 600;
		/* text-decoration: underline; */
	}
	.inactive-tab {
		padding-bottom: 0.5rem;
		cursor: pointer;
		&:hover {
			opacity: 0.8;
			border-bottom: 4px solid rgba(var(--text-color-rgb), 0.467);
			border-radius: 4px;
		}
		/* text-decoration: underline; */
	}
}

.toggle-tabs-mobile {
	display: flex;
	gap: 2rem;
	@media (min-width: $breakpoint-m) {
		/* flex-direction: column;
      gap: 0;
      margin-left: 0rem; */
		display: none;
	}
	.active-tab {
		padding-bottom: 0.5rem;
		border-bottom: 4px solid $clr-green;
		border-radius: 4px;
		font-weight: 600;
		/* text-decoration: underline; */
	}
	.inactive-tab {
		padding-bottom: 0.5rem;
		cursor: pointer;
		&:hover {
			opacity: 0.8;
			transform: scale(1.02);
		}
		/* text-decoration: underline; */
	}
}

.step-subtitle {
	margin: 0.5rem 0;
	font-family: 'Glacial Indifference', sans-serif;
	font-size: 1.5rem;
}

.edit-button {
	font-family: 'Inter';
	font-weight: 500;
	font-size: 16px;
	color: $clr-green;
}

.data {
	opacity: 0.8;
	margin-top: 0.25rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.data img {
	padding: 0.25rem;
	margin-top: 0.25rem;
	&:hover {
		background: var(--bg-primary-color);
		border-radius: 4px;
	}
}

.pt-1 {
	padding-top: 1rem;
}

/* .hr {
    opacity: 0.1;
    height: 1px;
    margin: 1rem 0;
  } */

.tx-value {
}

.fiat-value {
	font-weight: 400;
	opacity: 0.8;
}

.tx-progress-area {
	text-align: center;
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-bottom: 2rem;
}

.checkout {
	margin-bottom: 1rem;
}

.checkout-desktop {
	padding-top: 1.5rem;
	border-top: 1px solid $button-color;
}

.tx-notice {
	margin-top: 0.25rem;
	font-size: 12px;
	font-family: Inter;
	margin-bottom: 0.5rem;
	line-height: 150%;
	text-transform: uppercase;
	font-weight: 500;
}

.break-all {
	@media (max-width: $breakpoint-s) {
		display: block;
	}

	p {
		overflow: hidden;
		text-overflow: ellipsis;
	}
}

.no-break {
	white-space: nowrap;
}

.resolved-address {
	overflow: hidden;
	text-overflow: ellipsis;
	opacity: 0.5;
	word-break: keep-all;
	font-size: 0.875rem;
	margin-top: 0.25rem;
}
</style>

<template>
	<div id="join-the-round" class="container">
		<div class="grid">
			<!-- web sidebar -->
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
					<div v-if="currentStep === 1">
						<h2 class="step-title">Donation details</h2>
						<div class="inputs">
							<div class="form-background">
								<label for="fund-address" class="input-label">Ethereum address</label>
								<p class="input-description">
									The destination address for donations, which you'll use to claim funds. This doesn't
									have to be the same address as the one you use to send your application transaction.
								</p>
								<input
									id="fund-address"
									placeholder="example: 0x123..."
									v-model.lazy="v$.fund.addressName.$model"
									@blur="checkEns"
									:class="{
										input: true,
										invalid: v$.fund.addressName.$error,
									}"
								/>
								<p
									:class="{
										error: true,
										hidden: !v$.fund.addressName.$error,
									}"
								>
									Enter a valid ENS or Ethereum 0x address
								</p>
								<!-- TODO: only validate after user removes focus on input -->
							</div>
							<div class="form-background">
								<label for="fund-plans" class="input-label">How will you spend your funding?</label>
								<p class="input-description">
									Potential contributors might convert based on your specific funding plans. Markdown
									supported.
								</p>
								<textarea
									id="fund-plans"
									placeholder="ex: on our roadmap..."
									v-model="v$.fund.plans.$model"
									:class="{
										input: true,
										invalid: v$.fund.plans.$error,
									}"
								/>
								<p
									:class="{
										error: true,
										hidden: !v$.fund.plans.$error,
									}"
								>
									Let potential contributors know what plans you have for their donations.
								</p>
								<p v-if="form.fund.plans" class="input-label pt-1">Preview:</p>
								<markdown :raw="form.fund.plans" />
							</div>
						</div>
					</div>
					<div v-if="currentStep === 2">
						<h2 class="step-title">Team details</h2>
						<p>Tell us about the folks behind your project.</p>
						<div class="inputs">
							<div v-if="isEmailRequired" class="form-background">
								<label for="team-email" class="input-label"> Contact email </label>
								<p class="input-description">
									For important updates about your project and the funding round.
								</p>
								<input
									id="team-email"
									placeholder="example: doge@goodboi.com"
									v-model.lazy="v$.team.email.$model"
									:class="{
										input: true,
										invalid: v$.team.email.$error,
									}"
								/>
								<p class="input-notice">
									We won't display this publicly or add it to the on-chain registry.
								</p>
								<p
									:class="{
										error: true,
										hidden: !v$.team.email.$error,
									}"
								>
									This doesn't look like an email.
								</p>
							</div>
							<div class="form-background">
								<label for="team-name" class="input-label">Team name (optional)</label>
								<p class="input-description">If different to project name.</p>
								<input
									id="team-name"
									type="email"
									placeholder="ex: clr.fund"
									v-model="v$.team.name.$model"
									:class="{
										input: true,
										invalid: v$.team.name.$error,
									}"
								/>
							</div>
							<div class="form-background">
								<label for="team-desc" class="input-label">Team description (optional)</label>
								<p class="input-description">
									If different to project description. Markdown supported.
								</p>
								<textarea
									id="team-desc"
									placeholder="ex: CLR.fund is a quadratic funding protocol that aims to make it as easy as possible to set up, manage, and participate in quadratic funding rounds..."
									v-model="v$.team.description.$model"
									:class="{
										input: true,
										invalid: v$.team.description.$error,
									}"
								/>
								<p v-if="form.team.description" class="input-label pt-1">Preview:</p>
								<markdown :raw="form.team.description" />
							</div>
						</div>
					</div>
					<div v-if="currentStep === 3">
						<h2 class="step-title">Links</h2>
						<p>
							Give contributors some links to check out to learn more about your project. Provide at least
							one.
						</p>
						<div class="inputs">
							<div class="form-background">
								<label for="links-github" class="input-label">GitHub</label>
								<input
									id="links-github"
									type="link"
									placeholder="example: https://github.com/ethereum/clrfund"
									v-model.lazy="v$.links.github.$model"
									:class="{
										input: true,
										invalid: v$.links.github.$error,
									}"
								/>
								<p
									:class="{
										error: true,
										hidden: !v$.links.github.$error,
									}"
								>
									This doesn't look like a valid URL
								</p>
								<!-- TODO: only validate after user removes focus on input -->
							</div>
							<div class="form-background">
								<label for="links-radicle" class="input-label">Radicle</label>
								<input
									id="links-radicle"
									type="link"
									placeholder="example: https://radicle.xyz/ethereum/clrfund"
									v-model.lazy="v$.links.radicle.$model"
									:class="{
										input: true,
										invalid: v$.links.radicle.$error,
									}"
								/>
								<p
									:class="{
										error: true,
										hidden: !v$.links.radicle.$error,
									}"
								>
									This doesn't look like a valid URL
								</p>
							</div>
							<div class="form-background">
								<label for="links-website" class="input-label">Website</label>
								<input
									id="links-website"
									type="link"
									placeholder="example: https://clr.fund"
									v-model.lazy="v$.links.website.$model"
									:class="{
										input: true,
										invalid: v$.links.website.$error,
									}"
								/>
								<p
									:class="{
										error: true,
										hidden: !v$.links.website.$error,
									}"
								>
									This doesn't look like a valid URL
								</p>
							</div>
							<div class="form-background">
								<label for="links-twitter" class="input-label">Twitter</label>
								<input
									id="links-twitter"
									type="link"
									placeholder="example: https://twitter.com/ethereum"
									v-model.lazy="v$.links.twitter.$model"
									:class="{
										input: true,
										invalid: v$.links.twitter.$error,
									}"
								/>
								<p
									:class="{
										error: true,
										hidden: !v$.links.twitter.$error,
									}"
								>
									This doesn't look like a valid URL
								</p>
							</div>
							<div class="form-background">
								<label for="links-discord" class="input-label">Chat</label>
								<input
									id="links-discord"
									type="link"
									placeholder="ex: https://discord.gg/5Prub9zbGz"
									class="input"
									v-model.lazy="v$.links.discord.$model"
									:class="{
										input: true,
										invalid: v$.links.discord.$error,
									}"
								/>
								<p
									:class="{
										error: true,
										hidden: !v$.links.discord.$error,
									}"
								>
									This doesn't look like a valid URL
								</p>
							</div>
						</div>
					</div>
					<div v-if="currentStep === 4">
						<h2 class="step-title">Images</h2>
						<p>
							We'll upload your images to IPFS, a decentralized storage platform.
							<links to="https://ipfs.io/#how">More on IPFS</links>
						</p>
						<div class="inputs">
							<div class="form-background">
								<ipfs-image-upload
									label="Banner image"
									description="Recommended aspect ratio: 16x9 • Max file size: 512kB • JPG, PNG, or GIF"
									:onUpload="handleUpload"
									formProp="bannerHash"
								/>
							</div>
							<div class="form-background">
								<ipfs-image-upload
									label="Thumbnail image"
									description="Recommended aspect ratio: 1x1 (square) • Max file size: 512kB • JPG, PNG, or GIF"
									:onUpload="handleUpload"
									formProp="thumbnailHash"
								/>
							</div>
						</div>
					</div>
					<div v-if="currentStep === 5" id="summary">
						<project-profile
							v-if="showSummaryPreview"
							:project="projectInterface"
							:previewMode="true"
							class="project-details"
						/>
						<div v-if="!showSummaryPreview">
							<h2 class="step-title">Review your information</h2>
							<warning
								message="This information will be stored in a smart contract and cannot be edited, so please review carefully."
							/>
							<div class="form-background">
								<div class="summary-section-header">
									<h3 class="step-subtitle">About the project</h3>
									<links to="/join/project" class="edit-button"
										>Edit <img width="16px" src="@/assets/edit.svg"
									/></links>
								</div>
								<div class="summary">
									<h4 class="read-only-title">Project name</h4>
									<div class="data">{{ form.project.name }}</div>
								</div>
								<div class="summary">
									<h4 class="read-only-title">Tagline</h4>
									<div class="data">{{ form.project.tagline }}</div>
								</div>
								<div class="summary">
									<h4 class="read-only-title">Description</h4>
									<markdown :raw="form.project.description" />
								</div>
								<div class="summary">
									<h4 class="read-only-title">Category</h4>
									<div class="data">{{ form.project.category }}</div>
								</div>
								<div class="summary">
									<h4 class="read-only-title">Problem space</h4>
									<markdown :raw="form.project.problemSpace" />
								</div>
							</div>
							<div class="form-background">
								<div class="summary-section-header">
									<h3 class="step-subtitle">Funding details</h3>
									<links to="/join/fund" class="edit-button"
										>Edit <img width="16px" src="@/assets/edit.svg"
									/></links>
								</div>
								<div class="summary">
									<h4 class="read-only-title">Ethereum address</h4>
									<div class="data break-all">
										{{ form.fund.addressName }}
										<links :to="blockExplorer.url" class="no-break">
											View on {{ blockExplorer.label }}
										</links>
									</div>
									<div
										class="resolved-address"
										v-if="form.fund.addressName"
										title="Resolved ENS address"
									>
										{{ form.hasEns ? form.fund.resolvedAddress : null }}
									</div>
								</div>
								<div class="summary">
									<h4 class="read-only-title">Funding plans</h4>
									<markdown :raw="form.fund.plans" />
								</div>
							</div>
							<div class="form-background">
								<div class="summary-section-header">
									<h3 class="step-subtitle">Team details</h3>
									<links to="/join/team" class="edit-button"
										>Edit <img width="16px" src="@/assets/edit.svg"
									/></links>
								</div>
								<div v-if="isEmailRequired" class="summary">
									<h4 class="read-only-title">Contact email</h4>
									<div class="data">{{ form.team.email }}</div>
									<div class="input-notice">
										This information won't be added to the smart contract.
									</div>
								</div>
								<div class="summary">
									<h4 class="read-only-title">Team name</h4>
									<div class="data">{{ form.team.name }}</div>
									<div class="data" v-if="!form.team.name">Not provided</div>
								</div>
								<div class="summary">
									<h4 class="read-only-title">Team description</h4>
									<markdown :raw="form.team.description" />
									<div class="data" v-if="!form.team.description">Not provided</div>
								</div>
							</div>
							<div class="form-background">
								<div class="summary-section-header">
									<h3 class="step-subtitle">Links</h3>
									<links to="/join/links" class="edit-button"
										>Edit <img width="16px" src="@/assets/edit.svg"
									/></links>
								</div>
								<div class="summary">
									<h4 class="read-only-title">GitHub</h4>
									<div class="data">
										{{ form.links.github }}
										<links v-if="form.links.github" :to="form.links.github" :hideArrow="true"
											><img width="16px" src="@/assets/link.svg"
										/></links>
									</div>
									<div class="data" v-if="!form.links.github">Not provided</div>
								</div>
								<div class="summary">
									<h4 class="read-only-title">Twitter</h4>
									<div class="data">
										{{ form.links.twitter }}
										<links v-if="form.links.twitter" :to="form.links.twitter" :hideArrow="true"
											><img width="16px" src="@/assets/link.svg"
										/></links>
									</div>
									<div class="data" v-if="!form.links.twitter">Not provided</div>
								</div>
								<div class="summary">
									<h4 class="read-only-title">Website</h4>
									<div class="data" key="">
										{{ form.links.website }}
										<links v-if="form.links.website" :to="form.links.website" :hideArrow="true"
											><img width="16px" src="@/assets/link.svg"
										/></links>
									</div>
									<div class="data" v-if="!form.links.website">Not provided</div>
								</div>
								<div class="summary">
									<h4 class="read-only-title">Discord</h4>
									<div class="data">
										{{ form.links.discord }}
										<links v-if="form.links.discord" :to="form.links.discord" :hideArrow="true"
											><img width="16px" src="@/assets/link.svg"
										/></links>
									</div>
									<div class="data" v-if="!form.links.discord">Not provided</div>
								</div>
								<div class="summary">
									<h4 class="read-only-title">Radicle</h4>
									<div class="data">
										{{ form.links.radicle }}
										<links v-if="form.links.radicle" :to="form.links.radicle" :hideArrow="true"
											><img width="16px" src="@/assets/link.svg"
										/></links>
									</div>
									<div class="data" v-if="!form.links.radicle">Not provided</div>
								</div>
							</div>
							<div class="form-background">
								<div class="summary-section-header">
									<h3 class="step-subtitle">Images</h3>
									<links to="/join/image" class="edit-button"
										>Edit <img width="16px" src="@/assets/edit.svg"
									/></links>
								</div>
								<div class="summary">
									<h4 class="read-only-title">Banner</h4>
									<div class="data">
										<ipfs-copy-widget :hash="form.image.bannerHash" />
									</div>
								</div>
								<div class="summary">
									<h4 class="read-only-title">Thumbnail</h4>
									<div class="data">
										<ipfs-copy-widget :hash="form.image.thumbnailHash" />
									</div>
								</div>
							</div>
						</div>
					</div>
					<div v-if="currentStep === 6">
						<h2 class="step-title">Submit project</h2>
						<p>
							This is a blockchain transaction that will add your project information to the funding
							round.
						</p>
						<div class="inputs">
							<recipient-submission-widget :isWaiting="isWaiting" :txHash="txHash" :txError="txError" />
						</div>
					</div>
				</div>
			</div>
		</div>
		<!-- mobile -->
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
import type { Ref } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, email, maxLength, url, helpers } from '@vuelidate/validators'
import { type RecipientApplicationData, formToProjectInterface } from '@/api/recipient-registry-optimistic'
import type { Project } from '@/api/projects'
import { chain } from '@/api/core'
import { DateTime } from 'luxon'
import { useRecipientStore, useAppStore } from '@/stores'
import { waitForTransaction } from '@/utils/contracts'
import { addRecipient as _addRecipient } from '@/api/recipient-registry-optimistic'
import { isValidEthAddress, resolveEns } from '@/utils/accounts'
import * as isIPFS from 'is-ipfs'
import { toReactive } from '@vueuse/core'

const route = useRoute()
const router = useRouter()
const recipientStore = useRecipientStore()
const appStore = useAppStore()
const { recipient } = storeToRefs(recipientStore)

const form = toReactive<RecipientApplicationData>(recipient as Ref<RecipientApplicationData>)
const { withAsync } = helpers
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
				validEthAddress: withAsync(isValidEthAddress),
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

const steps = ref<string[]>([])
const currentStep = ref<number>(0)
const stepNames = ref<string[]>([
	'About the project',
	'Donation details',
	'Team details',
	'Links',
	'Images',
	'Review',
	'Submit',
])
const showSummaryPreview = ref(false)
const isWaiting = ref(false)
const txHash = ref('')
const txError = ref('')

const isNavDisabled = computed<boolean>(
	() => !isStepValid(currentStep.value) && currentStep.value !== form.furthestStep,
)
const isEmailRequired = computed<boolean>(() => {
	return !!import.meta.env.VITE_GOOGLE_SPREADSHEET_ID
})
const blockExplorer = computed<{ label: string; url: string }>(() => {
	return {
		label: chain.explorerLabel,
		url: `${chain.explorer}/address/${form.fund.resolvedAddress}`,
	}
})
const projectInterface = computed<Project>(() => {
	return formToProjectInterface(form)
})

onMounted(() => {
	const _steps = Object.keys(form)
	_steps.splice(_steps.length - 1, 1, 'summary', 'submit')

	steps.value = _steps
	currentStep.value = _steps.indexOf(route.params.step as string)

	// redirect to /join/ if step doesn't exist
	if (currentStep.value < 0) {
		router.push({ name: 'join' })
	}
	// "Next" button restricts forward navigation via validation, and
	// eventually updates the `furthestStep` tracker when valid and clicked/tapped.
	// If URL step is ahead of furthest, navigate back to furthest
	if (currentStep.value > form.furthestStep) {
		router.push({
			name: 'join-step',
			params: { step: steps.value[form.furthestStep] },
		})
	}
})

function handleStepNav(step: number, updateFurthest?: boolean): void {
	// If isNavDisabled => disable quick-links
	if (isNavDisabled.value) return
	// Save form data
	saveFormData(updateFurthest)
	// Navigate
	if (steps.value[step] === 'submit') {
		addRecipient() // click confirm button
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
	recipientStore.setRecipientData({
		updatedData: form,
		step: steps.value[currentStep.value],
		stepNumber: currentStep.value,
	})
}

// Callback from IpfsImageUpload component
function handleUpload(key, value) {
	form.image[key] = value
	saveFormData(false)
}

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

async function addRecipient() {
	const { recipient, recipientRegistryAddress, recipientRegistryInfo } = storeToRefs(recipientStore)
	const { currentRound, currentUser } = storeToRefs(appStore)
	isWaiting.value = true

	// Reset errors when submitting
	txError.value = ''

	try {
		await recipientStore.loadRecipientRegistryInfo()
	} catch (error: any) {
		console.warn(error)
		txError.value = error.message
		return
	} finally {
		isWaiting.value = false
	}

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
			recipientStore.resetRecipientData()
		} catch (error: any) {
			console.warn(error, {
				recipientRegistryAddress: recipientRegistryAddress.value,
				recipient: recipient.value,
				recipientRegistryInfo: recipientRegistryInfo.value.deposit,
				currentUser: currentUser.value.walletProvider.getSigner(),
			})
			txError.value = error.message
			return
		} finally {
			isWaiting.value = false
		}

		router.push({
			name: 'project-added',
			params: {
				hash: txHash.value,
			},
		})
	} else {
		const errorMsg = 'Failed to add recipient'
		console.warn(errorMsg, {
			recipientRegistryAddress: recipientRegistryAddress.value,
			recipient: recipient.value,
			recipientRegistryInfo: recipientRegistryInfo.value,
			currentUser: currentUser.value,
		})

		txError.value = errorMsg
	}
}

async function checkEns(): Promise<void> {
	console.log('checkEns')
	const { addressName } = form.fund
	try {
		if (addressName) {
			const res: string | null = await resolveEns(addressName)
			form.hasEns = !!res
			form.fund.resolvedAddress = res ? res : addressName
		}
	} catch (error: any) {
		console.warn(error)
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

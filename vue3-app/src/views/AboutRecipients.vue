<template>
	<div class="about">
		<h1 class="content-heading">Recipient guide</h1>
		<p>
			An overview of how things work as a recipient so you can learn what to expect throughout the duration of a
			funding round.
		</p>
		<div v-if="chain.bridge">
			<h2>Get funds on {{ chain.label }}</h2>
			<p>
				You'll need some {{ chain.currency }} on {{ chain.label }} in order to submit transactions to the
				clr.fund smart contracts.
				<span v-if="chain.isLayer2">
					Follow
					<links
						:to="{
							name: 'about-layer-2',
							params: {
								section: 'bridge',
							},
						}"
					>
						these steps
					</links>
					to bridge your funds to {{ chain.label }}
				</span>
				<span v-else>
					<links :to="chain.bridge">Bridge your funds here</links>
				</span>
			</p>
			<p v-if="chain.isLayer2">
				Confused on what {{ chain.label }} is?
				<links to="about/layer-2"> Read our explanation on how clr.fund uses layer 2 on Ethereum. </links>
			</p>
		</div>
		<h2>Register your project</h2>
		<p>
			In order to participate in a funding round as a project, you'll need to submit an application to join the
			recipient registry (via an on-chain transaction).
		</p>
		<p>
			MACI, our anti-bribery tech, currently limits the amount of projects allowed per round.
			<links to="/about/maci">More on MACI</links>. The round only accepts a total of
			{{ maxRecipients }} projects, so we encourage you to apply early.
		</p>
		<p>Note: all application data (except contact email address) will be publicly stored on-chain.</p>
		<h3>Submit your application</h3>
		<ol>
			<li>Head over to the <links to="/join">Join page</links>.</li>
			<li>Click "See round criteria" and familiarize yourself with the criteria for projects.</li>
			<li>
				Once you're familiar with the criteria and you're sure your project meets them, click "Add project."
				You'll see a series of forms to fill out asking for more information about your project.
			</li>
			<li>
				With the forms finished, you can finish your submission:
				<ol>
					<li>Connect to the right network via your wallet of choice.</li>
					<li>
						Send a transaction (with a deposit of {{ depositAmount }} {{ depositToken }}) to the registry
						contract.
					</li>
				</ol>
			</li>
		</ol>

		<p>
			Projects are accepted by default, but the registry admin may remove projects that don't meet the criteria.
		</p>
		<p>
			In any case, your
			{{ depositToken }} will be returned once your application has been either accepted or denied. Note that
			metadata pointing to all your project information (but not contact information) will be stored publicly
			on-chain.
		</p>
		<h2>Claim your funds</h2>
		<p>
			After a clr.fund round is finished, it's simple to claim your project's share of the funding. Return to your
			project's page: you will see a "claim funds" button if your project received contributions during the round.
			Submit the claim transaction to receive your funds.
		</p>
		<h2>How does clr.fund work?</h2>
		<p>
			Looking for a more general overview?
			<links to="/about/how-it-works">Check out our "How It Works" page</links>.
		</p>
	</div>
</template>

<script setup lang="ts">
import Links from '@/components/Links.vue'
import { chain } from '@/api/core'
import { formatAmount } from '@/utils/amounts'
import { useAppStore, useRecipientStore } from '@/stores'
import { storeToRefs } from 'pinia'

const appStore = useAppStore()
const { maxRecipients } = storeToRefs(appStore)
const recipientStore = useRecipientStore()
const { recipientRegistryInfo } = storeToRefs(recipientStore)

const depositAmount = computed(() => {
	return recipientRegistryInfo.value ? formatAmount(recipientRegistryInfo.value.deposit, 18) : '...'
})

const depositToken = computed(() => {
	return recipientRegistryInfo.value?.depositToken ?? ''
})
</script>

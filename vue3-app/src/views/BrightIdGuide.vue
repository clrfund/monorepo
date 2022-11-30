<template>
	<div>
		<h2 class="step-title">Get verified</h2>
		<p>
			BrightID verification helps prove that you’re a unique human. To get verified, you need enough people to
			confirm they've met you and you're a real person. There are a couple of ways to do this:
		</p>
		<accordion
			tag="🚀 Fastest"
			header="Join a BrightId party"
			content="BrightID run verification parties regularly. Join the call,
    meet other new users, and they'll verify you’re a human and not a
    bot. Quick and painless, even for you introverts out there."
			:link-button="{
				link: 'https://meet.brightid.org/#/',
				text: 'View party schedule',
			}"
		/>
		<accordion
			tag="🎰 Luckiest"
			header="Connect with 2 verified humans"
			content="Know anyone that's contributed to Gitcoin Grants or clr.fund
        rounds? They may already be verified. Hit them up and see if
        they can verify you!"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Accordion from '@/components/Accordion.vue'

const sponsorTxHash = ref('')
const sponsorTxError = ref('')
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';
</style>

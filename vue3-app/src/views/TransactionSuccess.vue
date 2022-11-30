<template>
	<div class="container">
		<div class="image-wrapper">
			<image-responsive title="docking" />
			<img class="money" src="@/assets/money.gif" />
			<img class="money" src="@/assets/confetti.gif" />
		</div>
		<div class="dropshadow">
			<div class="content">
				<span class="contributed-icon">🎉</span>
				<p v-if="$route.params.type === 'reallocation'" class="contributed-header">
					{{ formatContribution }}
					{{ currentRound?.nativeTokenSymbol }} reallocated!
				</p>
				<p v-else-if="$route.params.type === 'contribution'" class="contributed-header">
					You just contributed!
				</p>
				<div>
					<p v-if="$route.params.type === 'reallocation'" class="contributed-content">
						Your choices have been updated! You can update your choices again any time in the next
						<time-left
							value-class="contributed-content-bold"
							unit-class="contributed-content-bold"
							:date="currentRound?.votingDeadline"
						/>.
					</p>
					<p v-else-if="$route.params.type === 'contribution'" class="contributed-content">
						Thanks for contributing to the Ethereum ecosystem. If you change your mind, you have
						<time-left
							value-class="contributed-content-bold"
							unit-class="contributed-content-bold"
							:date="currentRound?.votingDeadline"
						/>
						to reallocate your contributions.
					</p>
					<div v-if="$route.params.hash" class="receipt">
						<transaction-receipt :hash="$route.params.hash" />
					</div>
					<div class="btn-info" @click="redirectToProjects()">OK</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
// Libraries
import { computed } from 'vue'

// Components
import TransactionReceipt from '@/components/TransactionReceipt.vue'
import TimeLeft from '@/components/TimeLeft.vue'
import ImageResponsive from '@/components/ImageResponsive.vue'

// Utils
import { formatAmount } from '@/utils/amounts'
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

const router = useRouter()
const appStore = useAppStore()
const { contribution, currentRound } = storeToRefs(appStore)

const formatContribution = computed(() => (contribution.value ? formatAmount(contribution.value, 18) : ''))

function redirectToProjects() {
	router.push({ name: 'projects' })
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.container {
	position: relative;
}

.image-wrapper {
	position: fixed;
	height: 100vh;
	background: var(--bg-gradient);
	width: 100%;
	display: flex;
	justify-content: center;
}

.image-wrapper .docking {
	height: 95%;
	mix-blend-mode: exclusion;
	transform: rotate(15deg);
	@media (max-width: $breakpoint-m) {
		transform: translateX(-6em) translateY(3em) rotate(15deg);
	}
}

.image-wrapper .money {
	position: fixed;
	width: 100%;
	mix-blend-mode: exclusion;
}

.dropshadow {
	position: relative;
	@include gradientBackground(
		180deg,
		rgba(var(--shadow-dark-rgb), 0.4),
		56.5%,
		rgba(var(--shadow-light-rgb), 0),
		75.75%
	);
	height: 80vh;
}

.content {
	padding-top: 4rem;
	width: 500px;
	margin: 0 2.5rem;

	@media (max-width: $breakpoint-s) {
		margin: auto;
		width: 300px;
	}
}

.contributed-icon {
	font-family: Glacial Indifference;
	font-style: normal;
	font-weight: bold;
	font-size: 80px;
	line-height: 120%;
}

.contributed-header {
	font-family: 'Glacial Indifference', sans-serif;
	font-size: 1.5rem;
	font-weight: 700;
	line-height: 120%;
	margin-right: 0.5rem;
	color: var(--text-color);
}

.contributed-content {
	font-family: 'Inter', 'sans-serif';
	font-style: normal;
	font-weight: normal;
	line-height: 150%;
}

.contributed-content-bold {
	font-weight: bold;
}

.receipt {
	margin: 16px 0;
}
</style>

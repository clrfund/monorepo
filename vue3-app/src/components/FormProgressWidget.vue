<template>
	<div class="progress-area">
		<div class="desktop progress-container">
			<progress-bar :current-step="currentStep + 1" :total-steps="steps.length" />
			<p class="subtitle">Step {{ currentStep + 1 }} of {{ steps.length }}</p>
			<div class="progress-steps">
				<div
					v-for="(name, step) in stepNames"
					:key="step"
					class="progress-step"
					:class="{
						'zoom-link': step <= furthestStep && step !== currentStep && !isNavDisabled,
						disabled: isNavDisabled,
					}"
					@click="handleStepNav(step)"
				>
					<template v-if="step === currentStep">
						<img class="current-step" src="@/assets/current-step.svg" alt="current step" />
						<p class="active step" v-text="name" />
					</template>
					<template v-else-if="step === furthestStep">
						<img src="@/assets/furthest-step.svg" alt="current step" />
						<p class="active step" v-text="name" />
					</template>
					<template v-else-if="isStepUnlocked(step) && isStepValid(step)">
						<img class="completed-step" src="@/assets/green-tick.svg" alt="step complete" />
						<p class="step" v-text="name" />
					</template>
					<template v-else>
						<img src="@/assets/step-remaining.svg" alt="step remaining" />
						<p class="step" v-text="name" />
					</template>
				</div>
			</div>
			<form-navigation
				:is-step-valid="isStepValid(currentStep)"
				:steps="steps"
				:final-step="steps.length - 2"
				:current-step="currentStep"
				:callback="saveFormData"
				:handle-step-nav="handleStepNav"
				:is-nav-disabled="isNavDisabled"
				class="desktop"
			/>
		</div>
		<div class="mobile">
			<div class="padding">
				<progress-bar :current-step="currentStep + 1" :total-steps="steps.length" />
				<div class="row">
					<p>Step {{ currentStep + 1 }} of {{ steps.length }}</p>
					<links class="cancel-link" to="/join"> Cancel </links>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import ProgressBar from '@/components/ProgressBar.vue'
import FormNavigation from '@/components/FormNavigation.vue'
import Links from '@/components/Links.vue'

interface Props {
	currentStep: number
	furthestStep: number
	steps: string[]
	stepNames: string[]
	isNavDisabled: boolean
	isStepUnlocked: (step: number) => boolean
	isStepValid: (step: number) => boolean
	handleStepNav: (step?: number) => void
	saveFormData: (updateFurthest?: boolean) => void
}

defineProps<Props>()
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/mixins';

.progress-area {
	grid-area: progress;
	position: relative;

	.progress-container {
		position: sticky;
		top: 5rem;
		align-self: start;
		padding: 1.5rem 1rem;
		border-radius: 16px;
		box-shadow: var(--box-shadow);

		.progress-steps {
			margin-bottom: 1rem;
		}

		.progress-step {
			display: flex;

			img {
				margin-right: 1rem;
			}

			img:not(.completed-step) {
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

		.zoom-link {
			cursor: pointer;
			&:hover {
				transform: scale(1.02);
			}
		}

		.subtitle {
			font-weight: 500;
			opacity: 0.8;
		}
	}

	.mobile {
		margin-bottom: 0;
		position: fixed;
		width: 100%;
		background: var(--bg-secondary-color);
		z-index: 1;

		.padding {
			padding: 2rem 1rem 1rem 1rem;
		}
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
}

.cancel-link {
	position: sticky;
	top: 0px;
	color: var(--error-color);
	text-decoration: underline;
}

.row {
	display: flex;
	justify-content: space-between;
	align-items: center;
}
</style>

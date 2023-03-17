<template>
	<div class="progress-bar" :style="progressBarStyle">
		<div v-for="idx in totalSteps" :key="idx">
			<div class="step" :class="{ inactive: isFutureStep(idx) }" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
	currentStep: number
	totalSteps: number
}

const props = defineProps<Props>()
const progressBarStyle = computed(() => {
	return `grid-template-columns: repeat(${props.totalSteps}, 1fr);`
})
function isFutureStep(step: number): boolean {
	return step > props.currentStep
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.progress-bar {
	display: grid;
	column-gap: 0.5rem;
}

.step {
	background: $gradient-highlight;
	height: 8px;
	width: 100%;
	border-radius: 32px;
}

.inactive {
	background: var(--bg-inactive);
}
</style>

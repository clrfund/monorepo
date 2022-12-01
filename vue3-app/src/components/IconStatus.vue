<template>
	<div class="icon-container">
		<img :src="logoImageUrl" class="logo" />
		<div class="background">
			<div v-if="happy" class="status-happy">
				<img :src="secondaryIconUrl" class="secondary-icon" />
			</div>
			<div v-if="sad" class="status-sad">
				<img :src="secondaryIconUrl" class="secondary-icon" />
			</div>
			<div v-if="custom && secondaryLogo" class="status-custom" :style="cssVars">
				<img :src="secondaryIconUrl" class="secondary-icon" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// TODO clean up this component
// Component to overlay status badge on icons, e.g. https://share.getcloudapp.com/GGuWoxx0

interface Props {
	happy?: boolean
	sad?: boolean
	custom?: boolean
	logo: string
	secondaryLogo: string
	bg?: string
}

const props = withDefaults(defineProps<Props>(), {
	bg: 'transparent',
})

const cssVars = computed(() => ({ background: props.bg }))
const logoImageUrl = new URL(`/src/assets/${props.logo}`, import.meta.url).href
const secondaryIconUrl = new URL(`/src/assets/${props.secondaryLogo}`, import.meta.url).href
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.icon-container {
	width: 2rem;
	height: 2rem;
	border-radius: 0.25rem;
	display: flex;
	justify-content: center;
	align-items: center;
}

.logo {
	width: 1.25rem;
	height: 1.25rem;
	position: absolute;
}

.secondary-icon {
	width: 0.5rem;
	height: 0.5rem;
}

.status-happy {
	background: $clr-green;
	padding: 0.125rem;
	border-radius: 2rem;
	height: 0.5rem;
	display: flex;
	align-items: center;
	justify-content: center;
}

.status-sad {
	background: var(--attention-color);
	padding: 0.125rem;
	border-radius: 2rem;
	height: 0.5rem;
	display: flex;
	align-items: center;
	justify-content: center;
}

.status-custom {
	background: var(--bg);
	border-radius: 2rem;
	padding: 0.125rem;
	height: 0.5rem;
	display: flex;
	align-items: center;
	justify-content: center;
}

.background {
	position: relative;
	top: -0.5rem;
	right: -0.5rem;
	background: var(--bg-secondary-color);
	padding: 2px;
	border-radius: 2rem;
}
</style>

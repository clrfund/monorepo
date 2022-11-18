<template>
	<a
		v-if="isExternal"
		:class="{ 'external-link': !hideArrow }"
		:href="to"
		:aria-label="ariaLabel"
		target="_blank"
		rel="noopener"
	>
		<slot />
	</a>
	<router-link v-else :to="to" :aria-label="ariaLabel">
		<slot />
	</router-link>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
	to: string
	hideArrow?: boolean
	ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
	hideArrow: false,
	ariaLabel: '',
})

const isExternal = ref(false)

if (typeof props.to === 'string') {
	isExternal.value = props.to.includes('http') || props.to.includes('mailto:')
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.external-link {
	&:after {
		margin-left: 0.125em;
		margin-right: 0.3em;
		display: inline;
		content: '↗';
		transition: all 0.1s ease-in-out;
		font-style: normal;
	}
	&:hover {
		&:after {
			transform: translate(0.1em, -0.1em);
		}
	}
}
</style>

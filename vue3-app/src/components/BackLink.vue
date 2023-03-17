<template>
	<links
		:to="to"
		:class="{
			back: true,
			desktop: !alsoShowOnMobile,
		}"
		>{{ text }}</links
	>
</template>

<script setup lang="ts">
import Links from '@/components/Links.vue'

interface Props {
	alsoShowOnMobile: boolean
	to: string
	text: string
}

defineProps<Props>()
</script>

<style lang="scss" scoped>
.back {
	position: relative;
	display: flex;
	flex: 1 0 auto;
	justify-content: flex-start;
	align-items: center;
	padding: 1rem;
	color: var(--text-color);
	&:hover {
		opacity: 0.8;
	}
}
</style>

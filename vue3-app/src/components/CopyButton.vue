<template>
	<div
		v-tooltip="{
			content: isCopied ? 'Copied!' : `Copy${text && ` ${text}`}`,
			hideOnTargetClick: false,
			triggers: ['hover', 'click'],
		}"
		:class="`${myClass || 'copy-icon'} ${hasBorder && 'border'}`"
		@click="copyToClipboard"
	>
		<img width="16px" src="@/assets/copy.svg" />
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
	value: string // Required: Text to copy
	text?: string // Optional: Fills in "Copy ____" in tooltip
	position?: string // Optional: Position of tooltip (default "bottom")
	myClass?: string // Optional class override for custom styling
	hasBorder?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits(['copied'])

const isLoading = ref(false)
const isCopied = ref(false)

async function copyToClipboard(): Promise<void> {
	isLoading.value = true
	try {
		await navigator.clipboard.writeText(props.value)
		isLoading.value = false
		isCopied.value = true
		emit('copied', true)
		await new Promise(resolve => setTimeout(resolve, 1000))
		isCopied.value = false
		emit('copied', false)
	} catch (error) {
		isLoading.value = false
		if (import.meta.env.MODE !== 'production') {
			/* eslint-disable-next-line no-console */
			console.warn('Error in copying text: ', error)
		}
	}
}
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.copy-icon {
	@include icon(none, none);
}

.ipfs-copy-widget,
.project-profile {
	@include icon(none, var(--bg-light-color));
}

.profile {
	@include icon(rgba(white, 0.1), rgba(white, 0.2));
	padding: 0.5rem;
}

.border {
	border: 1px solid var(--text-color);
}

img {
	filter: var(--img-filter, invert(0.7));
}
</style>

<template>
	<div class="markdown" v-html="body"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { markdown } from '@/utils/markdown'

interface Props {
	raw: string
}

const props = defineProps<Props>()

const body = computed<string>(() => markdown.render(props.raw))
</script>

<style scoped lang="scss">
.markdown {
	overflow-wrap: break-word;
	:deep() {
		h1,
		h2,
		h3,
		h4,
		h5,
		h6 {
			font-size: 1rem;
			font-weight: 600;
			margin: 1.5rem 0;
			line-height: 150%;
		}
		p {
			line-height: 150%;
		}
		img {
			display: block;
			max-width: 100%;
			height: auto;
		}
		pre {
			white-space: pre-wrap;
		}
	}
}
</style>

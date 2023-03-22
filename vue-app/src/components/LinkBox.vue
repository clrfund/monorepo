<template>
	<div class="link-box">
		<h2 class="link-title">Check them out</h2>
		<div v-if="project.githubUrl" class="link-row">
			<img src="@/assets/GitHub.svg" />
			<links :to="project.githubUrl">GitHub repo</links>
		</div>
		<div v-if="project.twitterUrl" class="link-row">
			<img src="@/assets/Twitter.svg" />
			<links :to="project.twitterUrl">@Twitter</links>
		</div>
		<div v-if="project.websiteUrl" class="link-row">
			<img src="@/assets/Meridians.svg" />
			<links :to="project.websiteUrl">{{ project.websiteUrl }}</links>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { Project } from '@/api/projects'
import Links from '@/components/Links.vue'

interface Props {
	project: Project
}

defineProps<Props>()
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.link-box {
	background: var(--bg-primary-color);
	padding: 1.5rem;
	border-radius: 1rem;
	box-shadow: var(--box-shadow);
	overflow-wrap: anywhere;

	.link-title {
		font-size: 1.5rem;
		margin: 0;
		margin-bottom: 1rem;
		font-family: 'Glacial Indifference', sans-serif;
	}

	.link-row {
		display: flex;
		align-items: center;
		padding: 0.5rem;
		gap: 0.5rem;
	}
}
</style>

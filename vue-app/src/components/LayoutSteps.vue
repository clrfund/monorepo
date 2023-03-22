<template>
	<div class="layout-steps">
		<slot />
	</div>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.layout-steps {
	display: flex;
	justify-content: center;
	align-items: flex-start;
	margin: 0rem 16rem;
	margin-bottom: 8rem;

	@media (max-width: $breakpoint-m) {
		display: block;
		margin: 0;
	}
}
</style>

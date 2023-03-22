<template>
	<div class="item">
		<div class="icon">
			<div class="icon img"><slot></slot></div>
		</div>
		<div class="main">
			<div v-if="abbrev" class="token-abbrev">
				{{ abbrev }}
			</div>
		</div>
		<div class="amount">
			{{ balance }}
		</div>
	</div>
</template>

<script setup lang="ts">
interface Props {
	abbrev: string
	balance: string
}

defineProps<Props>()
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.item {
	display: flex;
	align-items: center;
	padding: 1rem;
	border: 1px solid #000000;
	margin-top: -1px;
	&:first-of-type {
		margin-top: 0px;
		border-radius: 8px 8px 0 0;
	}
	&:last-of-type {
		border-radius: 0 0 8px 8px;
	}
}
.icon {
	.img {
		width: 1.5rem;
		height: 1.5rem;
		margin-right: 1rem;
	}
}

.main {
	flex: 1;
}

.amount {
	margin: 0;
}

.token-abbrev {
	font-weight: 600;
}
</style>

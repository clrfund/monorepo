<template>
	<div :class="`tab-container ${isOnCartOrRoundPage ? 'mobile-l' : 'mobile'}`">
		<links
			v-for="({ iconUrl, title, to }, idx) of tabs"
			:key="idx"
			:class="{
				'tab-item': true,
				active: activeTab === to,
			}"
			:to="to"
		>
			<div class="icon">
				<img :src="iconUrl" :alt="title" width="16" />
				<transition name="pulse" mode="out-in">
					<div
						v-if="title === 'Cart' && isCartBadgeShown"
						:key="cart.length"
						:class="[cart.length ? 'circle cart-indicator' : 'cart-indicator']"
					>
						{{ cart.length }}
					</div>
				</transition>
			</div>
			<span class="tab-title">{{ title }}</span>
		</links>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CartItem } from '@/api/contributions'
import Links from '@/components/Links.vue'
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'

const route = useRoute()
const appStore = useAppStore()
const { hasReallocationPhaseEnded, committedCart, canUserReallocate, isRoundContributionPhase } = storeToRefs(appStore)

const tabs = ref([
	{
		iconUrl: new URL('/src/assets/timer.svg', import.meta.url).href,
		title: 'Round',
		to: '/round-information',
	},
	{
		iconUrl: new URL('/src/assets/projects.svg', import.meta.url).href,
		title: 'Projects',
		to: '/projects',
	},
	{
		iconUrl: new URL('/src/assets/cart.svg', import.meta.url).href,
		title: 'Cart',
		to: '/cart',
	},
])

const cart = computed<CartItem[]>(() => {
	return appStore.cart
})

const isCartEmpty = computed(() => {
	return cart.value.length === 0
})

const activeTab = computed(() => {
	return route.path
})

const filteredCart = computed(() => {
	// Once reallocation phase ends, use committedCart for cart items
	if (hasReallocationPhaseEnded.value) {
		return committedCart
	}

	// Hide cleared items
	return cart.value.filter(item => !item.isCleared)
})

const isCartBadgeShown = computed(() => {
	/**
	 * Only show cart badge counter if there are new/changed items present
	 * and the user is still able to contribute/reallocate these changes.
	 */
	return (canUserReallocate.value || isRoundContributionPhase.value) && !isCartEmpty.value
})

const isOnCartOrRoundPage = computed(() => {
	return route.name === 'cart' || route.name === 'round-information'
})
</script>

<style lang="scss" scoped>
@import '../styles/vars';
@import '../styles/theme';

.tab-container {
	position: fixed;
	bottom: 0;
	width: 100%;
	height: 4rem;
	background: var(--bg-light-color);
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	align-items: center;
}

.tab-item {
	width: 100%;
	height: 100%;
	display: grid;
	place-items: center;
	padding-top: 0.25rem;
}

.tab-title {
	margin: 0.25rem;
	line-height: 0;
	margin-top: -0.75rem;
	font-size: 14px;
	text-transform: uppercase;
	color: var(--text-color);
}

.cart-indicator {
	border-radius: 2rem;
	background: $gradient-highlight;
	padding: 0.25rem;
	font-size: 10px;
	color: var(--text-color);
	line-height: 100%;
	width: 8px;
	height: 8px;
	display: flex;
	justify-content: center;
	align-items: center;
}

.icon {
	display: flex;
	gap: 0.25rem;
}

.active {
	background: var(--bg-secondary-color);
	box-shadow: inset 0px 2px 0px $border-light;
}

.circle {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	margin-right: 0.5rem;
}

.pulse-enter-active {
	animation: pulse-animation 2s 1 ease-out;
}

@keyframes pulse-animation {
	0% {
		box-shadow: 0 0 0 0px $idle-color;
	}

	100% {
		box-shadow: 0 0 0 4px $clr-pink;
	}
}
</style>

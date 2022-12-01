<template>
	<div
		v-if="currentUser"
		:class="{
			container: showCartPanel,
			'collapsed-container': !showCartPanel,
		}"
	>
		<div v-if="!showCartPanel" class="toggle-btn desktop" @click="toggleCart">
			<img alt="open" width="16" src="@/assets/chevron-left.svg" />
			<transition name="pulse" mode="out-in">
				<div
					v-if="!showCartPanel && isCartBadgeShown"
					:key="cart.length"
					:class="[cart.length ? 'circle cart-indicator' : 'cart-indicator']"
				>
					{{ cart.length }}
				</div>
			</transition>
			<img alt="cart" width="16" src="@/assets/cart.svg" />
		</div>
		<cart v-if="showCartPanel" class="cart-component" />
		<div v-if="!showCartPanel" class="collapsed-cart desktop" />
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Cart from '@/components/Cart.vue'
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'
import { useEthers, useWallet } from 'vue-dapp'

const appStore = useAppStore()
const {
	cart,
	currentUser,
	hasReallocationPhaseEnded,
	committedCart,
	showCartPanel,
	isRoundContributionPhase,
	canUserReallocate,
} = storeToRefs(appStore)

const { provider } = useEthers()
const { onDisconnect, onChainChanged } = useWallet()

const profileImageUrl = ref<string | null>(null)

const isCartBadgeShown = computed(() => {
	/**
	 * Only show cart badge counter if there are new/changed items present
	 * and the user is still able to contribute/reallocate these changes.
	 */
	return (canUserReallocate.value || isRoundContributionPhase.value) && !!cart.value.length
})

const isCartEmpty = computed(() => {
	return cart.value.length === 0
})

const filteredCart = computed(() => {
	// Once reallocation phase ends, use committedCart for cart items
	if (hasReallocationPhaseEnded.value) {
		return committedCart.value
	}

	return cart.value.filter(item => !item.isCleared)
})

const truncatedAddress = computed(() => {
	if (currentUser.value?.walletAddress) {
		const address: string = currentUser.value.walletAddress
		const begin: string = address.substr(0, 6)
		const end: string = address.substr(address.length - 4, 4)
		const truncatedAddress = `${begin}…${end}`
		return truncatedAddress
	}
	return ''
})

function toggleCart(): void {
	appStore.toggleShowCartPanel()
}

onDisconnect(() => {
	appStore.logoutUser()
})

// TODO: refactor, move `chainChanged` and `accountsChanged` from here to an
// upper level where we hear this events only once (there are other
// components that do the same).
onChainChanged(() => {
	if (currentUser.value) {
		// Log out user to prevent interactions with incorrect network
		appStore.logoutUser()
	}
})
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.container {
	position: relative;
	height: 100%;
	box-sizing: border-box;
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

.circle {
	width: 8px;
	height: 8px;
	border-radius: 50%;
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

.collapsed-container {
	height: 100%;
}

.cart {
	position: relative;
}

.collapsed-cart {
	position: absolute;
	top: 0;
	right: 0;
	height: 100%;
	width: $cart-width-closed;
	background: var(--bg-secondary-color);
	z-index: 0;
}

.toggle-btn {
	box-sizing: border-box;
	position: absolute;
	top: 1.875rem;
	right: 0;
	width: fit-content;
	z-index: 1;
	border-radius: 0.5rem 0 0 0.5rem;
	display: flex;
	justify-content: flex-end;
	font-size: 16px;
	align-items: center;
	cursor: pointer;
	gap: 0.5rem;
	padding: 0.75rem 0.5rem;
	color: var(--text-color);
	background: var(--bg-cart);
	border: 1px solid rgba($border-light, 0.3);
	border-right: none;
	&:hover {
		background: var(--bg-secondary-color);
		gap: 0.75rem;
	}

	img {
		filter: var(--img-filter, invert(0.7));
	}
}

.provider-error {
	text-align: center;
}
</style>

<template>
	<div id="app" class="wrapper">
		<nav-bar :in-app="isInApp" />
		<div v-if="appReady" id="content-container">
			<div v-if="isSidebarShown" id="sidebar" :class="`${showCartPanel ? 'desktop-l' : 'desktop'}`">
				<round-information />
			</div>
			<div
				id="content"
				:class="{
					padded: isVerifyStep || (isSidebarShown && !isCartPadding),
					'mr-cart-open': isCartToggledOpen && isSideCartShown,
					'mr-cart-closed': !isCartToggledOpen && isSideCartShown,
				}"
			>
				<breadcrumbs v-if="showBreadCrumb" />
				<router-view :key="route.path" />
			</div>
			<div v-if="isSideCartShown" id="cart" :class="`desktop ${isCartToggledOpen ? 'open-cart' : 'closed-cart'}`">
				<cart-widget />
			</div>
		</div>
		<mobile-tabs v-if="isMobileTabsShown" />
	</div>
	<!-- vue-dapp -->
	<vd-board :connectors="connectors" dark />
	<!-- vue-final-modal -->
	<modals-container></modals-container>
</template>

<script setup lang="ts">
import RoundInformation from '@/views/RoundInformation.vue'
import NavBar from '@/components/NavBar.vue'
import CartWidget from '@/components/CartWidget.vue'
import MobileTabs from '@/components/MobileTabs.vue'
import Breadcrumbs from '@/components/Breadcrumbs.vue'
// @ts-ignore
import { ModalsContainer } from 'vue-final-modal'

import { getOsColorScheme } from '@/utils/theme'
import { getCurrentRound } from '@/api/round'
import type { User } from '@/api/user'
import { operator, provider, connectors } from '@/api/core'
import { useAppStore } from '@/stores/app'
import { sha256 } from '@/utils/crypto'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useEthersHooks, useWallet } from 'vue-dapp'
import { useMeta } from 'vue-meta'

const route = useRoute()
const appStore = useAppStore()
const { wallet } = useWallet()
const { onActivated } = useEthersHooks()

// https://stackoverflow.com/questions/71785473/how-to-use-vue-meta-with-vue3
// https://www.npmjs.com/package/vue-meta/v/3.0.0-alpha.7
useMeta({
	title: route.meta.title,
	titleTemplate: `${operator} - %s`,
	meta: [
		{
			name: 'git-commit',
			content: import.meta.env.VITE_GIT_COMMIT || '',
		},
	],
})

// state
const { theme, isCartToggledOpen, showCartPanel, currentUser, currentRound } = storeToRefs(appStore)
const routeName = computed(() => route.name?.toString() || '')
const isUserAndRoundLoaded = computed(() => !!currentUser.value && !!currentRound.value)
const isInApp = computed(() => routeName.value !== 'landing')
const isVerifyStep = computed(() => routeName.value === 'verify-step')
const isSideCartShown = computed(() => !!currentUser.value && isSidebarShown.value && routeName.value !== 'cart')
const isCartPadding = computed(() => {
	const routes = ['cart']
	return routes.includes(routeName.value)
})
const isSidebarShown = computed(() => {
	const excludedRoutes = [
		'landing',
		'project-added',
		'join',
		'join-step',
		'round-information',
		'transaction-success',
		'verify',
		'verify-step',
		'verified',
		'sponsored',
	]
	return !excludedRoutes.includes(routeName.value)
})
const isMobileTabsShown = computed(() => {
	const excludedRoutes = [
		'landing',
		'project-added',
		'join',
		'join-step',
		'transaction-success',
		'verify',
		'verify-step',
		'verified',
		'sponsored',
	]
	return !excludedRoutes.includes(routeName.value)
})
const showBreadCrumb = computed(() => {
	const excludedRoutes = [
		'landing',
		'join',
		'join-step',
		'transaction-success',
		'verify',
		'project-added',
		'verified',
	]
	return !excludedRoutes.includes(routeName.value)
})

watch(theme, () => {
	const savedTheme = theme.value
	document.documentElement.setAttribute('data-theme', savedTheme || getOsColorScheme())
})

const appReady = ref(false)

onMounted(async () => {
	console.log('App mounted')

	// to check provider works
	try {
		const network = await Promise.race([
			provider.getNetwork(),
			new Promise<void>((_, reject) =>
				setTimeout(() => {
					reject('Error: cound not detect network: 3 seconds of timed out')
				}, 3000),
			),
		])
		console.log(network)
	} catch (err) {
		console.error('Failed to detect network', err)
		return
	}

	try {
		const roundAddress = appStore.currentRoundAddress || (await getCurrentRound())

		if (roundAddress) {
			appStore.selectRound(roundAddress)
		} else {
			throw new Error('Failed to get round address')
		}
		console.log('roundAddress', roundAddress)
	} catch (err) {
		console.error('Failed to get current round', err)
		return
	}

	appReady.value = true

	// await appStore.loadUserInfo()
	try {
		await appStore.loadRoundInfo()
	} catch (err) {
		console.error(err)
	}
	// await appStore.loadFactoryInfo()
	// await appStore.loadMACIFactoryInfo()
	// await appStore.loadRecipientRegistryInfo()
})

onActivated(async ({ address, provider }) => {
	console.log('onActivated')
	// let signature
	// if (!wallet.connector) throw new Error('Failed to activate wallet')
	// if (wallet.connector.name === 'metaMask') {
	// 	const metamask = wallet.provider as MetaMaskProvider
	// 	signature = await metamask.request({
	// 		method: 'personal_sign',
	// 		params: [LOGIN_MESSAGE, address],
	// 	})
	// } else if (wallet.connector.name === 'walletConnect') {
	// 	const walletconnect = wallet.provider as IWalletConnectProvider
	// 	signature = await walletconnect.send('personal_sign', [LOGIN_MESSAGE, address])
	// } else {
	// 	throw new Error('Wallet not supported')
	// }

	const user: User = {
		isRegistered: false,
		encryptionKey: sha256('signature'),
		balance: null,
		contribution: null,
		walletProvider: provider,
		walletAddress: address,
	}
	// Connect & auth to gun db
	try {
		// await appStore.loginUser(address, user.encryptionKey)
	} catch (err) {
		console.error(err)
		return
	}
	appStore.setCurrentUser(user)
	appStore.loadUserInfo()
	appStore.loadBrightID()
})

// watch(isUserAndRoundLoaded, () => {
// 	if (!isUserAndRoundLoaded.value) {
// 		return
// 	}

// 	appStore.loadUserInfo()

// 	// Load cart & contributor data for current round
// 	appStore.loadCart()
// 	appStore.loadCommittedCart()
// 	appStore.loadContributorData()
// })
</script>

<style lang="scss">
@import 'styles/vars';
@import 'styles/fonts';
@import 'styles/theme';

/**
 * Global styles
 */
html,
body {
	height: 100%;
	margin: 0;
}

html {
	background-color: var(--bg-primary-color);
	color: var(--text-color);
	font-family: Inter, sans-serif;
	font-size: 16px;
}

a {
	color: var(--link-color);
	cursor: pointer;
	text-decoration: none;
}

textarea {
	resize: vertical;
	border-end-end-radius: 0 !important;
}

.mobile {
	@media (min-width: ($breakpoint-m + 1px)) {
		display: none !important;
	}
}

.mobile-l {
	@media (min-width: ($breakpoint-l + 1px)) {
		display: none !important;
	}
}

.desktop {
	@media (max-width: $breakpoint-m) {
		display: none !important;
	}
}

.desktop-l {
	@media (max-width: $breakpoint-l) {
		display: none !important;
	}
}

.caps {
	text-transform: uppercase;
}

.btn-container {
	display: flex;
	gap: 1rem;
	@media (max-width: $breakpoint-m) {
		flex-direction: column;
	}
}

summary:focus {
	outline: none;
}

.wrapper {
	min-height: 100%;
	position: relative;
}

.input {
	background-color: var(--bg-light-color);
	border: 2px solid $button-color;
	border-radius: 2px;
	box-sizing: border-box;
	color: var(--text-color);
	font-family: Inter, sans-serif;
	font-size: 16px;
	padding: 7px;

	&.invalid {
		border-color: var(--error-color);
	}

	&::placeholder {
		opacity: 0.5;
	}

	&:focus {
		outline: none;
	}
}

.btn {
	background-color: $button-color;
	border: none;
	border-radius: 20px;
	color: var(--text-color);
	cursor: pointer;
	font-weight: bold;
	line-height: 22px;
	padding: 6px 20px 8px;

	img {
		height: 1em;
		margin: 0 10px 0 0;
		vertical-align: middle;
	}

	&:hover {
		background-color: $highlight-color;
		color: var(--bg-secondary-color);
	}

	&[disabled],
	&[disabled]:hover {
		background-color: $button-disabled-color !important;
		color: $button-disabled-color !important;
		cursor: not-allowed;
	}
}

.btn-inactive {
	background-color: transparent;
	border: 2px solid $button-color;
	color: $button-color;
	padding: (6px - 2px) (20px - 2px) (8px - 2px);

	&:hover {
		background-color: transparent;
		color: $button-color;
	}
}

#app {
	display: flex;
	flex-direction: column;
	min-height: 100%;
}

#content-container {
	display: flex;
	/* height: calc(100vh - 61.5px); */
	height: 100%;
	background: var(--bg-primary-color);
	overflow-x: clip;
	/* overflow-y: scroll; */
}

#sidebar {
	box-sizing: border-box;
	background-color: var(--bg-primary-color);
	flex-shrink: 0;
	padding: 1.5rem;
	width: $cart-width-open;
	height: 100%;
	position: sticky;
	top: 1.5rem;

	.status {
		font-size: 16px;
		display: flex;
		align-items: center;
	}

	.round-info-div {
		background: var(--bg-light-color);
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 2rem;
	}

	.clr-logo {
		display: block;
		/* max-height: 100%; */
	}

	.menu-btn,
	.cart-btn {
		display: none;
		margin-right: 0.5rem;
	}
}

#cart {
	position: fixed;
	right: 0;
	top: $nav-header-height;
	bottom: 0;
}

.open-cart {
	width: $cart-width-open;
	overflow-y: scroll;
	overflow-x: hidden;
}

.closed-cart {
	width: 4rem;
}

#nav-menu {
	/* margin-left: 15%;
  padding: 50px 5% 0; */

	a {
		color: var(--text-color);
		display: block;
		font-size: 16px;
		margin-bottom: $content-space;
		text-decoration: none;

		&:hover {
			color: $highlight-color;
		}

		&.router-link-exact-active {
			color: $highlight-color;
			font-weight: bold;
			position: relative;

			&::before {
				border: 2px solid $highlight-color;
				border-radius: 10px;
				bottom: 0;
				box-sizing: border-box;
				content: '';
				display: block;
				height: 0.75em;
				left: -25px;
				position: absolute;
				top: 0.2em;
				width: 0.75em;
			}
		}
	}
}

#content {
	flex: 1;
	padding-bottom: 4rem;

	.content-heading {
		display: block;
		font-family: 'Glacial Indifference', sans-serif;
		font-size: 16px;
		font-weight: normal;
		letter-spacing: 6px;
		margin: 0;
		padding-bottom: $content-space;
		text-transform: uppercase;
	}

	.title {
		padding-bottom: 1.5rem;
		margin-bottom: 2rem;
	}
}

#content.padded {
	padding: $content-space;
}

#content.mr-cart-open {
	margin-right: $cart-width-open;
	@media (max-width: $breakpoint-m) {
		margin-right: 0;
	}
}

#content.mr-cart-closed {
	margin-right: $cart-width-closed;
	@media (max-width: $breakpoint-m) {
		margin-right: 0;
	}
}

.verified {
	background: $gradient-highlight;
	height: 16px;
	width: 16px;
	border-radius: 50%;
	justify-content: center;
	align-items: center;
	display: flex;
	margin-left: 0.5rem;
}

.vm--overlay {
	background-color: rgba(black, 0.5) !important;
}

.vm--modal {
	background-color: transparent !important;
	box-shadow: none !important;
	overflow: visible !important;
}

.modal-body {
	background-color: var(--bg-light-color);
	padding: $modal-space;
	text-align: center;
	box-shadow: var(--box-shadow);

	.loader {
		margin: $modal-space auto;
	}
}

.hidden {
	display: none;
}

.invisible {
	visibility: hidden;
}

.error {
	color: var(--error-color);
	margin-bottom: 0;
	margin-top: 0.5rem;
	font-size: 14px;
	&:before {
		content: '⚠️ ';
	}
}

.pointer {
	cursor: pointer;
}

@media (max-width: $breakpoint-m) {
	#app {
		flex-direction: column;
		position: relative;
	}

	#sidebar {
		/* bottom: $profile-image-size + $content-space * 2; offset for profile block */
		border-right: none;
		max-width: 100vw;
		position: fixed;
		top: 0;
		width: 100%;
		/* height: 64px; */
		z-index: 2;

		.clr-logo {
			margin-right: 0.5rem;
		}

		.menu-btn,
		.cart-btn {
			display: block;
			min-width: 25px;
			max-width: 20%;
			width: 25px;
		}

		.menu-btn {
			margin-right: 5%;
		}

		.cart-btn {
			margin-left: 5%;
		}
	}

	#nav-header {
		display: flex;
		align-items: center;
	}

	#footer {
		max-width: 100vw;
		padding: $content-space;
		> li {
			list-style-type: none;
		}
	}
}

.tooltip {
	display: block !important;
	z-index: 10000;

	.tooltip-inner {
		background: var(--bg-primary-color);
		color: var(--text-color);
		font-family: Inter;
		line-height: 150%;
		font-size: 14px;
		border: 1px solid $button-color;
		border-radius: 0.5rem;
		padding: 5px 10px 4px;
		max-width: 30ch;
		text-align: center;
	}

	.tooltip-arrow {
		width: 0;
		height: 0;
		border-style: solid;
		position: absolute;
		margin: 5px;
		border-color: $button-color;
		z-index: 1;
	}

	&[x-placement^='top'] {
		margin-bottom: 5px;

		.tooltip-arrow {
			border-width: 5px 5px 0 5px;
			border-left-color: transparent !important;
			border-right-color: transparent !important;
			border-bottom-color: transparent !important;
			bottom: -5px;
			left: calc(50% - 5px);
			margin-top: 0;
			margin-bottom: 0;
		}
	}

	&[x-placement^='bottom'] {
		margin-top: 5px;

		.tooltip-arrow {
			border-width: 0 5px 5px 5px;
			border-left-color: transparent !important;
			border-right-color: transparent !important;
			border-top-color: transparent !important;
			top: -5px;
			left: calc(50% - 5px);
			margin-top: 0;
			margin-bottom: 0;
		}
	}

	&[x-placement^='right'] {
		margin-left: 5px;

		.tooltip-arrow {
			border-width: 5px 5px 5px 0;
			border-left-color: transparent !important;
			border-top-color: transparent !important;
			border-bottom-color: transparent !important;
			left: -5px;
			top: calc(50% - 5px);
			margin-left: 0;
			margin-right: 0;
		}
	}

	&[x-placement^='left'] {
		margin-right: 5px;

		.tooltip-arrow {
			border-width: 5px 0 5px 5px;
			border-top-color: transparent !important;
			border-right-color: transparent !important;
			border-bottom-color: transparent !important;
			right: -5px;
			top: calc(50% - 5px);
			margin-left: 0;
			margin-right: 0;
		}
	}

	&.popover {
		.popover-inner {
			background: var(--bg-primary-color);
			color: var(--text-color);
			padding: 1rem;
			margin: 0.5rem;
			border-radius: 5px;
			box-shadow: 0 5px 30px rgba(black, 0.1);
		}

		.popover-arrow {
			border-color: var(--bg-primary-color);
		}
	}

	&[aria-hidden='true'] {
		visibility: hidden;
		opacity: 0;
		transition: opacity 0.15s, visibility 0.15s;
	}

	&[aria-hidden='false'] {
		visibility: visible;
		opacity: 1;
		transition: opacity 0.15s;
	}
}
</style>

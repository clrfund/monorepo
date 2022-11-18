<template>
	<nav id="nav-bar">
		<links to="/">
			<img class="clr-logo" :alt="operator" src="@/assets/clr.svg" />
		</links>
		<div class="btn-row">
			<div>
				<img @click="toggleTheme()" class="navbar-btn" :src="require(`@/assets/${themeIcon}`)" />
			</div>
			<div class="help-dropdown" v-click-outside="closeHelpDropdown">
				<img @click="toggleHelpDropdown()" class="navbar-btn" src="@/assets/help.svg" />
				<div id="myHelpDropdown" class="button-menu" v-if="showHelpDropdown">
					<div
						v-for="({ to, text, emoji }, idx) of dropdownItems"
						:key="idx"
						class="dropdown-item"
						@click="closeHelpDropdown"
					>
						<links :to="to">
							<div class="emoji-wrapper">{{ emoji }}</div>
							<p class="item-text">{{ text }}</p>
						</links>
					</div>
				</div>
			</div>
			<wallet-widget class="wallet-widget" v-if="inApp" />
			<links v-if="!inApp" to="/projects" class="app-btn">App</links>
		</div>
	</nav>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'

import WalletWidget from './WalletWidget.vue'
import CartWidget from './CartWidget.vue'
import Links from './Links.vue'
import { chain, ThemeMode } from '@/api/core'
import { lsGet, lsSet } from '@/utils/localStorage'
import { isValidTheme, getOsColorScheme } from '@/utils/theme'
// import ClickOutside from '@/directives/ClickOutside'
import { useAppStore } from '@/store/app'
import { storeToRefs } from 'pinia'

const appStore = useAppStore()
const { operator } = storeToRefs(appStore)
// directives: {
// 	ClickOutside,
// },

interface Props {
	inApp: any
}

const props = defineProps<Props>()

const showHelpDropdown = ref(false)
const profileImageUrl = ref<string | null>(null)
const dropdownItems = ref<{ to?: string; text: string; emoji: string }[]>([
	{ to: '/', text: 'Home', emoji: '🏠' },
	{ to: '/about', text: 'About', emoji: 'ℹ️' },
	{ to: '/about/how-it-works', text: 'How it works', emoji: '⚙️' },
	{ to: '/about/maci', text: 'Bribery protection', emoji: '🤑' },
	{ to: '/about/sybil-resistance', text: 'Sybil resistance', emoji: '👤' },
	{
		to: 'https://github.com/clrfund/monorepo/',
		text: 'Code',
		emoji: '👾',
	},
	{
		to: '/recipients',
		text: 'Recipients',
		emoji: '🚀',
	},
])

onMounted(() => {
	const savedTheme = lsGet(themeKey.value)
	const theme = isValidTheme(savedTheme) ? savedTheme : getOsColorScheme()
	appStore.toggleTheme(theme)

	if (chain.isLayer2) {
		dropdownItems.value.splice(-1, 0, {
			to: '/about/layer-2',
			text: 'Layer 2',
			emoji: '🚀',
		})
	}
})

function closeHelpDropdown(): void {
	showHelpDropdown.value = false
}

function toggleHelpDropdown(): void {
	showHelpDropdown.value = !showHelpDropdown.value
}

function toggleTheme(): void {
	appStore.toggleTheme()
	lsSet(themeKey.value, appStore.theme)
}

const themeIcon = computed<string>(() => {
	return appStore.theme === ThemeMode.LIGHT ? 'half-moon.svg' : 'sun.svg'
})

const themeKey = computed<string>(() => 'theme')
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

#nav-bar {
	position: sticky;
	top: 0;
	z-index: 2;
	display: flex;
	padding: 0 1.5rem;
	height: 64px;
	justify-content: space-between;
	align-items: center;
	background: $clr-black;
	box-shadow: $box-shadow-nav-bar;
	@media (max-width: $breakpoint-m) {
		padding: 0 1rem;
	}

	.wallet-widget {
		margin-left: 0.5rem;
	}

	.btn-row {
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	.help-dropdown {
		position: relative;
		display: inline-block;
		margin-left: 0.5rem;

		.button-menu {
			display: flex;
			flex-direction: column;
			position: absolute;
			top: 2rem;
			right: 0.5rem;
			background: var(--bg-secondary-color);
			border: 1px solid rgba($border-light, 0.3);
			border-radius: 0.5rem;
			min-width: 160px;
			box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
			z-index: 1;
			cursor: pointer;
			overflow: hidden;

			@media (max-width: $breakpoint-s) {
				right: -4.5rem;
			}

			.dropdown-title {
				padding: 0.5rem;
				font-weight: 600;
			}

			.dropdown-item a {
				display: flex;
				align-items: center;
				padding: 0.5rem;
				gap: 0.5rem;
				width: 176px;
				&:after {
					color: var(--text-color);
				}
				&:hover {
					background: var(--bg-light-color);
				}

				.item-text {
					margin: 0;
					color: var(--text-color);
				}
			}
		}
	}

	.button-menu links {
		font-size: 16px;
	}

	.clr-logo {
		margin: 0;
		height: 2.25rem;
		vertical-align: middle;
	}

	.margin-right {
		margin-right: 0.5rem;
	}
}
</style>

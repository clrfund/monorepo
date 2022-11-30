<template>
	<div class="about">
		<h1 class="content-heading">About Layer 2</h1>

		<h2>Clr.fund on Layer 2</h2>
		<p>
			<b>
				tl;dr: clr.fund runs on
				<links to="https://ethereum.org/en/developers/docs/scaling/layer-2-rollups/"
					>Ethereum Layer 2 rollups</links
				>
				to help save you time and money when contributing to your favorite projects. You'll need a wallet with
				funds on {{ chain.label }} to interact with this application.
			</b>
		</p>
		<button v-if="chain.bridge" class="btn-secondary" @click="scrollToId('bridge')">Bridge Funds</button>

		<h2>Ethereum Transaction Costs</h2>
		<p>
			Ethereum, the blockchain that houses much of clr.fund's infrastructure, requires users to pay transaction
			costs when interacting with it, and these costs are going up. Transaction fees compensate the decentralized
			community of Ethereum miners for processing and maintaining the blockchain's state securely. As usage of
			Ethereum has gone up, so has the price of getting miner's to include your transaction on the blockchain.
		</p>
		<p>
			So, the increasing cost of using Ethereum demonstrates that it's useful, which is great, but it also
			presents a problem for end users who don't want to pay fees in the 10s or 100s of dollars.
		</p>

		<h2>Layer 2s for Scalability</h2>
		<p>
			The main Ethereum blockchain, "layer 1", may be upgraded to reduce costs in the future (this is one of the
			goals for the future of Ethereum, which clr.fund is helping realize!).
		</p>
		<p>
			In the immediate term, though, "layer 2" solutions are already helping dramatically reduce costs. Most layer
			2s are "rollups", blockchain-esque systems that are maintained, like Ethereum, by a decentralized group of
			nodes. Rollups periodically "roll up" all their recent transactions into a single transaction that is
			recorded on layer 1, Ethereum, allowing them to inherit much of Ethereum's security.
		</p>
		<p>
			Transactions on layer 2s are orders of magnitude cheaper than on layer 1, since rollups can process a high
			rate of transactions and transaction traffic is now diluted across the many layer 2 options.
		</p>
		<p>
			Read more on
			<links to="https://ethereum.org/en/developers/docs/scaling/layer-2-rollups/"
				>Ethereum Layer 2 technologies</links
			>.
		</p>
		<div v-if="chain.bridge" id="bridge" class="divider" />
		<!-- If chain is Arbitrum, display bridge information: -->
		<div v-if="chain.label.includes('Arbitrum')" class="chain-details">
			<h2>{{ chain.label }}</h2>
			<p>
				There are many variations on the layer 2 rollup approach. This current
				{{ operator }} round uses {{ chain.label }}, an "optimistic"-style rollup.
				<links to="https://developer.offchainlabs.com/docs/rollup_basics"
					>Learn more in the {{ chain.label }} docs</links
				>.
			</p>

			<h2>What you'll need</h2>
			<ul>
				<li>A wallet that supports {{ chain.label }}</li>
				<li>Funds on {{ chain.label }}</li>
			</ul>
			<h3>
				💼 How to find wallet that supports {{ chain.label }}
				<img
					v-tooltip="{
						content:
							'Wallet resources are provided as a convenience and do not represent endorsement of any of the projects or services therein. Always DYOR.',
						triggers: ['hover', 'click'],
					}"
					width="16"
					src="@/assets/info.svg"
				/>
			</h3>
			<ul>
				<li>
					Visit the official
					<links to="https://portal.arbitrum.one/"> {{ chain.label }} portal </links>
					and filter by "Wallets" to view some of the wallets that currently support the
					{{ chain.label }} network.
				</li>
				<li>
					Double-check that any wallet you consider
					<links to="https://registry.walletconnect.org/wallets"> also supports WalletConnect </links>
					to ensure you're able to connect to the app.
				</li>
			</ul>
			<h3>💰 How to get funds on {{ chain.label }}</h3>
			<p>
				<links :to="chain.bridge!" :hide-arrow="true">
					<button class="btn-action">Official {{ chain.label }} Bridge</button>
				</links>
			</p>
			<p>
				Follow the steps below, or use the
				<links to="https://arbitrum.io/bridge-tutorial/"> official tutorial </links>
				as a guide at any time.
			</p>
			<ol>
				<li>Click above to go to the official {{ chain.label }} bridge</li>
				<li>
					Connect your {{ chain.label }} supporting wallet using
					<strong>Mainnet</strong>
				</li>
				<li>
					Select currency (some ETH first for gas, and some
					{{ nativeTokenSymbol }} for contributing)
					<p>
						For {{ nativeTokenSymbol }}, click "Token" menu, search for
						{{ nativeTokenSymbol }}
						and select token.
					</p>
				</li>
				<li>Enter amount and click "Deposit"</li>
				<li>Confirm on your wallet</li>
			</ol>
			<p>
				Once you have bridged your {{ nativeTokenSymbol }} to {{ chain.label }}, you may want to add the
				<links :to="blockExplorerUrl">token</links> to your wallet e.g. in MetaMask.
			</p>
			<button v-if="currentUser && isMetaMask" class="btn-secondary" @click="addTokenToWallet">
				Add {{ chain.label }} {{ nativeTokenSymbol }} to MetaMask
			</button>
		</div>
		<!-- If chain isn't Arbitrum, but still has a bridge URL, display its information: -->
		<div v-else-if="chain.bridge">
			<h2>{{ chain.label }}</h2>
			<h2>What you'll need</h2>
			<ul>
				<li>A wallet that supports {{ chain.label }}</li>
				<li>Funds on {{ chain.label }}</li>
			</ul>
			<h2>💰 Bridge your funds to {{ chain.label }}</h2>
			<p>
				<links :to="chain.bridge" :hide-arrow="true">
					<button class="btn-action">{{ chain.label }} Bridge</button>
				</links>
			</p>
		</div>
	</div>
</template>

<script setup lang="ts">
import { chain } from '@/api/core'
import Links from '@/components/Links.vue'
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'

const appStore = useAppStore()

const { currentUser, nativeTokenAddress, nativeTokenSymbol, nativeTokenDecimals, operator } = storeToRefs(appStore)
const route = useRoute()

const windowEthereum = computed(() => (window as any).ethereum)
const isMetaMask = computed(() => windowEthereum.value.isMetaMask)
const blockExplorerUrl = computed(() => `${chain.explorer}/address/${nativeTokenAddress.value}`)

onMounted(() => {
	const { section: id } = route.params
	if (id) {
		scrollToId(id as string)
	}
})

function scrollToId(id: string): void {
	const element = document.getElementById(id)
	if (!element) return
	const navBarOffset = 80
	const elementPosition = element.getBoundingClientRect().top
	const top = elementPosition - navBarOffset
	window.scrollTo({ top, behavior: 'smooth' })
}

async function addTokenToWallet() {
	try {
		if (windowEthereum.value && isMetaMask.value) {
			await windowEthereum.value.request({
				method: 'wallet_watchAsset',
				params: {
					type: 'ERC20',
					options: {
						address: nativeTokenAddress.value,
						symbol: nativeTokenSymbol.value,
						decimals: nativeTokenDecimals.value,
					},
				},
			})
		}
	} catch (error) {
		/* eslint-disable-next-line no-console */
		console.log(error)
	}
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

button {
	margin: 2rem 0;

	@media (max-width: $breakpoint-s) {
		width: 100%;
	}
}
</style>

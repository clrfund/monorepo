<template>
  <div class="about">
    <h1 class="content-heading">About Layer 2</h1>

    <h2>Clr.fund on Layer 2</h2>
    <p>
      <b>
        tl;dr: clr.fund runs on
        <links
          to="https://ethereum.org/en/developers/docs/scaling/layer-2-rollups/"
          >Ethereum Layer 2 rollups</links
        >
        to help save you time and money when contributing to your favorite
        projects. You'll need a wallet with funds on {{ chainLabel }} to
        interact with this application.
      </b>
    </p>
    <button
      v-if="chainLabel.includes('Arbitrum')"
      class="btn-secondary"
      @click="scrollToId('arbitrum-bridge')"
    >
      Bridge Funds
    </button>

    <h2>Ethereum Transaction Costs</h2>
    <p>
      Ethereum, the blockchain that houses much of clr.fund's infrastructure,
      requires users to pay transaction costs when interacting with it, and
      these costs are going up. Transaction fees compensate the decentralized
      community of Ethereum miners for processing and maintaining the
      blockchain's state securely. As usage of Ethereum has gone up, so has the
      price of getting miner's to include your transaction on the blockchain.
    </p>
    <p>
      So, the increasing cost of using Ethereum demonstrates that it's useful,
      which is great, but it also presents a problem for end users who don't
      want to pay fees in the 10s or 100s of dollars.
    </p>

    <h2>Layer 2s for Scalability</h2>
    <p>
      The main Ethereum blockchain, "layer 1", may be upgraded to reduce costs
      in the future (this is one of the goals of Eth2, which this clr.fund round
      is helping realize!).
    </p>
    <p>
      In the immediate term, though, "layer 2" solutions are already helping
      dramatically reduce costs. Most layer 2s are "rollups", blockchain-esque
      systems that are maintained, like Ethereum, by a decentralized group of
      nodes. Rollups periodically "roll up" all their recent transactions into a
      single transaction that is recorded on layer 1, Ethereum, allowing them to
      inherit much of Ethereum's security.
    </p>
    <p>
      Transactions on layer 2s are orders of magnitude cheaper than on layer 1,
      since rollups can process a high rate of transactions and transaction
      traffic is now diluted across the many layer 2 options.
    </p>
    <p>
      Read more on
      <links
        to="https://ethereum.org/en/developers/docs/scaling/layer-2-rollups/"
        >Ethereum Layer 2 technologies</links
      >.
    </p>
    <!-- If chain is Arbitrum, display bridge information: -->
    <div
      v-if="chainLabel.includes('Arbitrum')"
      class="chain-details"
      id="arbitrum-bridge"
    >
      <div class="divider" />
      <h2>{{ chainLabel }}</h2>
      <p>
        There are many variations on the layer 2 rollup approach. This current
        clr.fund round uses {{ chainLabel }}, an "optimistic"-style rollup.
        <links to="https://developer.offchainlabs.com/docs/rollup_basics"
          >Learn more in the {{ chainLabel }} docs</links
        >.
      </p>

      <h2>What you'll need</h2>
      <ul>
        <li>A wallet that supports {{ chainLabel }}</li>
        <li>Funds on {{ chainLabel }}</li>
      </ul>
      <h3>How to find wallet that supports {{ chainLabel }}</h3>
      <p>TODO</p>
      <h3>💰 How to get funds on {{ chainLabel }}</h3>
      <p>
        <links :to="chainBridge" :hideArrow="true">
          <button class="btn-action">Official {{ chainLabel }} Bridge</button>
        </links>
      </p>
      <p>
        Follow the steps below, or use the
        <links to="https://arbitrum.io/bridge-tutorial/"
          >official tutorial</links
        >
        as a guide at any time.
      </p>
      <ol>
        <li>Click above to go to the official {{ chainLabel }} bridge</li>
        <li>
          Connect your {{ chainLabel }} supporting wallet using
          <strong>Mainnet</strong>
        </li>
        <li>
          Select currency (some ETH first for gas, and some
          {{ nativeToken.symbol }} for contributing)
          <p>
            For {{ nativeToken.symbol }}, click "Token" menu, search for
            {{ nativeToken.symbol }}
            and select token.
          </p>
        </li>
        <li>Enter amount & click "Deposit"</li>
        <li>Confirm on your wallet</li>
      </ol>
      <p>
        Once you have bridged your {{ nativeToken.symbol }} to {{ chainLabel }},
        you may want to add the <links :to="blockExplorerUrl">token</links> to
        your wallet e.g. in MetaMask.
      </p>
      <button
        v-if="currentUser"
        class="btn-secondary"
        @click="addTokenToWallet"
      >
        Add {{ chainLabel }} {{ nativeToken.symbol }} to wallet
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { CHAIN_INFO } from '@/plugins/Web3/constants/chains'
import { User } from '@/api/user'
import Links from '@/components/Links.vue'
import WalletWidget from '@/components/WalletWidget.vue'

@Component({ components: { Links, WalletWidget } })
export default class AboutLayer2 extends Vue {
  scrollToId(id: string): void {
    const element = document.getElementById(id)
    if (!element) return
    const navBarOffset = 80
    const elementPosition = element.getBoundingClientRect().top
    const top = elementPosition - navBarOffset
    window.scrollTo({ top, behavior: 'smooth' })
  }

  get windowEthereum(): any {
    return (window as any).ethereum
  }

  async addTokenToWallet() {
    try {
      if (this.windowEthereum) {
        await this.windowEthereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: this.nativeToken.address,
              symbol: this.nativeToken.symbol,
              decimals: this.nativeToken.decimals,
            },
          },
        })
      }
    } catch (error) {
      console.log(error)
    }
  }

  get currentUser(): User | null {
    return this.$store.state.currentUser
  }

  get chain(): any {
    return CHAIN_INFO[Number(process.env.VUE_APP_ETHEREUM_API_CHAINID)]
  }

  get chainLabel(): string {
    return CHAIN_INFO[Number(process.env.VUE_APP_ETHEREUM_API_CHAINID)].label
  }

  get chainBridge(): string | null {
    const { bridge } =
      CHAIN_INFO[Number(process.env.VUE_APP_ETHEREUM_API_CHAINID)]
    return bridge || null
  }

  get nativeToken(): { [key: string]: any } {
    const {
      nativeTokenSymbol: symbol,
      nativeTokenAddress: address,
      nativeTokenDecimals: decimals,
    } = this.$store.state.currentRound
    return { symbol, address, decimals }
  }

  get blockExplorerUrl(): string {
    return `${this.chain.explorer}address/${this.nativeToken.address}`
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

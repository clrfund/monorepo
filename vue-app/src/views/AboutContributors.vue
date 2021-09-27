<template>
  <div class="about">
    <h1 class="content-heading">Contributor guide</h1>
    <h2>Get funds on Arbitrum</h2>
    <p>
      You'll need some ETH on Arbitrum in order to submit transactions to the
      clr.fund smart contracts. Follow
      <links to="https://arbitrum.io/bridge-tutorial/">this tutorial</links> to
      bridge your funds to Arbitrum
    </p>
    <p>
      Confused on what Arbitrum is?
      <links to="/about/layer-2"
        >Read our explanation on how clr.fund uses layer 2 on Ethereum.</links
      >
    </p>
    <h2>Contributing to specific projects</h2>
    <ol>
      <li>
        Before contributing to specific projects, you will need to
        <links to="/verify">verify that you're a unique human</links>. This
        helps clr.fund
        <links to="/about/sybil-resistance">resist sybil attacks</links>!
      </li>
      <li>
        Make sure you have {{ nativeTokenSymbol }} in your BrightID-verified
        wallet on the {{ chainLabel }} network
      </li>
      <li>
        <links to="/projects">Browse projects</links> and add some to your cart,
        adjusting your contributions to the amount of
        {{ nativeTokenSymbol }} you want.
      </li>
      <li>
        When you're ready, open your cart, click contribute, and confirm the
        transactions to complete your contributions!
      </li>
    </ol>
    <p>
      Note: you can only contribute once. After submitting your contributions,
      you can reallocate them as much as you would like before the end of the
      reallocation phase but you cannot add more funds to your total
      contribution amount.
    </p>
    <ol>
      <li>You can add and remove projects.</li>
      <li>
        Your reallocation total must be less than or equal to the original total
        (if it's less, the rest will go to the matching pool).
      </li>
    </ol>
    <h2>Contributing to the matching pool</h2>
    <p>
      Not sure which specific to contribute to? Contributions to the matching
      pool will be distributed to all projects that receive project-specific
      contributions during that round. The weighting of this distribution is
      determined by the
      <links to="/about/quadratic-funding">quadratic funding</links> results
    </p>
    <ol>
      <li>
        First make sure the wallet you are using holds
        {{ nativeTokenSymbol }} on {{ chainLabel }}. {{ nativeTokenSymbol }} can
        be easily purchased on any major Ethereum-focused exchange.
      </li>
      <li>
        Once you have the desired amount of {{ nativeTokenSymbol }} in your
        wallet, select "Add Funds" on the
        <links to="/projects">Projects page</links> and confirm the
        transactions.
      </li>
    </ol>
    <p></p>
    <h2>How does clr.fund work?</h2>
    <p>
      Looking for a more general overview?
      <links to="/about/how-it-works">Check out our "How It Works" page</links>.
    </p>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Links from '@/components/Links.vue'

import { CHAIN_INFO } from '@/plugins/Web3/constants/chains'

@Component({ components: { Links } })
export default class AboutContributors extends Vue {
  get nativeTokenSymbol(): string {
    const { nativeTokenSymbol } = this.$store.state.currentRound
    return nativeTokenSymbol || 'DAI'
  }

  get chainLabel(): string {
    const chain = CHAIN_INFO[Number(process.env.VUE_APP_ETHEREUM_API_CHAINID)]
    return chain.label
  }
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';
</style>

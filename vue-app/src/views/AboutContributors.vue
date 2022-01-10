<template>
  <div class="about">
    <h1 class="content-heading">Contributor guide</h1>
    <p>
      An overview of how things work as a contributor so you can learn what to
      expect throughout the duration of a funding round.
    </p>
    <h2>Get funds on {{ chain.label }}</h2>
    <p>
      You'll need some {{ chain.currency }} on {{ chain.label }} in order to
      submit transactions to the clr.fund smart contracts.
      <span v-if="chain.label.includes('Arbitrum')">
        Follow
        <links to="https://arbitrum.io/bridge-tutorial/">this tutorial</links>
        to bridge your funds to {{ chain.label }}
      </span>
      <span v-else-if="chain.bridge">
        Use the
        <links :to="chain.bridge">{{ chain.label }} bridge</links>
        to transfer some funds.
      </span>
    </p>
    <p v-if="chain.isLayer2">
      Confused on what {{ chain.label }} is?
      <links to="/about/layer-2">
        Read our explanation on how clr.fund uses layer 2 on Ethereum.
      </links>
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
        wallet on the {{ chain.label }} network
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
        {{ nativeTokenSymbol }} on {{ chain.label }}.
        {{ nativeTokenSymbol }} can be easily purchased on any major
        Ethereum-focused exchange.
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
import { chain } from '@/api/core'
import { ChainInfo } from '@/plugins/Web3/constants/chains'

@Component({ components: { Links } })
export default class AboutContributors extends Vue {
  get nativeTokenSymbol(): string {
    const { nativeTokenSymbol } = this.$store.state.currentRound
    return nativeTokenSymbol
  }

  get chain(): ChainInfo {
    return chain
  }
}
</script>

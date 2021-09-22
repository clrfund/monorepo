<template>
  <div class="about">
    <h1 class="content-heading">About Layer 2</h1>

    <h2>Clr.fund on Layer 2</h2>
    <p>
      <b>
        tl;dr: clr.fund runds on
        <links
          to="https://ethereum.org/en/developers/docs/scaling/layer-2-rollups/"
          >Ethereum Layer 2 rollups</links
        >
        to help save you time and money when contributing to your favorite
        projects. You'll need a wallet with funds on Arbitrum to interact with
        this application.
      </b>
    </p>

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
      The main Ethereum blockchain, "layer 1," may be upgraded to reduce costs
      in the future (this is one of the goals of Eth2, which this clr.fund round
      is helping realize!).
    </p>
    <p>
      In the immediate term, though, "layer 2" solutions are already helping
      dramatically reduce costs. Most layer 2s are "rollups," blockchain-esque
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

    <h2>Arbitrum</h2>
    <p>
      There are many variations on the layer 2 rollup approach. This current
      clr.fund round uses Arbitrum, an "optimistic"-style rollup.
      <links to="https://developer.offchainlabs.com/docs/rollup_basics"
        >Learn more in the Arbitrum docs</links
      >.
    </p>

    <h2>What you'll need</h2>
    <ul>
      <li>A wallet that supports Arbitrum</li>
      <li>Funds on Abritrum</li>
    </ul>
    <h3>How to find wallet that supports Arbitrum</h3>
    <p>TODO</p>
    <h3>How to get funds on Arbitrum</h3>
    <p>TODO</p>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Links from '@/components/Links.vue'

@Component({ components: { Links } })
export default class AboutLayer2 extends Vue {}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.about {
  padding-bottom: 4rem;
}

.content-heading {
  border-bottom: $border;
}

h2 {
  font-family: 'Glacial Indifference', sans-serif;
  font-weight: bold;
  font-size: 32px;
  letter-spacing: -0.015em;
}

p {
  font-size: 16px;
  line-height: 150%;
}

li {
  font-size: 16px;
  line-height: 150%;
}
</style>

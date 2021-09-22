<template>
  <div class="about">
    <h1 class="content-heading">About</h1>

    <h2>What is clr.fund?</h2>
    <p>
      Clr.fund, pronounced "Clear Fund", is a protocol for efficiently
      allocating funds to public goods that benefit the Ethereum Network
      according to the preferences of the Ethereum Community. Clr.fund strives
      for credible neutrality, decentralization, permissionlessness,
      trustlessness, and pseudonymity.
    </p>

    <h2>Why does clr.fund exist?</h2>
    <p>
      Allocating funds towards
      <links to="/about/public-goods">public goods</links> — commodities or
      services that are neither excludable nor subtractable — is a challenge for
      any ecosystem, and Ethereum is no exception.
    </p>
    <p>
      Clr.fund’s goal is to enable funds to be allocated towards public goods
      that benefit the Ethereum Network without relying on centralized entities
      and in a way that reflects the preferences of the Ethereum Community.
    </p>
    <p>
      See the
      <links to="https://github.com/clrfund/constitution"
        >Clr.fund Constitution</links
      >
      for more detail on clr.fund’s goals and values.
    </p>

    <h2>How is clr.fund unique?</h2>
    <p>Clr.fund instances also have a number of other special properties:</p>
    <ul>
      <li>
        Decentralization — Major pieces of clr.fund's infrastructure are built
        on
        <links to="https://ethereum.org/en/what-is-ethereum/">Ethereum</links>,
        a programmable blockchain that provides a reliable, censorship-resistant
        ledger for clr.fund's voting and funding transactions.
        <links to="/about/decentralization"
          >Read more on clr.fund's decentralization</links
        >.
      </li>
      <li>
        Scalability — Because using Ethereum can be expensive for users,
        clr.fund uses "layer 2" supplementary networks to get most of the
        benefits of the main Ethereum network but with faster, cheaper
        transactions.
        <links to="/about/layer-2"
          >Learn more about clr.fund's user of layer 2.</links
        >
      </li>
      <li>
        Collusion-resistance — Since blockchains like Ethereum publish all data
        publicly by default, clr.fund contributors are vulnerable to bribery and
        other kinds of manipulation. Clr.fund helps prevent these attacks using
        magical math called zero-knowledge proofs.
        <links to="/about/maci"
          >Find out about MACI, our Minimal Anti-Collusion
          Infrastructure.</links
        >
      </li>
      <li>
        Sybil-resistance — Voting systems that care about the number of
        individual people voting for a given choice, as quadratic funding does,
        can be vulnerable to sybil attacks, in which one person sets up many
        identities in order to vote multiple times. Clr.fund mitigates this
        threat with an identity-system called BrightID.
        <links to="/about/sybil-resistance">Find out more about BrightID</links
        >.
      </li>
    </ul>
    <p>
      Clr.fund is also built so anyone can spin up and run their own instance to
      create a public goods grant program for their particular public.
    </p>

    <h2>How does it work?</h2>
    <p>
      The clr.fund protocol uses the Constrained Liberal Radicalism (CLR)
      algorithm, commonly called
      <links to="/about/quadratic-funding">quadratic funding</links> (QF), to
      facilitate monetary contributions from members of the Ethereum Community
      towards builders of Ethereum public goods.
    </p>
    <p>
      With its logic encoded into Ethereum smart contracts and other web3
      technologies, clr.fund requires minimal trust in any individual people or
      entities to function and is resilient to collusion and bribery.
    </p>

    <p>
      At a high-level, clr.fund consists of a matching pool and a funding round.
      Philanthropic individuals or organizations contribute to the matching pool
      so as to have those funds efficiently allocated according to community
      preference. Users contribute directly to projects they value and, in doing
      so, earn a share of the matching pool for the projects, along with their
      contribution. Effectively increasing the value of their contribution.
    </p>

    <p>
      Under the hood, clr.fund uses zero-knowledge proofs (ZK-SNARKS), courtesy
      of the
      <links to="/about/maci"
        >Minimal Anti-collusion Infrastructure (MACI)</links
      >, to keep individual contributions private and limit effectiveness of
      collusion and bribery.
    </p>
    <p>
      To ensure that every contributor is a unique person clr.fund uses
      <links to="/about/sybil-resistance">BrightID</links>.
    </p>
    <p>
      Still curious? Read more on
      <links to="/about/how-it-works">how clr.fund works</links>.
    </p>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Links from '@/components/Links.vue'

@Component({ components: { Links } })
export default class About extends Vue {}
</script>

<style scoped lang="scss">
/* TODO apply these styles across all About subpages  */
@import '../styles/vars';

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
  line-height: 30px;
}
</style>

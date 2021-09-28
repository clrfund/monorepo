<template>
  <div class="about">
    <h1 class="content-heading">Decentralization in Clr.fund</h1>
    <h2>What is Decentralization?</h2>
    <p>
      When we say something is "decentralized" in clr.fund and in web3 broadly,
      we mean that no single person, company, or other entity is solely
      responsible for running or maintaining it. Instead, a decentralized system
      is run or maintained by a large group of independent entities, coordinated
      by a set of rules each opts into, like miners in Ethereum or peers in
      BitTorrent.
    </p>

    <h2>Which pieces of clr.fund are decentralized?</h2>
    <p>
      Much of clr.fund's infrastructure is built on Ethereum, a decentralized
      blockchain:
    </p>
    <ul>
      <li>
        the registry of projects qualified for funding (and, potentially, the
        curation mechanism for choosing these projects)
      </li>
      <li>the matching pool of funds</li>
      <li>
        the sybil-resistant registry of users qualified to contribute to
        individual projects
      </li>
      <li>
        the funds from and encrypted information about contributions to
        individual projects
      </li>
      <li>
        the mechanism for distributing funds once a round's results are
        finalized
      </li>
    </ul>
    <p>
      Each of these pieces exists in an Ethereum smart contract (see the code
      <links to="https://github.com/clrfund/monorepo">here</links>), meaning its
      functionality is maintained by Ethereum miners, a decentralized group.
    </p>
    <h2>Why is clr.fund decentralized?</h2>
    <p>
      Ethereum's decentralization provides clr.fund with three main benefits:
    </p>
    <ol>
      <li>
        Transparent process — All of the decentralized pieces of clr.fund are
        publicly verifiable. Anyone can look at the code for the smart contracts
        and observe its inputs and outputs, with very little possibility that
        anything is being hidden or changed secretly.
      </li>
      <li>
        Secure voting — Because of Ethereum's strong security guarantees, anyone
        submitting a message can be extremely confident that their message will
        be processed as expected by the system. There are still security
        dangers, of course, such as
        <links to="/about/sybil-resistance">sybil attacks</links> or
        <links to="/about/maci">vote manipulation</links>, but the kind of "vote
        hacking" typically feared in digital voting is highly unlikely here.
      </li>
      <li>
        Public good — Everything on Ethereum is open source and permissionless,
        which means the code for clr.fund's decentralized infrastructure acts as
        a public good: anyone can deploy their own version of the system to
        create their own
        <links to="/about/quadratic-funding">quadratic funding</links> system,
        with the same decentralized benefits of the original.
      </li>
    </ol>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Links from '@/components/Links.vue'

@Component({ components: { Links } })
export default class AboutDecentralization extends Vue {}
</script>

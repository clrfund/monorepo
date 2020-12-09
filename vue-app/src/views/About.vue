<template>
  <div class="about">
    <h1 class="content-heading">About</h1>

    <h2>What is clr.fund?</h2>
    <p>Clr.fund is a protocol for efficiently allocating funds to public goods that benefit the Ethereum Network according to the preferences of the Ethereum Community. Clr.fund strives for credible neutrality, decentralization, permissionlessness, trustlessness, and pseudonymity.</p>

    <h2>Why does clr.fund exist?</h2>
    <p> Allocating funds towards public goods — commodities or services that deliver a net benefit even when they cannot be sold —  is a challenge for any ecosystem, and Ethereum is no exception.</p>
    <p>Clr.fund’s goal is to enable funds to be allocated towards public goods that benefit the Ethereum Network without relying on centralized entities and in a way that reflects the preferences of the Ethereum Community.</p>
    <p>See the <a href="https://github.com/clrfund/constitution" target="_blank" rel="noopener">Clr.fund Constitution</a> for more detail on Clr.fund’s goals and values.</p>

    <h2>How does it work?</h2>
    <p>The clr.fund protocol uses the <a href="https://blogchains.org/wp-content/uploads/sites/4/2019/04/SSRN-id3243656.pdf" target="_blank" rel="noopener">Constrained Liberal Radicalism (CLR)</a> algorithm, commonly called quadratic funding (QF), to facilitate monetary contributions from members of the Ethereum Community towards builders of Ethereum public goods.
    <p>With its logic encoded into Ethereum smart contracts and other web3 technologies, clr.fund requires minimal trust in any individual people or entities to function and is resilient to collusion and bribery.</p>

    <p>At a high-level, clr.fund consists of a matching pool and a funding round. Philanthropic individuals or organisations contribute to the matching pool so as to have those funds efficiently allocated according to community preference. Users contribute directly to projects they value and, in doing so, earn a share of the matching pool for the projects, along with their contribution. Effectively increasing the value of their contribution.</p>

    <p>Under the hood, clr.fund uses zero-knowledge proofs (zk-snarks), courtesy of the <a href="https://github.com/appliedzkp/maci" target="_blank" rel="noopener">Minimal Anti-collusion Infrastructure (MACI)</a>, to keep individual contributions private and limit effectiveness of collusion and bribery.</p>

    <p>Recipients are curated by our <a href="https://curate.kleros.io/tcr/0x2E3B10aBf091cdc53cC892A50daBDb432e220398" target="_blank" rel="noopener">Kleros TCR.</a></p>

    <p>Sybil resistance is manual for the first round (handled by a multisig of clr.fund contributors), but future iterations will rely on  <a href="https://brightid.org" target="_blank" rel="noopener">BrightID</a> for more permissionless and trustless Sybil resistance.</p>

  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

@Component({
  name: 'about',
  metaInfo: { title: 'About' },
})
export default class About extends Vue { }
</script>

<style scoped lang="scss">
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

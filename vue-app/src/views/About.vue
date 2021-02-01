<template>
  <div class="about">
    <h1 class="content-heading">About</h1>

    <h2>What is this?</h2>
<<<<<<< HEAD
<<<<<<< HEAD
    <p>A first for ETHDenver, the Open Track prizes will be distributed via Quadratic Funding (wtf is Quadratic Funding? Learn more at <a href="https://wtfisqf.com" target="_blank" rel="noopener">wtfisqf.com</a>).</p>
=======
    <p>A first for ETHDenver, the Open Track prizes will be distributed via Quadratic Funding (wtf it qf? Learn more at <a href="https://wtfisqf.com" target="_blank" rel="noopener">wtfisqf.com</a>).</p>
>>>>>>> Ethdenver setup
=======
    <p>A first for ETHDenver, the Open Track prizes will be distributed via Quadratic Funding (wtf is Quadratic Funding? Learn more at <a href="https://wtfisqf.com" target="_blank" rel="noopener">wtfisqf.com</a>).</p>
>>>>>>> fixed typo

    <h2>How does it work?</h2>
    <p>The top 20 projects, as selected by the judges, will progress to the quadratic funding round and be given the opportunity to present on stage.</p>
    <p>Celebrity judges and Round 1 judges will allocate prize funding to their favorite projects with ETHDenver contributing matching funds quadratically.</p>

    <h2>Can I judge?</h2>
    <p>Of course!</p>
    <p>All ETHDenver attendees who vote on how the matching pool should be allocated by contributing xDai to their favorite projects. Just make sure to log in with the Ethereum address you provided in the ETHDenver signup form.</p>

    <h2>How do I vote?</h2>
    <p>To vote, simply <a href="https://www.xdaichain.com/for-users/wallets/metamask/metamask-setup" target="_blank" rel="noopener">connect your metamask to xDai</a>, hit the "contribute" button next to any projects that you want to vote for, and allocate any amount of xDai to each of the projects you selected. Remember, your vote weight for each project is the square root of the amount of xDai you contribute to that project.</p>

    <h2>Where can I get xDai?</h2>
    <p>Don't have any xDai yet? No worries.</p>
    <p>If you have Dai on mainnet, you can bridge it over to xDai using the <a href="https://bridge.xdaichain.com/" target="_blank" rel="noopener">xDai bridge</a></p>
    <p>Alternatively, you can buy xDai with a credit/debit card on <a href="https://honeyswap.org/" target="_blank" rel="noopener">Honeyswap</a>

    <h2>What's under the hood?</h2>
    <p>ETHDenver's Quadratic Funding round is powered by <a href="https://clr.fund" target="_blank" rel="noopener">clr.fund</a>, a QF protocol built on Ethereum using Zero Knowledge Proofs (courtesy of the <a href="https://github.com/appliedzkp/maci" target="_blank" rel="noopener">MACI</a>).</p>
<<<<<<< HEAD
<<<<<<< HEAD
    <p>Clr.fund is a protocol for efficiently allocating funds to public goods that benefit the Ethereum Network according to the preferences of the Ethereum Community. Clr.fund strives for credible neutrality, decentralization, permissionlessness, trustlessness, and pseudonymity.</p>
    <p>Want to learn more or contribute? Check out the <a href="https://forumclr.fund" target="_blank" rel="noopener">clr.fund forum</a> or <a href="https://t.me/clrfund" target="_blank" rel="noopener">Telegram group</a>.</p>
=======
>>>>>>> Ethdenver setup
=======
    <p>Clr.fund is a protocol for efficiently allocating funds to public goods that benefit the Ethereum Network according to the preferences of the Ethereum Community. Clr.fund strives for credible neutrality, decentralization, permissionlessness, trustlessness, and pseudonymity.</p>
    <p>Want to learn more or contribute? Check out the <a href="https://forumclr.fund" target="_blank" rel="noopener">clr.fund forum</a> or <a href="https://t.me/clrfund" target="_blank" rel="noopener">Telegram group</a>.</p>
>>>>>>> prep demo
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

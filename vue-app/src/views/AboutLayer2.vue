<template>
  <div class="about">
    <h1 class="content-heading">[Layer 2]</h1>

    <h2>Layer 2</h2>
    <p>
      <b
        >tl;dr: if you want to create loads of accounts to vote for your
        favourite projects multiple times, you're ngmi (not going to make it)</b
      >
    </p>
    <p>
      This funding round is on Layer 2 to help save you time and money when
      contributing to your favourite projects.
    </p>

    <h2>Why Layer2?</h2>
    <p>
      As a decentralized funding product, you'll need to submit a few
      transactions on the way to contributing to your favourite Eth2 projects.
      On mainnet, this would lead to quite a bill of transaction fees. We've
      opted to use [layer 2 solution], so your transaction fees are at a
      fraction of the cost and a lot quicker too.
    </p>
    <h2>What you'll need</h2>
    <ul>
      <li>a wallet that support [layer 2 solution]</li>
      <li>a wallet that support [layer 2 solution]</li>
    </ul>
    <h2>How to get L2 funds</h2>
    <p>tbc</p>
    <h2>More</h2>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

@Component
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

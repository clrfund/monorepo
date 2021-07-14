<template>
  <div class="about">
    <h1 class="content-heading">Sybil resistance and BrightID</h1>

    <h2>What is BrightID?</h2>
    <p>
      <b
        >tl;dr: if you want to create loads of accounts to vote for your
        favourite projects multiple times, you're ngmi (not going to make it)</b
      >
    </p>
    <p>
      We use BrightID to protect the funding round against sybil attacks. To
      understand why this is important let's recap quadratic funding...
    </p>

    <h2>Quadratic funding</h2>
    <p>
      Quadratic funding is a democratic form of funding goods/services. A pot of
      money, known as the matching pool, is distributed to all the projects
      based on a formula. In the simplest terms, a project with 10 donations of
      1 Dai could get more from the matching pool than a project with a single
      100 Dai donation. The idea is that the projects with the most value to the
      most amount of people (and not necessarily the wealthiest people) gets the
      best funding.
    </p>
    <p>
      This falls apart if anyone can create multiple accounts and spam-donate to
      a project. This is known as a sybil attack. To keep things fair we have to
      be confident that you as an individual only contributed once. And that you
      didn't create multiple Ethereum wallets and contribute from them all. This
      is where BrightID steps in.
    </p>
    <h2>How BrightID helps</h2>
    <p>
      BrightID is a product we use to increase our confidence that you're only
      contributing once. Before you contribute, you must link your connected
      wallet to your BrightID profile on your phone and register for the round
      via a transaction. You can't link multiple wallets to the same BrightID
      profile. This prevents you from creating 1000s of Ethereum accounts and
      distorting the contributions.
    </p>
    <h2>How to set up BrightID</h2>
    <p>
      The app will walk you through getting set up, but here's a quick out line
      of what you can expect. If you've contributed to a clr.fund round before
      or used BrightID with Gitcoin grants your experience will be shorter.
    </p>
    <ul>
      <li>
        Download BrightID for
        <a href="https://apps.apple.com/us/app/brightid/id1428946820">iOS</a> or
        <a href="https://play.google.com/store/apps/details?id=org.brightid"
          >Android</a
        >
      </li>
      <li>
        Link your wallet to your BrightID profile, so you can't use multiple
        wallets to sway voting.
      </li>
      <li>
        Get BrightID verified so BrightID knows you're a human and not a bot.
      </li>
      <li>
        Pay a small transaction fee to cover BrightID's costs, also known as
        sponsorship.
        <a href="https://medium.com/brightid/brightid-sponsorships-5327a8d39f1e"
          >More on BrightID sponsorship</a
        >
      </li>
      <li>
        Add yourself to the approved user registry. This is a requirement for
        <router-link to="/about-maci">MACI, our anti-bribery tech</router-link>.
      </li>
    </ul>
    <h2>More</h2>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

@Component
export default class AboutSybilAttacks extends Vue {}
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

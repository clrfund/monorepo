<template>
  <div class="about">
    <h1 class="content-heading">About Sybil Resistance</h1>

    <h2>What are Sybil attacks?</h2>
    <p>
      A "sybil attack" is when one person pretends to be many people in order to
      subvert a system's rules. The more a system depends on each participant
      being a single, unique person, the more potentially vulnerable it is to
      sybil attacks. Social media is somewhat vulnerable: bots creating email
      spam and fake follows or likes are examples of relatively toothless sybil
      attacks. Digital voting systems are more vulnerable: if an attacker can
      create enough fake users to swing a vote, there can be significant and
      concrete consequences. Since clr.fund uses
      <links to="/about/quadratic-funding">quadratic funding</links>, which is
      essentially a voting system, sybil attacks are a serious threat.
    </p>
    <p>
      In the physical world, sybil attacks are hard to pull off. It's pretty
      difficult to pretend to be someone else for long, especially when most
      governments issue and check photo IDs and ID numbers. On the internet,
      though, nobody knows you're a dog. People don't want to share their
      personal information online and government IDs are impractical for
      borderless web services, so historically, we haven't had strong methods to
      stop online sybil attacks.
    </p>

    <h2>Sybil Resistance and BrightID</h2>
    <p>
      BrightID is a platform we use to increase our confidence that you're only
      contributing once. BrightID is one of a new class of digital identity
      solutions for use cases like clr.fund that require digital sybil
      resistance.
    </p>
    <p>
      BrightID works using a web-of-trust model: users connect their BrightID
      accounts with people they trust to be unique humans (generally because
      they know them personally) and form groups. These connections are public,
      but users' personal data aren't. If you connect your BrightID to an app,
      the app can analyze your connections and decide whether or not to allow
      you access based on how likely you are to be a unique person. The graph of
      BrightID connections can be analyzed with any method, but generally, the
      more connections an ID has with other trustworthy-looking IDs, the more
      trustworthy it is.
    </p>
    <p>
      To contribute to projects in a clr.fund round, you must connect a verified
      BrightID with the clr.fund app. This prevents you from creating 1000s of
      Ethereum accounts and distorting the contributions.
    </p>
    <p>
      <links to="/verify">Get verified by following the directions here</links>.
    </p>

    <h2>How to set up BrightID</h2>
    <p>
      The app walks you through <links to="/verify">getting set up</links>, but
      here's a quick look at what you can expect:
    </p>
    <ol>
      <li>
        Download BrightID for
        <links to="https://apps.apple.com/us/app/brightid/id1428946820"
          >iOS</links
        >
        or
        <links to="https://play.google.com/store/apps/details?id=org.brightid"
          >Android</links
        >
      </li>
      <li>
        Link your wallet to your BrightID profile, so you can't use multiple
        Ethereum addresses to sway voting.
      </li>
      <li>Get verified in BrightID so we know you're a human and not a bot.</li>
      <li>
        Submit a transaction for clr.fund to sponsor you in BrightID
        <links
          to="https://medium.com/brightid/brightid-sponsorships-5327a8d39f1e"
          >More on BrightID sponsorship</links
        >
      </li>
      <li>
        Add yourself to the clr.fund user registry. This is a requirement for
        <links to="/about/maci">MACI, our anti-bribery tech</links>.
      </li>
    </ol>
    <p>
      Note that you should only link one Ethereum address to your BrightID
      profile. If you repeat our verification process and add another Ethereum
      address, all contributions from you previous address will be ignored by
      the matching pool. This is again to avoid sybil attacks.
    </p>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Links from '@/components/Links.vue'

@Component({ components: { Links } })
export default class AboutSybilResistance extends Vue {}
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

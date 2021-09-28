<template>
  <div class="about">
    <h1 class="content-heading">Recipient guide</h1>
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
    <h2>Register your project</h2>
    <ol>
      <li>Head over to the <links to="/join">Join page</links>.</li>
      <li>
        Click "See round criteria" and familiarize yourself with the criteria
        for projects.
      </li>
      <li>
        Once you're familiar with the criteria and you're sure your project
        meets them, click "Add project." You'll see a series of forms to fill
        out asking for more information about your project.
      </li>
      <li>
        With the forms finished, you can finish your submission by:
        <ol>
          <li>connecting to the right network via your wallet of choice</li>
          <li>sending a deposit of 0.1 ETH to the registry contract.</li>
        </ol>
        Projects are accepted by default, but the registry admin may remove
        projects that don't meet the criteria. Either way, your ETH will be
        returned once your application has been either accepted or denied. Note
        that metadata pointing to all your project information (but not contact
        information) will be stored publicly on-chain.
      </li>
    </ol>
    <h2>Claim your funds</h2>
    <p>
      After a clr.fund round is finished, it's simple to claim your project's
      share of the funding. Return to your project's page: you will see a "claim
      funds" button if your project received contributions during the round.
      Submit the claim transaction to receive your funds.
    </p>
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

@Component({ components: { Links } })
export default class AboutRecipients extends Vue {}
</script>
